
-- Expand site_settings for universal dynamic control
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS brand_name TEXT NOT NULL DEFAULT 'Kronos Premium Watch',
  ADD COLUMN IF NOT EXISTS brand_tagline TEXT NOT NULL DEFAULT 'প্রিমিয়াম ক্রাফটসম্যানশিপ, অতুলনীয় ডিজাইন',
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'watch',
  ADD COLUMN IF NOT EXISTS announcement_text TEXT NOT NULL DEFAULT '🔥 ৩০% ছাড়',
  ADD COLUMN IF NOT EXISTS hero_subtitle TEXT NOT NULL DEFAULT 'সময়ের সাথে যারা এগিয়ে থাকে, তাদের হাতে থাকে Kronos।',
  ADD COLUMN IF NOT EXISTS footer_cta_title TEXT NOT NULL DEFAULT 'আজই আপনার Kronos অর্ডার করুন',
  ADD COLUMN IF NOT EXISTS footer_cta_subtitle TEXT NOT NULL DEFAULT 'সীমিত সময়ের অফার। স্টক শেষ হওয়ার আগেই অর্ডার করুন।',
  ADD COLUMN IF NOT EXISTS footer_text TEXT NOT NULL DEFAULT '© ২০২৬ Kronos Premium Watch। সর্বস্বত্ব সংরক্ষিত।',
  ADD COLUMN IF NOT EXISTS online_payment_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS timer_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '#b8963e',
  ADD COLUMN IF NOT EXISTS video_section_title TEXT NOT NULL DEFAULT 'Kronos — কাছ থেকে দেখুন',
  ADD COLUMN IF NOT EXISTS features_section_title TEXT NOT NULL DEFAULT 'কেন Kronos বেছে নেবেন?',
  ADD COLUMN IF NOT EXISTS collection_section_title TEXT NOT NULL DEFAULT 'আমাদের আরও কালেকশন';

-- Expand products for universal use
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'watch',
  ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
