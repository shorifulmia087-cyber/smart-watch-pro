import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REDX_URLS = {
  sandbox: "https://sandbox.redx.com.bd",
  production: "https://openapi.redx.com.bd",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { data: roleData } = await supabase
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { order_id } = body;
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders").select("*").eq("id", order_id).single();
    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.courier_booked) {
      return new Response(
        JSON.stringify({ error: "Order already booked", tracking_id: order.tracking_id }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: courierCfg, error: cfgError } = await adminSupabase
      .from("courier_settings").select("*").eq("provider", "redx").single();

    if (cfgError || !courierCfg) {
      return new Response(
        JSON.stringify({ error: "RedX API not configured." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine sandbox or production mode
    const isSandbox = courierCfg.is_sandbox === true;
    const apiKey = isSandbox ? courierCfg.sandbox_api_key : courierCfg.production_api_key;
    const baseUrl = isSandbox ? REDX_URLS.sandbox : REDX_URLS.production;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: `RedX ${isSandbox ? 'Sandbox' : 'Production'} API key not configured.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cashCollection = order.payment_method === "cod" ? order.total_price : 0;

    const redxPayload = {
      customer_name: order.customer_name,
      customer_phone: order.phone,
      delivery_area: order.delivery_location === "dhaka" ? "Dhaka" : "Outside Dhaka",
      delivery_area_id: order.delivery_location === "dhaka" ? 1 : 2,
      customer_address: order.address,
      merchant_invoice_id: order.id.slice(0, 8).toUpperCase(),
      cash_collection_amount: String(cashCollection),
      parcel_weight: "500",
      instruction: `Product: ${order.watch_model}, Qty: ${order.quantity}`,
      value: String(order.total_price),
    };

    console.log(`[RedX ${isSandbox ? 'SANDBOX' : 'PRODUCTION'}] Calling: ${baseUrl}/v1.0.0-beta/parcel`);

    const redxResponse = await fetch(`${baseUrl}/v1.0.0-beta/parcel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "API-ACCESS-TOKEN": apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`,
      },
      body: JSON.stringify(redxPayload),
    });

    const redxData = await redxResponse.json();
    console.log("RedX response:", JSON.stringify(redxData), "Status:", redxResponse.status);

    if (!redxResponse.ok) {
      return new Response(
        JSON.stringify({ error: "RedX API error", details: redxData, status_code: redxResponse.status, mode: isSandbox ? "sandbox" : "production" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trackingId = redxData?.tracking_id || redxData?.parcel?.tracking_id || redxData?.data?.tracking_id || null;
    if (!trackingId) {
      return new Response(
        JSON.stringify({ error: "RedX did not return a tracking ID", redx_response: redxData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await adminSupabase
      .from("orders")
      .update({ courier_booked: true, tracking_id: String(trackingId), courier_provider: "redx" })
      .eq("id", order_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update order", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        tracking_id: String(trackingId),
        provider: "redx",
        mode: isSandbox ? "sandbox" : "production",
        redx_response: redxData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("book-redx-courier error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
