import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackOrderRequest {
  orderNumber?: string;
  phone?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNumber, phone }: TrackOrderRequest = await req.json();

    // Validate input
    if (!orderNumber && !phone) {
      return new Response(
        JSON.stringify({ error: "Please provide an order number or phone number" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate order number format if provided
    if (orderNumber) {
      const orderNumberRegex = /^ORD-\d{8}-\d{4}$/;
      if (!orderNumberRegex.test(orderNumber.trim())) {
        return new Response(
          JSON.stringify({ error: "Invalid order number format. Expected format: ORD-YYYYMMDD-XXXX" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Validate phone format if provided (basic validation)
    if (phone) {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        return new Response(
          JSON.stringify({ error: "Invalid phone number" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Create Supabase client with service role for querying
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let orders: any[] = [];

    if (orderNumber) {
      // Query by order number
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          created_at,
          updated_at,
          status,
          shipping_address,
          total_amount,
          shipping_cost
        `)
        .eq("order_number", orderNumber.trim())
        .limit(1);

      if (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch order");
      }

      orders = data || [];
    } else if (phone) {
      // Query by phone - need to join with customers
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
      
      // First find customers with this phone
      const { data: customers, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${phone}%`);

      if (customerError) {
        console.error("Customer query error:", customerError);
        throw new Error("Failed to search orders");
      }

      if (customers && customers.length > 0) {
        const customerIds = customers.map(c => c.id);
        
        const { data, error } = await supabase
          .from("orders")
          .select(`
            id,
            order_number,
            created_at,
            updated_at,
            status,
            shipping_address,
            total_amount,
            shipping_cost
          `)
          .in("customer_id", customerIds)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Orders query error:", error);
          throw new Error("Failed to fetch orders");
        }

        orders = data || [];
      }
    }

    if (orders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          orders: [],
          message: "No orders found. Please check your order number or phone number."
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Return limited order info for security
    const safeOrders = orders.map(order => ({
      orderNumber: order.order_number,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      shippingAddress: order.shipping_address,
      total: order.total_amount,
      shippingCost: order.shipping_cost,
    }));

    console.log(`Found ${safeOrders.length} orders for tracking query`);

    return new Response(
      JSON.stringify({ success: true, orders: safeOrders }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Track order error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
