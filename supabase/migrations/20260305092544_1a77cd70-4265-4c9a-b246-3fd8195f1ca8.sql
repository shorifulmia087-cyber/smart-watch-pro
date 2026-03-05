
-- Fix: "Users can view own orders by email" policy references auth.users directly
-- which causes "permission denied for table users" error for anon/authenticated roles.
-- This blocks BOTH order creation (INSERT) and admin order viewing (SELECT).

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can view own orders by email" ON public.orders;

-- Recreate using auth.email() which is safe for anon/authenticated roles
CREATE POLICY "Users can view own orders by email" ON public.orders
FOR SELECT TO authenticated
USING (customer_email = auth.email());
