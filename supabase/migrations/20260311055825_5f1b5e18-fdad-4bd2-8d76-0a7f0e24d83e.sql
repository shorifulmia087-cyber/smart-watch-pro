
-- 1. Order Manager can view all orders
CREATE POLICY "Order managers can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'order_manager'::app_role));

-- 2. Order Manager can update orders
CREATE POLICY "Order managers can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'order_manager'::app_role));

-- 3. Fix coupons SELECT policy: drop restrictive public policy, recreate for correct roles
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

CREATE POLICY "Anyone can view active coupons"
ON public.coupons
FOR SELECT
TO anon, authenticated
USING (is_active = true);
