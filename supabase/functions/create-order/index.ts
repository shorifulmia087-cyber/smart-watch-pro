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
    const body = await req.json()
    const {
      customer_name, customer_email, phone, address, watch_model,
      quantity, payment_method, trx_id, delivery_location,
      selected_color, turnstile_token,
    } = body

    // === Input validation ===
    if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Invalid name' }), { status: 400, headers: corsHeaders })
    }
    if (!phone || !/^01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ''))) {
      return new Response(JSON.stringify({ error: 'Invalid phone' }), { status: 400, headers: corsHeaders })
    }
    if (!address || typeof address !== 'string' || address.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid address' }), { status: 400, headers: corsHeaders })
    }
    if (!watch_model || typeof watch_model !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid product' }), { status: 400, headers: corsHeaders })
    }
    if (!quantity || typeof quantity !== 'number' || quantity < 1 || quantity > 100) {
      return new Response(JSON.stringify({ error: 'Invalid quantity' }), { status: 400, headers: corsHeaders })
    }
    if (!['cod', 'bkash', 'nagad', 'rocket'].includes(payment_method)) {
      return new Response(JSON.stringify({ error: 'Invalid payment method' }), { status: 400, headers: corsHeaders })
    }
    if (!['dhaka', 'outside'].includes(delivery_location)) {
      return new Response(JSON.stringify({ error: 'Invalid delivery location' }), { status: 400, headers: corsHeaders })
    }

    // === Cloudflare Turnstile verification ===
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (turnstileSecret && turnstile_token) {
      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: turnstile_token,
        }),
      })
      const turnstileData = await turnstileRes.json()
      if (!turnstileData.success) {
        return new Response(JSON.stringify({ error: 'Bot verification failed' }), { status: 403, headers: corsHeaders })
      }
    } else if (turnstileSecret && !turnstile_token) {
      return new Response(JSON.stringify({ error: 'Turnstile token required' }), { status: 400, headers: corsHeaders })
    }

    // === Server-side price verification ===
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Fetch product price from DB
    const { data: product, error: productErr } = await supabase
      .from('products')
      .select('price, name, stock_status, available_colors')
      .eq('name', watch_model)
      .limit(1)
      .maybeSingle()

    if (productErr || !product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: corsHeaders })
    }

    if (product.stock_status === 'out_of_stock') {
      return new Response(JSON.stringify({ error: 'Product out of stock' }), { status: 400, headers: corsHeaders })
    }

    // Validate color if product has colors
    if (product.available_colors?.length > 0 && selected_color) {
      if (!product.available_colors.includes(selected_color)) {
        return new Response(JSON.stringify({ error: 'Invalid color selection' }), { status: 400, headers: corsHeaders })
      }
    }

    // Fetch delivery charges from settings
    const { data: settings } = await supabase
      .from('site_settings')
      .select('delivery_charge_inside, delivery_charge_outside')
      .limit(1)
      .single()

    const deliveryCharge = delivery_location === 'dhaka'
      ? (settings?.delivery_charge_inside ?? 70)
      : (settings?.delivery_charge_outside ?? 150)

    // Calculate verified total server-side
    const verifiedTotal = (product.price * quantity) + deliveryCharge

    // Sanitize inputs
    const sanitize = (s: string) => s.replace(/<[^>]*>/g, '').trim()

    const orderData = {
      customer_name: sanitize(customer_name),
      customer_email: customer_email ? sanitize(customer_email) : null,
      phone: phone.replace(/[\s-]/g, ''),
      address: sanitize(address),
      watch_model: product.name,
      quantity,
      payment_method,
      trx_id: trx_id ? trx_id.replace(/[^a-zA-Z0-9]/g, '') : null,
      delivery_location,
      delivery_charge: deliveryCharge,
      total_price: verifiedTotal,
      selected_color: selected_color || null,
    }

    const { data: order, error: insertErr } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (insertErr) {
      console.error('Order insert error:', insertErr)
      return new Response(JSON.stringify({ error: 'Failed to create order' }), { status: 500, headers: corsHeaders })
    }

    // Send email notification (non-blocking)
    supabase.functions.invoke('send-order-email', { body: orderData }).catch(() => {})

    return new Response(JSON.stringify({ success: true, order }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders })
  }
})
