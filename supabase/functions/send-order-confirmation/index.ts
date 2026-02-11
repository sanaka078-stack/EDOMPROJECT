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

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationRequest {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: string;
  paymentMethod: string;
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
    
    // Check if provider is configured properly
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
      customerEmail,
      customerName,
      orderNumber,
      items,
      subtotal,
      shippingCost,
      total,
      shippingAddress,
      paymentMethod,
    }: OrderConfirmationRequest = await req.json();

    console.log(`Sending order confirmation to ${customerEmail} for order ${orderNumber}`);

    const emailConfig = await getEmailConfig();
    if (!emailConfig) {
      throw new Error("Email service not configured. Please configure email settings in Settings > Alerts.");
    }

    console.log("Using email provider:", emailConfig.provider);

    // Build items HTML
    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">৳${item.price.toLocaleString()}</td>
        </tr>
      `
      )
      .join("");

    const storeName = emailConfig.fromName || "Store";

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
              <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px;">
                <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                  Hi <strong>${customerName}</strong>,
                </p>
                <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                  Thank you for your order! We've received your order and will begin processing it shortly.
                </p>
                
                <!-- Order Number -->
                <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
                  <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">Order Number</p>
                  <p style="color: #111827; margin: 0; font-size: 24px; font-weight: bold;">${orderNumber}</p>
                </div>
                
                <!-- Order Items -->
                <h3 style="color: #111827; margin-bottom: 16px;">Order Details</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                  <thead>
                    <tr style="background-color: #f9fafb;">
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                      <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
                
                <!-- Totals -->
                <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-bottom: 24px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280;">Subtotal</span>
                    <span style="color: #374151;">৳${subtotal.toLocaleString()}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280;">Shipping</span>
                    <span style="color: #374151;">${shippingCost === 0 ? "Free" : `৳${shippingCost.toLocaleString()}`}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                    <span style="color: #111827;">Total</span>
                    <span style="color: #f97316;">৳${total.toLocaleString()}</span>
                  </div>
                </div>
                
                <!-- Shipping Address -->
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <h4 style="color: #111827; margin: 0 0 8px 0;">Shipping Address</h4>
                  <p style="color: #6b7280; margin: 0; white-space: pre-line;">${shippingAddress}</p>
                </div>
                
                <!-- Payment Method -->
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <h4 style="color: #111827; margin: 0 0 8px 0;">Payment Method</h4>
                  <p style="color: #6b7280; margin: 0;">${paymentMethod}</p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px;">
                  If you have any questions, feel free to reply to this email.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 24px; text-align: center;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
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
    const subject = `Order Confirmed - ${orderNumber}`;

    let result;
    if (emailConfig.provider === "gmail") {
      result = await sendWithGmail(emailConfig, customerEmail, subject, emailHtml, fromAddress);
    } else {
      result = await sendWithResend(emailConfig, customerEmail, subject, emailHtml, fromAddress);
    }

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log("Email sent successfully:", result.data);

    return new Response(JSON.stringify({ success: true, data: result.data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending order confirmation:", error);
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
