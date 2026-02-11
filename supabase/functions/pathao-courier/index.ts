import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PathaoCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  storeId: string;
  environment: "sandbox" | "production";
}

function getBaseUrl(environment: string): string {
  return environment === "production" 
    ? "https://api-hermes.pathao.com" 
    : "https://courier-api-sandbox.pathao.com";
}

async function getCredentialsFromDB(supabaseClient: any): Promise<PathaoCredentials | null> {
  try {
    const { data, error } = await supabaseClient
      .from("store_settings")
      .select("key, setting_value")
      .in("key", [
        "PATHAO_CLIENT_ID",
        "PATHAO_CLIENT_SECRET",
        "PATHAO_USERNAME",
        "PATHAO_PASSWORD",
        "PATHAO_ACCESS_TOKEN",
        "PATHAO_REFRESH_TOKEN",
        "PATHAO_TOKEN_EXPIRES_AT",
        "PATHAO_STORE_ID",
        "PATHAO_ENVIRONMENT",
      ]);

    if (error || !data) {
      console.error("Error fetching Pathao credentials from DB:", error);
      return null;
    }

    const getValue = (keyName: string) => 
      data.find((s: any) => s.key === keyName)?.setting_value || "";

    return {
      clientId: getValue("PATHAO_CLIENT_ID"),
      clientSecret: getValue("PATHAO_CLIENT_SECRET"),
      username: getValue("PATHAO_USERNAME"),
      password: getValue("PATHAO_PASSWORD"),
      accessToken: getValue("PATHAO_ACCESS_TOKEN"),
      refreshToken: getValue("PATHAO_REFRESH_TOKEN"),
      tokenExpiresAt: getValue("PATHAO_TOKEN_EXPIRES_AT"),
      storeId: getValue("PATHAO_STORE_ID"),
      environment: (getValue("PATHAO_ENVIRONMENT") || "sandbox") as "sandbox" | "production",
    };
  } catch (e) {
    console.error("Exception fetching Pathao credentials:", e);
    return null;
  }
}

async function saveTokens(supabaseClient: any, accessToken: string, refreshToken: string, expiresIn: number) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  
  const updates = [
    { keyName: "PATHAO_ACCESS_TOKEN", value: accessToken },
    { keyName: "PATHAO_REFRESH_TOKEN", value: refreshToken },
    { keyName: "PATHAO_TOKEN_EXPIRES_AT", value: expiresAt },
  ];

  for (const update of updates) {
    await supabaseClient
      .from("store_settings")
      .update({ setting_value: update.value })
      .eq("key", update.keyName);
  }
}

async function issueToken(baseUrl: string, credentials: PathaoCredentials): Promise<any> {
  console.log("Issuing new Pathao token...");
  console.log("Base URL:", baseUrl);
  console.log("Client ID:", credentials.clientId ? "***" + credentials.clientId.slice(-4) : "MISSING");
  console.log("Username:", credentials.username || "MISSING");
  
  const response = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: "password",
      username: credentials.username,
      password: credentials.password,
    }),
  });

  const result = await response.json();
  console.log("Token response status:", response.status);
  console.log("Token response:", JSON.stringify(result).slice(0, 200));
  
  if (!response.ok || result.error) {
    throw new Error(result.message || result.error || `Token request failed with status ${response.status}`);
  }
  
  return result;
}

async function refreshAccessToken(baseUrl: string, credentials: PathaoCredentials): Promise<any> {
  const response = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
    }),
  });

  return await response.json();
}

