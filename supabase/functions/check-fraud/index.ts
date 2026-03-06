import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

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

    // Get API key from secrets
    const FRAUD_API_KEY = Deno.env.get('FRAUD_CHECKER_API_KEY')
    if (!FRAUD_API_KEY) {
      console.error('FRAUD_CHECKER_API_KEY secret not configured')
      return new Response(JSON.stringify({
        allowed: true,
        flag: 'check_failed',
        total_parcels: 0,
        total_delivered: 0,
        total_cancel: 0,
        success_rate: null,
        message: null,
        error_message: 'API Key কনফিগার করা হয়নি',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

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
    let fraudRes: Response
    try {
      fraudRes = await fetch('https://fraudchecker.link/api/v1/qc/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${FRAUD_API_KEY}`,
        },
        body: JSON.stringify({ phone: cleanPhone }),
      })
    } catch (networkErr) {
      console.error('FraudChecker network error:', networkErr)
      return new Response(JSON.stringify({
        allowed: true,
        flag: 'check_failed',
        total_parcels: 0,
        total_delivered: 0,
        total_cancel: 0,
        success_rate: null,
        message: null,
        error_message: 'API সার্ভারে সংযোগ করা যায়নি',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Handle non-OK responses
    if (!fraudRes.ok) {
      let errorDetail = `API Error (HTTP ${fraudRes.status})`
      try {
        const errBody = await fraudRes.json()
        if (errBody?.detail) errorDetail = errBody.detail
        else if (errBody?.error) errorDetail = errBody.error
        else if (errBody?.message) errorDetail = errBody.message
      } catch { /* ignore parse errors */ }

      console.error('FraudChecker API error:', fraudRes.status, errorDetail)
      
      return new Response(JSON.stringify({
        allowed: true,
        flag: 'check_failed',
        total_parcels: 0,
        total_delivered: 0,
        total_cancel: 0,
        success_rate: null,
        message: null,
        error_message: errorDetail,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const fraudData = await fraudRes.json()

    // Check if API returned an error in the response body
    if (fraudData?.error || fraudData?.detail) {
      const errorMsg = fraudData.error || fraudData.detail || 'Unknown API error'
      console.error('FraudChecker API body error:', errorMsg)
      return new Response(JSON.stringify({
        allowed: true,
        flag: 'check_failed',
        total_parcels: 0,
        total_delivered: 0,
        total_cancel: 0,
        success_rate: null,
        message: null,
        error_message: errorMsg,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const totalParcels = fraudData.total_parcels ?? 0
    const totalDelivered = fraudData.total_delivered ?? 0
    const totalCancel = fraudData.total_cancel ?? 0

    let successRate: number | null = null
    let allowed = true
    let flag: string | null = null
    let message: string | null = null

    if (totalParcels === 0) {
      flag = 'new_customer'
      allowed = true
    } else {
      successRate = (totalDelivered / totalParcels) * 100

      if (successRate < minSuccessRate) {
        flag = 'low_success'
        allowed = false
        message = 'আপনার নম্বরে ক্যানসেলড অর্ডারের সংখ্যা বেশি হওয়ায় ক্যাশ অন ডেলিভারি পাওয়া যাচ্ছে না। দয়া করে অর্ডার কনফার্ম করতে অগ্রিম পেমেন্ট করুন।'
      } else {
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
      error_message: null,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Fraud check error:', err)
    return new Response(JSON.stringify({
      allowed: true,
      flag: 'check_failed',
      total_parcels: 0,
      total_delivered: 0,
      total_cancel: 0,
      success_rate: null,
      message: null,
      error_message: 'অভ্যন্তরীণ সার্ভার ত্রুটি',
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
