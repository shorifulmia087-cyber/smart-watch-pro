
-- Performance indexes for Free Tier optimization
-- Orders: frequently filtered/sorted columns
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders (phone);
CREATE INDEX IF NOT EXISTS idx_orders_courier_booked ON public.orders (courier_booked);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders (payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at DESC);

-- Products: sort order and featured lookup
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products (sort_order);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (is_featured) WHERE is_featured = true;

-- User roles: fast role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles (user_id, role);
