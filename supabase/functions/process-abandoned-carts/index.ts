import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Time thresholds for reminders (in hours)
const FIRST_REMINDER_HOURS = 1;
const SECOND_REMINDER_HOURS = 24;
const FINAL_REMINDER_HOURS = 72;

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface AbandonedCart {
  id: string;
  session_id: string;
  customer_email: string | null;
  customer_name: string | null;
  cart_items: CartItem[];
  cart_total: number;
  abandoned_at: string;
  reminder_sent_count: number;
  first_reminder_sent_at: string | null;
  second_reminder_sent_at: string | null;
  final_reminder_sent_at: string | null;
}

async function sendAbandonedCartEmail(
  cart: AbandonedCart, 
  reminderType: 'first' | 'second' | 'final'
): Promise<boolean> {
  if (!cart.customer_email) {
    console.log(`No email for cart ${cart.id}, skipping`);
    return false;
  }

  try {
    // Get subject and urgency based on reminder type
    const getEmailContent = () => {
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
      }
    };

    const { subject, urgencyText, discount } = getEmailContent();

    // Build cart items HTML
    const itemsHtml = cart.cart_items
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
              <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 32px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
                <h1 style="color: white; margin: 0; font-size: 24px;">Your Cart Misses You!</h1>
              </div>
              
              <div style="padding: 32px;">
                <p style="color: #374151; font-size: 16px; margin-bottom: 8px;">
                  Hi <strong>${cart.customer_name || 'there'}</strong>,
                </p>
                <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                  We noticed you left some amazing items in your cart. ${urgencyText}
                </p>
                
                ${discountHtml}
                
                <div style="background-color: #f9fafb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background-color: #f3f4f6; border-radius: 8px; margin-bottom: 24px;">
                  <span style="color: #374151; font-size: 16px; font-weight: 500;">Cart Total</span>
                  <span style="color: #8b5cf6; font-size: 24px; font-weight: bold;">৳${cart.cart_total.toLocaleString()}</span>
                </div>
                
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);">
                    Complete My Order
                  </a>
                </div>
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  If you've already completed your purchase, please ignore this email.
                </p>
              </div>
              
              <div style="background-color: #f9fafb; padding: 24px; text-align: center;">
                <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                  © ${new Date().getFullYear()} Ekta Clothing. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Ekta Clothing <onboarding@resend.dev>",
        to: [cart.customer_email],
        subject: subject,
        html: emailHtml,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      return false;
    }

    console.log(`Sent ${reminderType} reminder to ${cart.customer_email}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const now = new Date();
    const results = {
      processed: 0,
      firstReminders: 0,
      secondReminders: 0,
      finalReminders: 0,
      errors: 0,
    };

    // Get abandoned carts that need reminders
    const { data: abandonedCarts, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .not('abandoned_at', 'is', null)
      .is('recovered_at', null)
      .not('customer_email', 'is', null)
      .lt('reminder_sent_count', 3);

    if (error) {
      throw error;
    }

    console.log(`Found ${abandonedCarts?.length || 0} abandoned carts to process`);

    for (const cart of abandonedCarts || []) {
      const abandonedAt = new Date(cart.abandoned_at);
      const hoursSinceAbandoned = (now.getTime() - abandonedAt.getTime()) / (1000 * 60 * 60);
      
      let reminderType: 'first' | 'second' | 'final' | null = null;
      let updateField: string | null = null;

      // Determine which reminder to send
      if (cart.reminder_sent_count === 0 && hoursSinceAbandoned >= FIRST_REMINDER_HOURS) {
        reminderType = 'first';
        updateField = 'first_reminder_sent_at';
      } else if (cart.reminder_sent_count === 1 && hoursSinceAbandoned >= SECOND_REMINDER_HOURS) {
        reminderType = 'second';
        updateField = 'second_reminder_sent_at';
      } else if (cart.reminder_sent_count === 2 && hoursSinceAbandoned >= FINAL_REMINDER_HOURS) {
        reminderType = 'final';
        updateField = 'final_reminder_sent_at';
      }

      if (reminderType && updateField) {
        const sent = await sendAbandonedCartEmail(cart as AbandonedCart, reminderType);
        
        if (sent) {
          // Update the cart record
          await supabase
            .from('abandoned_carts')
            .update({
              reminder_sent_count: cart.reminder_sent_count + 1,
              [updateField]: now.toISOString(),
            })
            .eq('id', cart.id);

          results.processed++;
          if (reminderType === 'first') results.firstReminders++;
          else if (reminderType === 'second') results.secondReminders++;
          else if (reminderType === 'final') results.finalReminders++;
        } else {
          results.errors++;
        }
      }
    }

    console.log('Processing complete:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...results,
        timestamp: now.toISOString(),
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error processing abandoned carts:", error);
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
