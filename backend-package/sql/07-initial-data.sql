-- =============================================
-- 07-initial-data.sql — প্রাথমিক ডাটা (ঐচ্ছিক)
-- ⚠️ শুধু নতুন প্রজেক্টে রান করুন
-- =============================================

-- প্রাথমিক সাইট সেটিংস (একটি row থাকা আবশ্যক)
INSERT INTO public.site_settings (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- কুরিয়ার প্রোভাইডার সেটআপ (খালি credentials সহ)
INSERT INTO public.courier_settings (provider, is_sandbox, is_active)
VALUES
  ('steadfast', true, false),
  ('redx', true, false),
  ('pathao', true, false)
ON CONFLICT DO NOTHING;

-- Facebook Pixel সেটিংস (খালি)
INSERT INTO public.facebook_pixel_settings (pixel_id, access_token)
VALUES ('', '')
ON CONFLICT DO NOTHING;

-- Realtime সক্রিয় করুন orders টেবিলে (ঐচ্ছিক)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
