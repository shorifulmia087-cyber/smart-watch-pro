
-- Drop all existing restrictive policies and recreate as permissive

-- orders table
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders by email" ON public.orders;

CREATE POLICY "Public can create orders" ON public.orders FOR INSERT TO anon, authenticated
WITH CHECK (customer_name IS NOT NULL AND phone IS NOT NULL AND address IS NOT NULL AND watch_model IS NOT NULL AND total_price > 0);

CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own orders by email" ON public.orders FOR SELECT TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

-- products table
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- site_settings table
DROP POLICY IF EXISTS "Anyone can view settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;

CREATE POLICY "Anyone can view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- review_images table
DROP POLICY IF EXISTS "Anyone can view review images" ON public.review_images;
DROP POLICY IF EXISTS "Admins can insert review images" ON public.review_images;
DROP POLICY IF EXISTS "Admins can update review images" ON public.review_images;
DROP POLICY IF EXISTS "Admins can delete review images" ON public.review_images;

CREATE POLICY "Anyone can view review images" ON public.review_images FOR SELECT USING (true);
CREATE POLICY "Admins can insert review images" ON public.review_images FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update review images" ON public.review_images FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete review images" ON public.review_images FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- courier_settings table
DROP POLICY IF EXISTS "Admins can view courier settings" ON public.courier_settings;
DROP POLICY IF EXISTS "Admins can insert courier settings" ON public.courier_settings;
DROP POLICY IF EXISTS "Admins can update courier settings" ON public.courier_settings;

CREATE POLICY "Admins can view courier settings" ON public.courier_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert courier settings" ON public.courier_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update courier settings" ON public.courier_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles table
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;

CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
