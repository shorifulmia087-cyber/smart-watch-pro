import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PATHAO_URLS = {
  sandbox: "https://hermes-api.p-stageenv.xyz",
  production: "https://api-hermes.pathao.com",
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
      .from("courier_settings").select("*").eq("provider", "pathao").single();

    if (!courierCfg) {
      return new Response(
        JSON.stringify({ error: "Pathao API not configured." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isSandbox = courierCfg.is_sandbox === true;
    const storeId = isSandbox ? courierCfg.sandbox_api_key : courierCfg.production_api_key;
    const accessToken = isSandbox ? courierCfg.sandbox_api_secret : courierCfg.production_api_secret;
    const baseUrl = isSandbox ? PATHAO_URLS.sandbox : PATHAO_URLS.production;

    if (!storeId || !accessToken) {
      return new Response(
        JSON.stringify({ error: `Pathao ${isSandbox ? 'Sandbox' : 'Production'} credentials not configured.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cashCollection = order.payment_method === "cod" ? order.total_price : 0;

    const pathaoPayload = {
      store_id: storeId,
      merchant_order_id: order.id.slice(0, 8).toUpperCase(),
      sender_name: "Store",
      sender_phone: "01700000000",
      recipient_name: order.customer_name,
      recipient_phone: order.phone,
      recipient_address: order.address,
      recipient_city: order.delivery_location === "dhaka" ? 1 : 2,
      recipient_zone: 1,
      recipient_area: 1,
      delivery_type: 48,
      item_type: 2,
      special_instruction: `Product: ${order.watch_model}, Qty: ${order.quantity}`,
      item_quantity: order.quantity,
      item_weight: 0.5,
      amount_to_collect: cashCollection,
      item_description: order.watch_model,
    };

    console.log(`[Pathao ${isSandbox ? 'SANDBOX' : 'PRODUCTION'}] Calling: ${baseUrl}/aladdin/api/v1/orders`);

    const pathaoResponse = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(pathaoPayload),
    });

    const pathaoData = await pathaoResponse.json();
    console.log("Pathao response:", JSON.stringify(pathaoData), "Status:", pathaoResponse.status);

    if (!pathaoResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Pathao API error", details: pathaoData, status_code: pathaoResponse.status, mode: isSandbox ? "sandbox" : "production" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trackingId = pathaoData?.data?.consignment_id || pathaoData?.consignment_id || null;
    if (!trackingId) {
      return new Response(
        JSON.stringify({ error: "Pathao did not return a tracking ID", pathao_response: pathaoData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await adminSupabase
      .from("orders")
      .update({ courier_booked: true, tracking_id: String(trackingId), courier_provider: "pathao" })
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
        provider: "pathao",
        mode: isSandbox ? "sandbox" : "production",
        pathao_response: pathaoData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("book-pathao-courier error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
