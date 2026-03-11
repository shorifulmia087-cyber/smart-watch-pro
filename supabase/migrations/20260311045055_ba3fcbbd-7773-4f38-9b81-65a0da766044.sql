
-- Create coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value integer NOT NULL DEFAULT 0,
  min_order_amount integer NOT NULL DEFAULT 0,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Public can view active coupons (for validation)
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (true);

-- Admins can manage coupons
CREATE POLICY "Admins can insert coupons" ON public.coupons
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coupons" ON public.coupons
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete coupons" ON public.coupons
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add coupon fields to orders
ALTER TABLE public.orders ADD COLUMN coupon_code text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN coupon_discount integer NOT NULL DEFAULT 0;

-- Add user_id to orders (nullable, for logged-in users)
ALTER TABLE public.orders ADD COLUMN user_id uuid DEFAULT NULL;

-- RLS policy: Users can view own orders by user_id
CREATE POLICY "Users can view own orders by user_id" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
