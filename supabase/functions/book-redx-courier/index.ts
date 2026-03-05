import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REDX_BASE_URL = "https://openapi.redx.com.bd";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.courier_booked) {
      return new Response(
        JSON.stringify({ error: "Order already booked", tracking_id: order.tracking_id }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get RedX API credentials using service role
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: courierCfg, error: cfgError } = await adminSupabase
      .from("courier_settings")
      .select("*")
      .eq("provider", "redx")
      .single();

    if (cfgError || !courierCfg || !courierCfg.api_key) {
      return new Response(
        JSON.stringify({ error: "RedX API not configured. Please add your access token in Courier Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = courierCfg.api_key;

    // Calculate cash collection (COD amount)
    const cashCollection = order.payment_method === "cod" ? order.total_price : 0;

    // Create parcel on RedX
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

    console.log("Calling RedX API with payload:", JSON.stringify(redxPayload));

    const redxResponse = await fetch(`${REDX_BASE_URL}/v1.0.0-beta/parcel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "API-ACCESS-TOKEN": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(redxPayload),
    });

    const redxData = await redxResponse.json();
    console.log("RedX API response:", JSON.stringify(redxData), "Status:", redxResponse.status);

    if (!redxResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "RedX API error",
          details: redxData,
          status_code: redxResponse.status,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract tracking ID from RedX response
    const trackingId = redxData?.tracking_id || redxData?.parcel?.tracking_id || redxData?.data?.tracking_id || null;

    if (!trackingId) {
      return new Response(
        JSON.stringify({
          error: "RedX did not return a tracking ID",
          redx_response: redxData,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order in database
    const { error: updateError } = await adminSupabase
      .from("orders")
      .update({
        courier_booked: true,
        tracking_id: String(trackingId),
        courier_provider: "redx",
      })
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
        redx_response: redxData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("book-redx-courier error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
