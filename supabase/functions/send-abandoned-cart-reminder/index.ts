import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface AbandonedCartRequest {
  customerEmail: string;
  customerName: string;
  cartItems: CartItem[];
  cartTotal: number;
  cartUrl?: string;
  reminderType?: 'first' | 'second' | 'final';
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
          fromName: "Store",
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
    console.error("Resend API error:", emailResponse);
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
      customerEmail,
      customerName,
      cartItems,
      cartTotal,
      cartUrl = '/cart',
      reminderType = 'first',
    }: AbandonedCartRequest = await req.json();

    if (!customerEmail || !cartItems || cartItems.length === 0) {
      throw new Error("Missing required fields: customerEmail and cartItems are required");
    }

    console.log(`Sending abandoned cart reminder (${reminderType}) to ${customerEmail}`);

    const emailConfig = await getEmailConfig();
    if (!emailConfig) {
      throw new Error("Email service not configured. Please configure email settings in Settings > Alerts.");
    }

    console.log("Using email provider:", emailConfig.provider);

    const getSubjectAndUrgency = () => {
      switch (reminderType) {
        case 'first':
          return {
            subject: `🛒 You left something behind!`,
            urgencyText: 'Complete your purchase before items sell out!',
            discount: null,
          };
        case 'second':
          return {
            subject: `⏰ Your cart is waiting for you!`,
            urgencyText: 'Items in your cart are selling fast. Don\'t miss out!',
            discount: null,
          };
        case 'final':
          return {
            subject: `🎁 Final reminder: 10% off your cart!`,
            urgencyText: 'Use code COMEBACK10 for 10% off - valid for 24 hours only!',
            discount: 'COMEBACK10',
          };
        default:
          return {
            subject: `🛒 You left something behind!`,
            urgencyText: 'Complete your purchase before items sell out!',
            discount: null,
          };
      }
    };

    const { subject, urgencyText, discount } = getSubjectAndUrgency();
    const storeName = emailConfig.fromName || "Store";

    const itemsHtml = cartItems
      .map((item) => `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">` : ''}
              <div>
                <p style="margin: 0; font-weight: 500; color: #111827;">${item.name}</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Qty: ${item.quantity}</p>
              </div>
            </div>
          </td>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            <p style="margin: 0; font-weight: 600; color: #111827;">৳${(item.price * item.quantity).toLocaleString()}</p>
          </td>
        </tr>
      `)
      .join("");

    const discountHtml = discount ? `
      <div style="background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="color: white; margin: 0 0 8px 0; font-size: 14px;">Special Discount Code</p>
        <p style="color: white; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">${discount}</p>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">10% off your entire order</p>
      </div>
    ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 32px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
                <h1 style="color: white; margin: 0; font-size: 24px;">Your Cart Misses You!</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px;">
                <p style="color: #374151; font-size: 16px; margin-bottom: 8px;">
                  Hi <strong>${customerName || 'there'}</strong>,
                </p>
                <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                  We noticed you left some amazing items in your cart. ${urgencyText}
                </p>
                
                ${discountHtml}
                
                <!-- Cart Items -->
                <div style="background-color: #f9fafb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </div>
                
                <!-- Cart Total -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background-color: #f3f4f6; border-radius: 8px; margin-bottom: 24px;">
                  <span style="color: #374151; font-size: 16px; font-weight: 500;">Cart Total</span>
                  <span style="color: #8b5cf6; font-size: 24px; font-weight: bold;">৳${cartTotal.toLocaleString()}</span>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${cartUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);">
                    Complete My Order
                  </a>
                </div>
                
                <!-- Trust Badges -->
                <div style="display: flex; justify-content: center; gap: 24px; margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
                  <div style="text-align: center;">
                    <span style="font-size: 24px;">🔒</span>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Secure Checkout</p>
                  </div>
                  <div style="text-align: center;">
                    <span style="font-size: 24px;">🚚</span>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Fast Delivery</p>
                  </div>
                  <div style="text-align: center;">
                    <span style="font-size: 24px;">↩️</span>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Easy Returns</p>
                  </div>
                </div>
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  If you've already completed your purchase, please ignore this email.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 24px; text-align: center;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
                  Questions? Reply to this email or contact our support team.
                </p>
                <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                  © ${new Date().getFullYear()} ${storeName}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const fromEmail = emailConfig.provider === "gmail" 
      ? emailConfig.gmailUser! 
      : (emailConfig.fromEmail || "onboarding@resend.dev");
    
    const fromAddress = `${storeName} <${fromEmail}>`;

    let result;
    if (emailConfig.provider === "gmail") {
      result = await sendWithGmail(emailConfig, customerEmail, subject, emailHtml, fromAddress);
    } else {
      result = await sendWithResend(emailConfig, customerEmail, subject, emailHtml, fromAddress);
    }

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log("Abandoned cart reminder sent successfully:", result.data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result.data,
        reminderType,
        itemCount: cartItems.length,
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending abandoned cart reminder:", error);
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
