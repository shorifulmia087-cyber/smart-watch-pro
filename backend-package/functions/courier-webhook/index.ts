import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Status mapping from courier statuses to our internal statuses
const STATUS_MAP: Record<string, string> = {
  // Steadfast statuses
  pending: "processing",
  delivered_approval_pending: "shipped",
  partial_delivered_approval_pending: "shipped",
  cancelled_approval_pending: "cancelled",
  unknown_approval_pending: "processing",
  delivered: "completed",
  partial_delivered: "completed",
  cancelled: "cancelled",
  hold: "processing",
  in_review: "processing",
  unknown: "processing",
  // RedX statuses
  "Pickup Requested": "processing",
  "Pickup Assigned": "processing",
  "Picked Up": "shipped",
  "In Transit": "shipped",
  "Received at Last Mile Hub": "shipped",
  "Out for Delivery": "shipped",
  Delivered: "completed",
  "Delivery Failed": "processing",
  "Return In Transit": "returned",
  Returned: "returned",
  // Pathao statuses
  Pickup_Requested: "processing",
  Assigned_for_Pickup: "processing",
  Picked: "shipped",
  "In-Transit": "shipped",
  "Delivery-In-Progress": "shipped",
  Delivered_to_Customer: "completed",
  Partial_Delivery: "completed",
  Return_to_Merchant: "returned",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Detect provider from payload structure
    let trackingId: string | null = null;
    let courierStatus: string | null = null;
    let provider: string | null = null;

    // Steadfast webhook format
    if (body.tracking_code || body.consignment_id) {
      provider = "steadfast";
      trackingId = body.tracking_code || String(body.consignment_id);
      courierStatus = body.status || body.parcel_status;
    }
    // RedX webhook format
    else if (body.tracking_id && body.parcel_status) {
      provider = "redx";
      trackingId = String(body.tracking_id);
      courierStatus = body.parcel_status;
    }
    // Pathao webhook format
    else if (body.consignment_id && body.order_status) {
      provider = "pathao";
      trackingId = String(body.consignment_id);
      courierStatus = body.order_status;
    }
    // Generic fallback
    else if (body.tracking_id) {
      trackingId = String(body.tracking_id);
      courierStatus = body.status || body.parcel_status || body.order_status;
    }

    if (!trackingId || !courierStatus) {
      console.log("Could not parse webhook payload");
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload", received: body }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map courier status to our internal status
    const mappedStatus = STATUS_MAP[courierStatus] || null;
    console.log(`Provider: ${provider}, Tracking: ${trackingId}, Courier Status: ${courierStatus}, Mapped: ${mappedStatus}`);

    if (!mappedStatus) {
      return new Response(
        JSON.stringify({ success: true, message: "Status not mapped, no update needed", courier_status: courierStatus }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the order by tracking_id
    const { data: order, error: findErr } = await supabase
      .from("orders")
      .select("id, status")
      .eq("tracking_id", trackingId)
      .single();

    if (findErr || !order) {
      console.log("Order not found for tracking:", trackingId);
      return new Response(
        JSON.stringify({ error: "Order not found", tracking_id: trackingId }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Don't downgrade status (e.g., don't go from completed back to shipped)
    const statusPriority: Record<string, number> = {
      pending: 0, processing: 1, shipped: 2, completed: 3, cancelled: 4, returned: 5,
    };
    if (statusPriority[mappedStatus] <= statusPriority[order.status]) {
      return new Response(
        JSON.stringify({ success: true, message: "No status change needed", current: order.status, incoming: mappedStatus }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order status
    const { error: updateErr } = await supabase
      .from("orders")
      .update({ status: mappedStatus })
      .eq("id", order.id);

    if (updateErr) {
      console.error("Failed to update order:", updateErr);
      return new Response(
        JSON.stringify({ error: "Failed to update order", details: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Order ${order.id} status updated: ${order.status} -> ${mappedStatus}`);
    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        previous_status: order.status,
        new_status: mappedStatus,
        courier_status: courierStatus,
        provider,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
