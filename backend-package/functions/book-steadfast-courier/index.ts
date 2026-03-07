import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STEADFAST_URLS = {
  sandbox: "https://portal.packzy.com/api/v1",
  production: "https://portal.steadfast.com.bd/api/v1",
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

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authUser.id;

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

    const { data: courierCfg } = await adminSupabase
      .from("courier_settings").select("*").eq("provider", "steadfast").single();

    if (!courierCfg) {
      return new Response(
        JSON.stringify({ error: "Steadfast API not configured." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isSandbox = courierCfg.is_sandbox === true;
    const apiKey = isSandbox ? courierCfg.sandbox_api_key : courierCfg.production_api_key;
    const secretKey = isSandbox ? courierCfg.sandbox_api_secret : courierCfg.production_api_secret;
    const baseUrl = isSandbox ? STEADFAST_URLS.sandbox : STEADFAST_URLS.production;

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: `Steadfast ${isSandbox ? 'Sandbox' : 'Production'} credentials not configured.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cashCollection = order.payment_method === "cod" ? order.total_price : 0;

    const steadfastPayload = {
      invoice: order.id.slice(0, 8).toUpperCase(),
      recipient_name: order.customer_name,
      recipient_phone: order.phone,
      recipient_address: order.address,
      cod_amount: cashCollection,
      note: `Product: ${order.watch_model}, Qty: ${order.quantity}`,
    };

    console.log(`[Steadfast ${isSandbox ? 'SANDBOX' : 'PRODUCTION'}] Calling: ${baseUrl}/create_order`);

    const steadfastResponse = await fetch(`${baseUrl}/create_order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
      },
      body: JSON.stringify(steadfastPayload),
    });

    const steadfastData = await steadfastResponse.json();
    console.log("Steadfast response:", JSON.stringify(steadfastData), "Status:", steadfastResponse.status);

    if (!steadfastResponse.ok || steadfastData?.status !== 200) {
      return new Response(
        JSON.stringify({ error: "Steadfast API error", details: steadfastData, status_code: steadfastResponse.status, mode: isSandbox ? "sandbox" : "production" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trackingId = steadfastData?.consignment?.tracking_code || steadfastData?.consignment?.consignment_id || null;
    if (!trackingId) {
      return new Response(
        JSON.stringify({ error: "Steadfast did not return a tracking code", steadfast_response: steadfastData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await adminSupabase
      .from("orders")
      .update({ courier_booked: true, tracking_id: String(trackingId), courier_provider: "steadfast" })
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
        provider: "steadfast",
        mode: isSandbox ? "sandbox" : "production",
        steadfast_response: steadfastData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("book-steadfast-courier error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
