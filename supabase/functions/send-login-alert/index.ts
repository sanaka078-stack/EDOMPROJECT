import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailConfig {
  provider: 'resend' | 'gmail';
  apiKey: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
  gmailUser?: string;
  gmailAppPassword?: string;
}

interface LoginAlertRequest {
  email: string;
  userName: string;
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
    isMobile: boolean;
  };
  ipAddress?: string;
  loginTime: string;
  isNewDevice: boolean;
  location?: string;
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
    if (!config.isEnabled) {
      console.log("Email config disabled");
      return null;
    }
    
    // Validate based on provider
    if (config.provider === 'gmail') {
      if (!config.gmailUser || !config.gmailAppPassword) {
        console.log("Gmail credentials not configured");
        return null;
      }
    } else {
      if (!config.apiKey) {
        console.log("Resend API key not configured");
        return null;
      }
    }
    
    return config;
  } catch (error) {
    console.error("Error getting email config:", error);
    return null;
  }
}

async function sendWithResend(emailConfig: EmailConfig, to: string, subject: string, html: string) {
  const fromAddress = emailConfig.fromEmail 
    ? `${emailConfig.fromName || 'Security Alert'} <${emailConfig.fromEmail}>`
    : "Security Alert <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${emailConfig.apiKey}`,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  const emailResponse = await res.json();

  if (!res.ok) {
    throw new Error(emailResponse.message || "Failed to send email via Resend");
  }

  return emailResponse;
}

async function sendWithGmail(emailConfig: EmailConfig, to: string, subject: string, html: string) {
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

  try {
    await client.send({
      from: emailConfig.fromName 
        ? `${emailConfig.fromName} <${emailConfig.gmailUser}>` 
        : emailConfig.gmailUser!,
      to: to,
      subject: subject,
      content: "auto",
      html: html,
    });

    await client.close();
    return { id: `gmail-${Date.now()}`, success: true };
  } catch (error) {
    await client.close();
    throw error;
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
      deviceInfo, 
      ipAddress, 
      loginTime,
      isNewDevice,
      location 
    }: LoginAlertRequest = await req.json();

    console.log("Sending login alert email to:", email);
    console.log("Device info:", deviceInfo);
    console.log("Is new device:", isNewDevice);

    if (!email || !deviceInfo) {
      throw new Error("Missing required fields: email and deviceInfo are required");
    }

    const emailConfig = await getEmailConfig();
    if (!emailConfig) {
      throw new Error("Email service not configured. Please configure email settings in Settings > Alerts.");
    }

    console.log("Using email provider:", emailConfig.provider);

    const deviceEmoji = deviceInfo.isMobile ? "📱" : "💻";
    const alertType = isNewDevice ? "🚨 New Device Login Alert" : "🔔 Login Notification";
    const alertColor = isNewDevice ? "#ef4444" : "#3b82f6";
    
    const formattedTime = new Date(loginTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${alertType}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, ${alertColor} 0%, ${isNewDevice ? '#dc2626' : '#2563eb'} 100%); padding: 32px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                        ${alertType}
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="color: #18181b; font-size: 16px; margin: 0 0 24px 0; line-height: 1.6;">
                        Hi ${userName || 'there'},
                      </p>
                      
                      ${isNewDevice ? `
                      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                        <p style="color: #991b1b; margin: 0; font-weight: 600;">
                          ⚠️ We detected a login from a new device that hasn't been used before.
                        </p>
                      </div>
                      ` : `
                      <p style="color: #52525b; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
                        We noticed a new sign-in to your account.
                      </p>
                      `}
                      
                      <!-- Device Details Card -->
                      <div style="background-color: #f4f4f5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="color: #18181b; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
                          ${deviceEmoji} Device Details
                        </h3>
                        
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                              <span style="color: #71717a; font-size: 14px;">Device</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                              <span style="color: #18181b; font-size: 14px; font-weight: 500;">${deviceInfo.device}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                              <span style="color: #71717a; font-size: 14px;">Browser</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                              <span style="color: #18181b; font-size: 14px; font-weight: 500;">${deviceInfo.browser}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                              <span style="color: #71717a; font-size: 14px;">Operating System</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                              <span style="color: #18181b; font-size: 14px; font-weight: 500;">${deviceInfo.os}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                              <span style="color: #71717a; font-size: 14px;">Time</span>
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                              <span style="color: #18181b; font-size: 14px; font-weight: 500;">${formattedTime}</span>
                            </td>
                          </tr>
                          ${ipAddress ? `
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #71717a; font-size: 14px;">IP Address</span>
                            </td>
                            <td style="padding: 8px 0; text-align: right;">
                              <span style="color: #18181b; font-size: 14px; font-weight: 500;">${ipAddress}</span>
                            </td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>
                      
                      ${isNewDevice ? `
                      <div style="background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                          <strong>If this wasn't you:</strong><br>
                          1. Change your password immediately<br>
                          2. Review your active sessions<br>
                          3. Enable two-factor authentication if not already enabled
                        </p>
                      </div>
                      ` : ''}
                      
                      <p style="color: #52525b; font-size: 14px; margin: 0; line-height: 1.6;">
                        If you recognize this activity, no action is needed. Otherwise, please secure your account immediately.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f4f4f5; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;">
                      <p style="color: #71717a; font-size: 12px; margin: 0; line-height: 1.6;">
                        This is an automated security alert from your account.<br>
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

    const subject = isNewDevice 
      ? `🚨 New Device Login Detected - ${deviceInfo.browser} on ${deviceInfo.os}`
      : `🔔 New Login - ${deviceInfo.browser} on ${deviceInfo.os}`;

    let emailResponse;
    
    if (emailConfig.provider === 'gmail') {
      emailResponse = await sendWithGmail(emailConfig, email, subject, emailHtml);
    } else {
      emailResponse = await sendWithResend(emailConfig, email, subject, emailHtml);
    }

    console.log("Login alert email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-login-alert function:", error);
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
