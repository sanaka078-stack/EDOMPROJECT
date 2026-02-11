import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailConfig {
  provider: string;
  apiKey?: string;
  gmailUser?: string;
  gmailAppPassword?: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
}

interface UnlockAlertRequest {
  email: string;
  userName?: string;
  unlockedBy?: string;
  wasAutoUnlock: boolean;
}

async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from("store_settings")
      .select("setting_value")
      .eq("key", "email_api_config")
      .single();
    
    if (error || !data?.setting_value) {
      console.log("Email config not found in store_settings, checking env...");
      const envApiKey = Deno.env.get("RESEND_API_KEY");
      if (envApiKey) {
        return {
          provider: "resend",
          apiKey: envApiKey,
          fromEmail: "onboarding@resend.dev",
          fromName: "Security Alert",
          isEnabled: true,
        };
      }
      return null;
    }
    
    const config = JSON.parse(data.setting_value);
    
    if (config.provider === "gmail") {
      if (!config.gmailUser || !config.gmailAppPassword || !config.isEnabled) {
        console.log("Gmail config disabled or missing credentials");
        return null;
      }
    } else {
      if (!config.apiKey || !config.isEnabled) {
        console.log("Email config disabled or no API key");
        return null;
      }
    }
    
    return config;
  } catch (error) {
    console.error("Error getting email config:", error);
    return null;
  }
}

async function sendWithResend(
  emailConfig: EmailConfig,
  to: string,
  subject: string,
  html: string,
  fromAddress: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${emailConfig.apiKey}`,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject,
      html,
    }),
  });

  const emailResponse = await res.json();

  if (!res.ok) {
    return { success: false, error: emailResponse.message || "Failed to send email via Resend" };
  }

  return { success: true, data: emailResponse };
}

async function sendWithGmail(
  emailConfig: EmailConfig,
  to: string,
  subject: string,
  html: string,
  fromAddress: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: emailConfig.gmailUser!,
          password: emailConfig.gmailAppPassword!,
        },
      },
    });

    await client.send({
      from: fromAddress,
      to: to,
      subject: subject,
      content: "Please view this email in an HTML-compatible email client.",
      html: html,
    });

    await client.close();

    return { success: true, data: { id: `gmail-${Date.now()}`, success: true } };
  } catch (error: any) {
    console.error("Gmail SMTP error:", error);
    return { success: false, error: error.message || "Failed to send email via Gmail" };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      userName, 
      unlockedBy,
      wasAutoUnlock = false,
    }: UnlockAlertRequest = await req.json();

    console.log("Sending unlock alert email to:", email);
    console.log("Was auto unlock:", wasAutoUnlock);

    if (!email) {
      throw new Error("Missing required field: email");
    }

    const emailConfig = await getEmailConfig();
    if (!emailConfig) {
      throw new Error("Email service not configured. Please configure email settings in Settings > Alerts.");
    }

    console.log("Using email provider:", emailConfig.provider);

    const unlockMethod = wasAutoUnlock 
      ? "Your account lock has expired and was automatically unlocked."
      : `Your account has been manually unlocked${unlockedBy ? ' by an administrator' : ''}.`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Unlocked - Security Notice</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 16px;">🔓</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                        Account Unlocked
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="color: #18181b; font-size: 16px; margin: 0 0 24px 0; line-height: 1.6;">
                        Hi ${userName || 'there'},
                      </p>
                      
                      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                        <p style="color: #166534; margin: 0; font-weight: 600;">
                          ✓ ${unlockMethod}
                        </p>
                      </div>
                      
                      <p style="color: #52525b; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
                        You can now log in to your account again. If you've forgotten your password, 
                        please use the "Forgot Password" option on the login page.
                      </p>
                      
                      <!-- Security Recommendations -->
                      <div style="background-color: #fefce8; border: 1px solid #facc15; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <p style="color: #854d0e; margin: 0 0 12px 0; font-weight: 600;">
                          🛡️ Security Recommendations:
                        </p>
                        <ul style="color: #854d0e; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                          <li>Consider changing your password if you didn't cause the lockout</li>
                          <li>Enable two-factor authentication for extra security</li>
                          <li>Review your recent login activity in account settings</li>
                        </ul>
                      </div>
                      
                      <!-- Status Card -->
                      <div style="background-color: #f4f4f5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="color: #18181b; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
                          📊 Account Status
                        </h3>
                        
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                              <span style="color: #71717a; font-size: 14px;">Status</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                              <span style="color: #22c55e; font-size: 14px; font-weight: 600;">✓ Active</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                              <span style="color: #71717a; font-size: 14px;">Unlocked At</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                              <span style="color: #18181b; font-size: 14px; font-weight: 500;">${new Date().toLocaleString('en-US', { 
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #71717a; font-size: 14px;">Method</span>
                            </td>
                            <td style="padding: 8px 0; text-align: right;">
                              <span style="color: #18181b; font-size: 14px; font-weight: 500;">${wasAutoUnlock ? 'Automatic (expired)' : 'Manual (by admin)'}</span>
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      <p style="color: #52525b; font-size: 14px; margin: 0; line-height: 1.6;">
                        If you have any questions or concerns, please don't hesitate to contact our support team.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f4f4f5; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;">
                      <p style="color: #71717a; font-size: 12px; margin: 0; line-height: 1.6;">
                        This is an automated security notice from your account.<br>
                        Please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const fromEmail = emailConfig.provider === "gmail" 
      ? emailConfig.gmailUser! 
      : (emailConfig.fromEmail || "onboarding@resend.dev");
    
    const fromAddress = `Security Alert <${fromEmail}>`;
    const subject = "🔓 Your Account Has Been Unlocked";

    let result;
    if (emailConfig.provider === "gmail") {
      result = await sendWithGmail(emailConfig, email, subject, emailHtml, fromAddress);
    } else {
      result = await sendWithResend(emailConfig, email, subject, emailHtml, fromAddress);
    }

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log("Unlock alert email sent successfully:", result.data);

    return new Response(JSON.stringify({ success: true, data: result.data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-unlock-alert function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
