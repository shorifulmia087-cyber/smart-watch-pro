-- =============================================
-- 02-tables.sql — সব টেবিল তৈরি
-- 01-enums.sql রান করার পরে রান করুন
-- =============================================

-- ─── Products ───
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subtitle text,
  price integer NOT NULL,
  discount_percent integer NOT NULL DEFAULT 0,
  description_list text[] NOT NULL DEFAULT '{}',
  image_urls text[] NOT NULL DEFAULT '{}',
  thumbnail_url text,
  video_url text,
  features jsonb NOT NULL DEFAULT '[]',
  available_colors text[] NOT NULL DEFAULT '{}',
  stock_status text NOT NULL DEFAULT 'in_stock',
  is_featured boolean NOT NULL DEFAULT false,
  product_type text NOT NULL DEFAULT 'watch',
  sort_order integer NOT NULL DEFAULT 0,
  sourcing_cost integer NOT NULL DEFAULT 0,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Orders ───
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  customer_email text,
  address text NOT NULL,
  watch_model text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total_price integer NOT NULL,
  delivery_charge integer NOT NULL DEFAULT 70,
  delivery_location text NOT NULL DEFAULT 'dhaka',
  status order_status NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL,
  payment_type text NOT NULL DEFAULT 'cod',
  advance_amount integer NOT NULL DEFAULT 0,
  trx_id text,
  selected_color text,
  courier_booked boolean NOT NULL DEFAULT false,
  courier_provider text DEFAULT 'redx',
  tracking_id text,
  fraud_flag text,
  fraud_success_rate numeric,
  fraud_total_parcels integer,
  fraud_total_delivered integer,
  fraud_total_cancel integer,
  fraud_error_message text,
  division text,
  district text,
  upazila text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Site Settings ───
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL DEFAULT 'Kronos Premium Watch',
  brand_tagline text NOT NULL DEFAULT 'প্রিমিয়াম ক্রাফটসম্যানশিপ, অতুলনীয় ডিজাইন',
  announcement_text text NOT NULL DEFAULT '🔥 ৩০% ছাড়',
  hero_subtitle text NOT NULL DEFAULT 'সময়ের সাথে যারা এগিয়ে থাকে, তাদের হাতে থাকে Kronos।',
  primary_color text NOT NULL DEFAULT '#b8963e',
  discount_percent integer NOT NULL DEFAULT 30,
  countdown_hours integer NOT NULL DEFAULT 2,
  timer_enabled boolean NOT NULL DEFAULT true,
  delivery_charge_inside integer NOT NULL DEFAULT 70,
  delivery_charge_outside integer NOT NULL DEFAULT 150,
  bkash_number text NOT NULL DEFAULT '01XXXXXXXXX',
  nagad_number text NOT NULL DEFAULT '01XXXXXXXXX',
  rocket_number text NOT NULL DEFAULT '01XXXXXXXXX',
  whatsapp_number text NOT NULL DEFAULT '8801XXXXXXXXX',
  online_payment_enabled boolean NOT NULL DEFAULT true,
  min_success_rate integer NOT NULL DEFAULT 60,
  offer_start_at timestamptz,
  offer_end_at timestamptz,
  logo_url text,
  product_type text NOT NULL DEFAULT 'watch',
  footer_text text NOT NULL DEFAULT '© ২০২৬ Kronos Premium Watch। সর্বস্বত্ব সংরক্ষিত।',
  footer_cta_title text NOT NULL DEFAULT 'আজই আপনার Kronos অর্ডার করুন',
  footer_cta_subtitle text NOT NULL DEFAULT 'সীমিত সময়ের অফার। স্টক শেষ হওয়ার আগেই অর্ডার করুন।',
  video_section_title text NOT NULL DEFAULT 'Kronos — কাছ থেকে দেখুন',
  collection_section_title text NOT NULL DEFAULT 'আমাদের আরও কালেকশন',
  features_section_title text NOT NULL DEFAULT 'কেন Kronos বেছে নেবেন?',
  developer_name text DEFAULT '',
  developer_url text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Review Images ───
CREATE TABLE public.review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── User Roles ───
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- ─── Courier Settings ───
CREATE TABLE public.courier_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  api_key text DEFAULT '',
  api_secret text DEFAULT '',
  sandbox_api_key text DEFAULT '',
  sandbox_api_secret text DEFAULT '',
  production_api_key text DEFAULT '',
  production_api_secret text DEFAULT '',
  is_sandbox boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Facebook Pixel Settings ───
CREATE TABLE public.facebook_pixel_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pixel_id text NOT NULL DEFAULT '',
  access_token text NOT NULL DEFAULT '',
  enabled_events text[] NOT NULL DEFAULT ARRAY['PageView', 'Purchase'],
  updated_at timestamptz NOT NULL DEFAULT now()
);
