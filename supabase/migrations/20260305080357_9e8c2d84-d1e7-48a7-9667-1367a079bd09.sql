CREATE POLICY "Users can view own orders by email"
ON public.orders FOR SELECT
TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));