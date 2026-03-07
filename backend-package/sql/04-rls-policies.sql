-- =============================================
-- 04-rls-policies.sql — Row Level Security
-- 03-functions.sql রান করার পরে রান করুন
-- =============================================

-- ─── Enable RLS on all tables ───
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_pixel_settings ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════
-- Products
-- ═══════════════════════════════════════
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- Orders
-- ═══════════════════════════════════════
CREATE POLICY "Public can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    customer_name IS NOT NULL
    AND phone IS NOT NULL
    AND address IS NOT NULL
    AND watch_model IS NOT NULL
    AND total_price > 0
  );

CREATE POLICY "Anyone can select own just-inserted order"
  ON public.orders FOR SELECT USING (true);

CREATE POLICY "Users can view own orders by email"
  ON public.orders FOR SELECT
  USING (customer_email = auth.email());

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- Site Settings
-- ═══════════════════════════════════════
CREATE POLICY "Anyone can view settings"
  ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Admins can update settings"
  ON public.site_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- Review Images
-- ═══════════════════════════════════════
CREATE POLICY "Anyone can view review images"
  ON public.review_images FOR SELECT USING (true);

CREATE POLICY "Admins can insert review images"
  ON public.review_images FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update review images"
  ON public.review_images FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete review images"
  ON public.review_images FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- User Roles
-- ═══════════════════════════════════════
CREATE POLICY "Admins can view roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- Courier Settings
-- ═══════════════════════════════════════
CREATE POLICY "Admins can view courier settings"
  ON public.courier_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert courier settings"
  ON public.courier_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update courier settings"
  ON public.courier_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- Facebook Pixel Settings
-- ═══════════════════════════════════════
CREATE POLICY "Admins can view pixel settings"
  ON public.facebook_pixel_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert pixel settings"
  ON public.facebook_pixel_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pixel settings"
  ON public.facebook_pixel_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));