async function getValidAccessToken(
  supabaseClient: any, 
  baseUrl: string, 
  credentials: PathaoCredentials
): Promise<string> {
  // Check if token is still valid
  if (credentials.accessToken && credentials.tokenExpiresAt) {
    const expiresAt = new Date(credentials.tokenExpiresAt);
    const now = new Date();
    // Add 5 minute buffer
    if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
      return credentials.accessToken;
    }
  }

  // Try to refresh token
  if (credentials.refreshToken) {
    try {
      const result = await refreshAccessToken(baseUrl, credentials);
      if (result.access_token) {
        await saveTokens(supabaseClient, result.access_token, result.refresh_token, result.expires_in);
        return result.access_token;
      }
    } catch (e) {
      console.log("Refresh token failed, issuing new token...");
    }
  }

  // Issue new token
  const result = await issueToken(baseUrl, credentials);
  if (result.access_token) {
    await saveTokens(supabaseClient, result.access_token, result.refresh_token, result.expires_in);
    return result.access_token;
  }

  throw new Error(result.message || "Failed to obtain access token");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const credentials = await getCredentialsFromDB(supabaseClient);
    if (!credentials || !credentials.clientId || !credentials.clientSecret) {
      throw new Error("Pathao API credentials not configured. Please set them in Settings > Integrations.");
    }

    const baseUrl = getBaseUrl(credentials.environment);
    const { action, ...payload } = await req.json();

    let result;

    switch (action) {
      case "test_connection": {
        // Just issue token and get stores
        const accessToken = await getValidAccessToken(supabaseClient, baseUrl, credentials);
        const storesResponse = await fetch(`${baseUrl}/aladdin/api/v1/stores`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        result = await storesResponse.json();
        break;
      }

      case "get_stores": {
        const accessToken = await getValidAccessToken(supabaseClient, baseUrl, credentials);
        const response = await fetch(`${baseUrl}/aladdin/api/v1/stores`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        result = await response.json();
        break;
      }

      case "get_cities": {
        const accessToken = await getValidAccessToken(supabaseClient, baseUrl, credentials);
        const response = await fetch(`${baseUrl}/aladdin/api/v1/city-list`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        result = await response.json();
        break;
      }

      case "get_zones": {
        const { city_id } = payload;
        const accessToken = await getValidAccessToken(supabaseClient, baseUrl, credentials);
        const response = await fetch(`${baseUrl}/aladdin/api/v1/cities/${city_id}/zone-list`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        result = await response.json();
        break;
      }

      case "get_areas": {
        const { zone_id } = payload;
        const accessToken = await getValidAccessToken(supabaseClient, baseUrl, credentials);
        const response = await fetch(`${baseUrl}/aladdin/api/v1/zones/${zone_id}/area-list`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        result = await response.json();
        break;
      }

      case "create_order": {
        const { order } = payload;
        const accessToken = await getValidAccessToken(supabaseClient, baseUrl, credentials);
        const response = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            store_id: order.store_id || parseInt(credentials.storeId),
            merchant_order_id: order.merchant_order_id,
            recipient_name: order.recipient_name,
            recipient_phone: order.recipient_phone,
            recipient_address: order.recipient_address,
            delivery_type: order.delivery_type || 48, // Normal delivery
            item_type: order.item_type || 2, // Parcel
            special_instruction: order.special_instruction,
            item_quantity: order.item_quantity || 1,
            item_weight: order.item_weight || 0.5,
            item_description: order.item_description,
            amount_to_collect: order.amount_to_collect,
          }),
        });
        result = await response.json();
        break;
      }

      case "bulk_create_orders": {
        const { orders } = payload;
        const accessToken = await getValidAccessToken(supabaseClient, baseUrl, credentials);
        const response = await fetch(`${baseUrl}/aladdin/api/v1/orders/bulk`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: JSON.stringify({ orders }),
        });
        result = await response.json();
        break;
      }

      case "get_order_info": {
        const { consignment_id } = payload;
        const accessToken = await getValidAccessToken(supabaseClient, baseUrl, credentials);
        const response = await fetch(`${baseUrl}/aladdin/api/v1/orders/${consignment_id}/info`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });
        result = await response.json();
        break;
      }

      case "calculate_price": {
        const { store_id, item_type, delivery_type, item_weight, recipient_city, recipient_zone } = payload;
        const accessToken = await getValidAccessToken(supabaseClient, baseUrl, credentials);
        const response = await fetch(`${baseUrl}/aladdin/api/v1/merchant/price-plan`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: JSON.stringify({
            store_id: store_id || parseInt(credentials.storeId),
            item_type: item_type || 2,
            delivery_type: delivery_type || 48,
            item_weight: item_weight || 0.5,
            recipient_city,
            recipient_zone,
          }),
        });
        result = await response.json();
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
    console.error("Pathao API error:", error);
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
