import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "shorifulmia085@gmail.com";

interface OrderData {
  customer_name: string;
  customer_email?: string;
  phone: string;
  address: string;
  watch_model: string;
  quantity: number;
  payment_method: string;
  trx_id?: string;
  delivery_location: string;
  delivery_charge: number;
  total_price: number;
}

function adminEmailHtml(order: OrderData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f6f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <div style="background:#0a0a0a;padding:32px 40px;">
      <h1 style="margin:0;color:#b8963e;font-size:22px;font-weight:700;letter-spacing:0.5px;">Kronos — নতুন অর্ডার</h1>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#0a0a0a;font-size:15px;margin:0 0 24px;line-height:1.6;">একটি নতুন অর্ডার পাওয়া গেছে। বিস্তারিত নিচে দেওয়া হলো:</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:13px;width:140px;">নাম</td>
          <td style="padding:12px 0;color:#0a0a0a;font-size:14px;font-weight:600;">${order.customer_name}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:13px;">ফোন</td>
          <td style="padding:12px 0;color:#0a0a0a;font-size:14px;font-weight:600;">${order.phone}</td>
        </tr>
        ${order.customer_email ? `<tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:13px;">ইমেইল</td>
          <td style="padding:12px 0;color:#0a0a0a;font-size:14px;">${order.customer_email}</td>
        </tr>` : ""}
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:13px;">ঠিকানা</td>
          <td style="padding:12px 0;color:#0a0a0a;font-size:14px;">${order.address}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:13px;">মডেল</td>
          <td style="padding:12px 0;color:#0a0a0a;font-size:14px;font-weight:600;">${order.watch_model}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:13px;">পরিমাণ</td>
          <td style="padding:12px 0;color:#0a0a0a;font-size:14px;">${order.quantity}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:13px;">পেমেন্ট</td>
          <td style="padding:12px 0;color:#0a0a0a;font-size:14px;text-transform:uppercase;">${order.payment_method}</td>
        </tr>
        ${order.trx_id ? `<tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:13px;">TrxID</td>
          <td style="padding:12px 0;color:#b8963e;font-size:14px;font-weight:700;font-family:monospace;">${order.trx_id}</td>
        </tr>` : ""}
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px 0;color:#666;font-size:13px;">ডেলিভারি</td>
          <td style="padding:12px 0;color:#0a0a0a;font-size:14px;">${order.delivery_location === "dhaka" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে"} — ৳${order.delivery_charge}</td>
        </tr>
      </table>
      <div style="margin-top:24px;background:#0a0a0a;border-radius:12px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#999;font-size:13px;">সর্বমোট</span>
        <span style="color:#b8963e;font-size:28px;font-weight:700;">৳${order.total_price.toLocaleString("en-IN")}</span>
      </div>
    </div>
    <div style="padding:20px 40px;background:#fafafa;text-align:center;">
      <p style="margin:0;color:#999;font-size:11px;">Kronos Admin Notification</p>
    </div>
  </div>
</body>
</html>`;
}

function customerEmailHtml(order: OrderData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f6f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <div style="background:#0a0a0a;padding:40px;text-align:center;">
      <h1 style="margin:0;color:#b8963e;font-size:28px;font-weight:700;letter-spacing:1px;">KRONOS</h1>
      <p style="margin:8px 0 0;color:#666;font-size:13px;letter-spacing:2px;">PREMIUM WATCH</p>
    </div>
    <div style="padding:40px;text-align:center;">
      <div style="width:64px;height:64px;border-radius:50%;background:#ecfdf5;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">✓</span>
      </div>
      <h2 style="margin:0 0 8px;color:#0a0a0a;font-size:22px;font-weight:700;">ধন্যবাদ, ${order.customer_name}!</h2>
      <p style="margin:0 0 32px;color:#666;font-size:14px;line-height:1.6;">আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। শীঘ্রই আমাদের টিম আপনার সাথে যোগাযোগ করবে।</p>

      <div style="background:#fafafa;border-radius:12px;padding:24px;text-align:left;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">অর্ডার সারসংক্ষেপ</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:10px 0;color:#666;font-size:13px;">মডেল</td>
            <td style="padding:10px 0;color:#0a0a0a;font-size:14px;font-weight:600;text-align:right;">${order.watch_model}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:10px 0;color:#666;font-size:13px;">পরিমাণ</td>
            <td style="padding:10px 0;color:#0a0a0a;font-size:14px;text-align:right;">${order.quantity}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:10px 0;color:#666;font-size:13px;">ডেলিভারি</td>
            <td style="padding:10px 0;color:#0a0a0a;font-size:14px;text-align:right;">৳${order.delivery_charge}</td>
          </tr>
          <tr>
            <td style="padding:12px 0;color:#0a0a0a;font-size:14px;font-weight:700;">সর্বমোট</td>
            <td style="padding:12px 0;color:#b8963e;font-size:18px;font-weight:700;text-align:right;">৳${order.total_price.toLocaleString("en-IN")}</td>
          </tr>
        </table>
      </div>

      <div style="background:#fafafa;border-radius:12px;padding:24px;text-align:left;">
        <p style="margin:0 0 4px;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">পেমেন্ট স্ট্যাটাস</p>
        <p style="margin:8px 0 0;color:#0a0a0a;font-size:14px;font-weight:600;">
          ${order.payment_method === "cod" ? "✅ ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা দিন" : `💳 অনলাইন পেমেন্ট (${order.payment_method.toUpperCase()}) — TrxID: ${order.trx_id || "N/A"}`}
        </p>
      </div>
    </div>
    <div style="padding:24px 40px;background:#0a0a0a;text-align:center;">
      <p style="margin:0 0 4px;color:#b8963e;font-size:13px;font-weight:600;">Kronos Premium Watch</p>
      <p style="margin:0;color:#555;font-size:11px;">প্রিমিয়াম ক্রাফটসম্যানশিপ, অতুলনীয় ডিজাইন</p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const order: OrderData = await req.json();

    // Send admin notification
    const adminRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kronos Orders <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `🛒 নতুন অর্ডার — ${order.watch_model} (৳${order.total_price.toLocaleString("en-IN")})`,
        html: adminEmailHtml(order),
      }),
    });

    const adminData = await adminRes.json();
    if (!adminRes.ok) {
      console.error("Admin email failed:", adminData);
    }

    // Send customer email if provided
    let customerData = null;
    if (order.customer_email) {
      const customerRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Kronos Premium Watch <onboarding@resend.dev>",
          to: [order.customer_email],
          subject: `ধন্যবাদ, ${order.customer_name}! আপনার অর্ডার নিশ্চিত হয়েছে ✓`,
          html: customerEmailHtml(order),
        }),
      });
      customerData = await customerRes.json();
      if (!customerRes.ok) {
        console.error("Customer email failed:", customerData);
      }
    }

    return new Response(
      JSON.stringify({ success: true, admin: adminData, customer: customerData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
