import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrackingEvent {
  status: string;
  timestamp: string;
  location?: string;
  details?: string;
}

interface TrackingResponse {
  current_status: string;
  last_updated: string;
  current_location?: string;
  events: TrackingEvent[];
  provider: string;
  tracking_id: string;
}

async function trackSteadfast(trackingId: string, apiKey: string): Promise<TrackingResponse> {
  const res = await fetch(`https://portal.steadfast.com.bd/api/v1/status_by_trackingcode/${trackingId}`, {
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  
  const delivery = data?.delivery_status || data?.status || 'unknown';
  const statusMap: Record<string, string> = {
    'pending': 'পিকআপ পেন্ডিং',
    'in_review': 'রিভিউতে',
    'delivered_approval_pending': 'ডেলিভারি অনুমোদন পেন্ডিং',
    'partial_delivered_approval_pending': 'আংশিক ডেলিভারি',
    'cancelled_approval_pending': 'ক্যানসেল অনুমোদন পেন্ডিং',
    'unknown_approval_pending': 'অজানা অনুমোদন পেন্ডিং',
    'delivered': 'ডেলিভারি সম্পন্ন',
    'partial_delivered': 'আংশিক ডেলিভারি',
    'cancelled': 'ক্যানসেল',
    'hold': 'হোল্ড',
    'in_transit': 'ট্রানজিটে',
    'unknown': 'অজানা',
  };

  const events: TrackingEvent[] = [];
  
  // Build timeline from status
  events.push({ status: 'অর্ডার গৃহীত', timestamp: data?.created_at || new Date().toISOString(), details: 'অর্ডার সিস্টেমে যুক্ত হয়েছে' });
  
  if (['in_transit', 'delivered', 'partial_delivered'].includes(delivery)) {
    events.push({ status: 'পিকআপ সম্পন্ন', timestamp: data?.updated_at || new Date().toISOString(), details: 'কুরিয়ার পার্সেল সংগ্রহ করেছে' });
  }
  if (['in_transit'].includes(delivery)) {
    events.push({ status: 'ট্রানজিটে', timestamp: data?.updated_at || new Date().toISOString(), details: 'পার্সেল ডেলিভারি হাবে', location: 'ট্রানজিট হাব' });
  }
  if (delivery === 'delivered' || delivery === 'partial_delivered') {
    events.push({ status: 'ডেলিভারি সম্পন্ন', timestamp: data?.updated_at || new Date().toISOString(), details: 'পার্সেল সফলভাবে ডেলিভারি হয়েছে' });
  }
  if (delivery === 'cancelled') {
    events.push({ status: 'ক্যানসেল', timestamp: data?.updated_at || new Date().toISOString(), details: 'পার্সেল ক্যানসেল করা হয়েছে' });
  }

  return {
    current_status: statusMap[delivery] || delivery,
    last_updated: data?.updated_at || new Date().toISOString(),
    current_location: data?.recipient_city || undefined,
    events,
    provider: 'steadfast',
    tracking_id: trackingId,
  };
}

async function trackRedX(trackingId: string, apiKey: string): Promise<TrackingResponse> {
  const res = await fetch(`https://openapi.redx.com.bd/v1.0.0-beta/parcel/info/${trackingId}`, {
    headers: { 'API-ACCESS-TOKEN': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  const parcel = data?.parcel || data;

  const statusMap: Record<string, string> = {
    'CREATED': 'অর্ডার গৃহীত',
    'PICKUP_ASSIGNED': 'পিকআপ নির্ধারিত',
    'PICKED_UP': 'পিকআপ সম্পন্ন',
    'AT_SORTING': 'সর্টিং হাবে',
    'IN_TRANSIT': 'ট্রানজিটে',
    'REACHED_DELIVERY_HUB': 'ডেলিভারি হাবে পৌঁছেছে',
    'OUT_FOR_DELIVERY': 'ডেলিভারির জন্য বের হয়েছে',
    'DELIVERED': 'ডেলিভারি সম্পন্ন',
    'RETURN': 'রিটার্ন',
    'CANCELLED': 'ক্যানসেল',
  };

  const events: TrackingEvent[] = [];
  if (parcel?.tracking_history && Array.isArray(parcel.tracking_history)) {
    parcel.tracking_history.forEach((h: any) => {
      events.push({
        status: statusMap[h.status] || h.status,
        timestamp: h.created_at || new Date().toISOString(),
        location: h.hub_name || undefined,
        details: h.note || undefined,
      });
    });
  }

  if (events.length === 0) {
    events.push({ status: statusMap[parcel?.parcel_status] || parcel?.parcel_status || 'অজানা', timestamp: new Date().toISOString() });
  }

  return {
    current_status: statusMap[parcel?.parcel_status] || parcel?.parcel_status || 'অজানা',
    last_updated: parcel?.updated_at || new Date().toISOString(),
    current_location: parcel?.delivery_area || undefined,
    events,
    provider: 'redx',
    tracking_id: trackingId,
  };
}

async function trackPathao(trackingId: string, apiKey: string, apiSecret: string): Promise<TrackingResponse> {
  // First get token
  const tokenRes = await fetch('https://courier-api-bd.pathao.com/aladdin/api/v1/issue-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: apiKey, client_secret: apiSecret, grant_type: 'client_credentials' }),
  });
  const tokenData = await tokenRes.json();
  const token = tokenData?.token || tokenData?.access_token;

  const res = await fetch(`https://courier-api-bd.pathao.com/aladdin/api/v1/orders/${trackingId}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  const order = data?.data || data;

  const statusMap: Record<string, string> = {
    'Pending': 'পেন্ডিং',
    'Pickup Pending': 'পিকআপ পেন্ডিং',
    'Picked Up': 'পিকআপ সম্পন্ন',
    'In Transit': 'ট্রানজিটে',
    'Out for Delivery': 'ডেলিভারির জন্য বের হয়েছে',
    'Delivered': 'ডেলিভারি সম্পন্ন',
    'Return': 'রিটার্ন',
    'Cancelled': 'ক্যানসেল',
  };

  const events: TrackingEvent[] = [
    { status: statusMap[order?.order_status] || order?.order_status || 'অজানা', timestamp: order?.updated_at || new Date().toISOString() }
  ];

  return {
    current_status: statusMap[order?.order_status] || order?.order_status || 'অজানা',
    last_updated: order?.updated_at || new Date().toISOString(),
    current_location: order?.recipient_city || undefined,
    events,
    provider: 'pathao',
    tracking_id: trackingId,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracking_id, courier_provider, order_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let trackingIdToUse = tracking_id;
    let providerToUse = courier_provider;

    // If order_id provided, look up tracking info
    if (order_id && (!trackingIdToUse || !providerToUse)) {
      const { data: order } = await supabase
        .from('orders')
        .select('tracking_id, courier_provider')
        .eq('id', order_id)
        .single();
      if (order) {
        trackingIdToUse = trackingIdToUse || order.tracking_id;
        providerToUse = providerToUse || order.courier_provider;
      }
    }

    if (!trackingIdToUse || !providerToUse) {
      return new Response(JSON.stringify({ error: 'tracking_id and courier_provider required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get courier settings
    const { data: settings } = await supabase
      .from('courier_settings')
      .select('*')
      .eq('provider', providerToUse)
      .single();

    if (!settings) {
      return new Response(JSON.stringify({ error: `No settings found for ${providerToUse}` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = settings.is_sandbox
      ? (settings.sandbox_api_key || settings.api_key || '')
      : (settings.production_api_key || settings.api_key || '');
    const apiSecret = settings.is_sandbox
      ? (settings.sandbox_api_secret || settings.api_secret || '')
      : (settings.production_api_secret || settings.api_secret || '');

    let result: TrackingResponse;

    switch (providerToUse) {
      case 'steadfast':
        result = await trackSteadfast(trackingIdToUse, apiKey);
        break;
      case 'redx':
        result = await trackRedX(trackingIdToUse, apiKey);
        break;
      case 'pathao':
        result = await trackPathao(trackingIdToUse, apiKey, apiSecret);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unsupported provider: ${providerToUse}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
