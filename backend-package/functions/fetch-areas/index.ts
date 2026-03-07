import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const url = new URL(req.url);
    const provider = url.searchParams.get("provider") || "steadfast";

    const { data: courierCfg } = await supabase
      .from("courier_settings").select("*").eq("provider", provider).single();

    if (!courierCfg) {
      // Return default districts if no courier configured
      return new Response(JSON.stringify({
        districts: [
          { id: 1, name: "ঢাকা", name_en: "Dhaka" },
          { id: 2, name: "চট্টগ্রাম", name_en: "Chittagong" },
          { id: 3, name: "রাজশাহী", name_en: "Rajshahi" },
          { id: 4, name: "খুলনা", name_en: "Khulna" },
          { id: 5, name: "বরিশাল", name_en: "Barishal" },
          { id: 6, name: "সিলেট", name_en: "Sylhet" },
          { id: 7, name: "রংপুর", name_en: "Rangpur" },
          { id: 8, name: "ময়মনসিংহ", name_en: "Mymensingh" },
        ],
        source: "default"
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isSandbox = courierCfg.is_sandbox === true;

    if (provider === "redx") {
      const apiKey = isSandbox ? courierCfg.sandbox_api_key : courierCfg.production_api_key;
      const baseUrl = isSandbox ? "https://sandbox.redx.com.bd" : "https://openapi.redx.com.bd";

      const areaRes = await fetch(`${baseUrl}/v1.0.0-beta/areas`, {
        headers: {
          "Content-Type": "application/json",
          "API-ACCESS-TOKEN": apiKey?.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`,
        },
      });

      if (areaRes.ok) {
        const areaData = await areaRes.json();
        const areas = areaData?.areas || areaData?.data || areaData || [];
        // Extract unique districts
        const districtMap = new Map<string, any>();
        if (Array.isArray(areas)) {
          areas.forEach((a: any) => {
            const name = a.district_name || a.name;
            if (name && !districtMap.has(name)) {
              districtMap.set(name, { id: a.id || a.district_id, name, name_en: name });
            }
          });
        }
        return new Response(JSON.stringify({
          districts: Array.from(districtMap.values()),
          areas,
          source: "redx",
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Default fallback for all providers
    return new Response(JSON.stringify({
      districts: [
        { id: 1, name: "ঢাকা", name_en: "Dhaka" },
        { id: 2, name: "চট্টগ্রাম", name_en: "Chittagong" },
        { id: 3, name: "রাজশাহী", name_en: "Rajshahi" },
        { id: 4, name: "খুলনা", name_en: "Khulna" },
        { id: 5, name: "বরিশাল", name_en: "Barishal" },
        { id: 6, name: "সিলেট", name_en: "Sylhet" },
        { id: 7, name: "রংপুর", name_en: "Rangpur" },
        { id: 8, name: "ময়মনসিংহ", name_en: "Mymensingh" },
      ],
      source: "default"
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("fetch-areas error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
