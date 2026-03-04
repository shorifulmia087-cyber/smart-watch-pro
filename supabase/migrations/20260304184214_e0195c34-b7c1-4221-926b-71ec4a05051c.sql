
-- Fix: restrict order insert to only allow non-authenticated or basic validation
-- The "Anyone can create orders" policy is intentionally permissive for public checkout
-- but let's add basic validation by requiring non-empty fields
DROP POLICY "Anyone can create orders" ON public.orders;
CREATE POLICY "Public can create orders" ON public.orders
  FOR INSERT WITH CHECK (
    customer_name IS NOT NULL AND
    phone IS NOT NULL AND
    address IS NOT NULL AND
    watch_model IS NOT NULL AND
    total_price > 0
  );
