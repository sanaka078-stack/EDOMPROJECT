import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STEADFAST_BASE_URL = "https://portal.packzy.com/api/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
}

async function getCredentialsFromDB(supabaseClient: any): Promise<{ apiKey: string; secretKey: string } | null> {
  try {
    const { data, error } = await supabaseClient
      .from("store_settings")
      .select("key, setting_value")
      .in("key", ["STEADFAST_API_KEY", "STEADFAST_SECRET_KEY"]);

    if (error || !data) {
      console.error("Error fetching credentials from DB:", error);
      return null;
    }

    const apiKey = data.find((s: any) => s.key === "STEADFAST_API_KEY")?.setting_value;
    const secretKey = data.find((s: any) => s.key === "STEADFAST_SECRET_KEY")?.setting_value;

    if (apiKey && secretKey) {
      return { apiKey, secretKey };
    }
    return null;
  } catch (e) {
    console.error("Exception fetching credentials:", e);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get credentials from database first
    let apiKey: string | undefined;
    let secretKey: string | undefined;
    
    const dbCredentials = await getCredentialsFromDB(supabaseClient);
    if (dbCredentials && dbCredentials.apiKey && dbCredentials.secretKey) {
      apiKey = dbCredentials.apiKey;
      secretKey = dbCredentials.secretKey;
    } else {
      // Fallback to environment variables
      apiKey = Deno.env.get("STEADFAST_API_KEY");
      secretKey = Deno.env.get("STEADFAST_SECRET_KEY");
    }

    if (!apiKey || !secretKey) {
      throw new Error("Steadfast API credentials not configured. Please set them in Settings > Integrations.");
    }

    const headers = {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      "Content-Type": "application/json",
    };

    const { action, ...payload } = await req.json();

    let result;

    // Helper function to safely parse JSON responses
    const safeJsonParse = async (response: Response) => {
      const text = await response.text();
      
      // Check if response is JSON
      try {
        return JSON.parse(text);
      } catch {
        // Steadfast API sometimes returns plain text for errors
        console.error("Non-JSON response from Steadfast:", text);
        throw new Error(text || `HTTP ${response.status}: Non-JSON response`);
      }
    };

    switch (action) {
      case "get_balance": {
        const response = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
          method: "GET",
          headers,
        });
        result = await safeJsonParse(response);
        break;
      }

      case "create_order": {
        const orderData: CreateOrderPayload = payload.order;
        const response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
          method: "POST",
          headers,
          body: JSON.stringify(orderData),
        });
        result = await safeJsonParse(response);
        break;
      }

      case "bulk_create_orders": {
        const orders = payload.orders;
        const response = await fetch(`${STEADFAST_BASE_URL}/create_order/bulk-order`, {
          method: "POST",
          headers,
          body: JSON.stringify({ data: JSON.stringify(orders) }),
        });
        result = await safeJsonParse(response);
        break;
      }

      case "check_status_by_consignment": {
        const { consignment_id } = payload;
        const response = await fetch(`${STEADFAST_BASE_URL}/status_by_cid/${consignment_id}`, {
          method: "GET",
          headers,
        });
        result = await safeJsonParse(response);
        break;
      }

      case "check_status_by_invoice": {
        const { invoice } = payload;
        const response = await fetch(`${STEADFAST_BASE_URL}/status_by_invoice/${invoice}`, {
          method: "GET",
          headers,
        });
        result = await safeJsonParse(response);
        break;
      }

      case "check_status_by_tracking": {
        const { tracking_code } = payload;
        const response = await fetch(`${STEADFAST_BASE_URL}/status_by_trackingcode/${tracking_code}`, {
          method: "GET",
          headers,
        });
        result = await safeJsonParse(response);
        break;
      }

      case "create_return_request": {
        const { consignment_id, invoice, tracking_code, reason } = payload;
        const body: Record<string, any> = {};
        if (consignment_id) body.consignment_id = consignment_id;
        if (invoice) body.invoice = invoice;
        if (tracking_code) body.tracking_code = tracking_code;
        if (reason) body.reason = reason;

        const response = await fetch(`${STEADFAST_BASE_URL}/create_return_request`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        result = await safeJsonParse(response);
        break;
      }

      case "get_return_requests": {
        const response = await fetch(`${STEADFAST_BASE_URL}/get_return_requests`, {
          method: "GET",
          headers,
        });
        result = await safeJsonParse(response);
        break;
      }

      case "get_payments": {
        const response = await fetch(`${STEADFAST_BASE_URL}/payments`, {
          method: "GET",
          headers,
        });
        result = await safeJsonParse(response);
        break;
      }

      case "get_police_stations": {
        const response = await fetch(`${STEADFAST_BASE_URL}/police_stations`, {
          method: "GET",
          headers,
        });
        result = await safeJsonParse(response);
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Steadfast API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
