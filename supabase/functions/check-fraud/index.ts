import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const FRAUD_API_KEY = '2cf139298bee59b3c78added618309e1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()

    if (!phone || !/^01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ''))) {
      return new Response(JSON.stringify({ error: 'Invalid phone' }), { status: 400, headers: corsHeaders })
    }

    const cleanPhone = phone.replace(/[\s-]/g, '')

    // Fetch min_success_rate from settings
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: settings } = await supabase
      .from('site_settings')
      .select('min_success_rate')
      .limit(1)
      .single()

    const minSuccessRate = settings?.min_success_rate ?? 60

    // Call FraudChecker API
    const fraudRes = await fetch('https://fraudchecker.link/api/v1/qc/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${FRAUD_API_KEY}`,
      },
      body: JSON.stringify({ phone: cleanPhone }),
    })

    if (!fraudRes.ok) {
      console.error('FraudChecker API error:', fraudRes.status)
      // If API fails, allow order (don't block customers due to API issues)
      return new Response(JSON.stringify({
        allowed: true,
        flag: null,
        total_parcels: 0,
        total_delivered: 0,
        total_cancel: 0,
        success_rate: null,
        message: null,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const fraudData = await fraudRes.json()
    const totalParcels = fraudData.total_parcels ?? 0
    const totalDelivered = fraudData.total_delivered ?? 0
    const totalCancel = fraudData.total_cancel ?? 0

    let successRate: number | null = null
    let allowed = true
    let flag: string | null = null
    let message: string | null = null

    if (totalParcels === 0) {
      // Case B: New number, no history
      flag = 'new_customer'
      allowed = true
    } else {
      successRate = (totalDelivered / totalParcels) * 100

      if (successRate < minSuccessRate) {
        // Case A: Low success rate
        flag = 'low_success'
        allowed = false
        message = 'আপনার নম্বরে ক্যানসেলড অর্ডারের সংখ্যা বেশি হওয়ায় ক্যাশ অন ডেলিভারি পাওয়া যাচ্ছে না। দয়া করে অর্ডার কনফার্ম করতে অগ্রিম পেমেন্ট করুন।'
      } else {
        // Case C: Good history
        flag = 'good'
        allowed = true
      }
    }

    return new Response(JSON.stringify({
      allowed,
      flag,
      total_parcels: totalParcels,
      total_delivered: totalDelivered,
      total_cancel: totalCancel,
      success_rate: successRate !== null ? Math.round(successRate * 100) / 100 : null,
      message,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Fraud check error:', err)
    // On error, allow order
    return new Response(JSON.stringify({
      allowed: true,
      flag: null,
      total_parcels: 0,
      total_delivered: 0,
      total_cancel: 0,
      success_rate: null,
      message: null,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
