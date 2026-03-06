
ALTER TABLE public.orders 
ADD COLUMN payment_type text NOT NULL DEFAULT 'cod',
ADD COLUMN advance_amount integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.orders.payment_type IS 'cod | full_payment | delivery_charge_only';
COMMENT ON COLUMN public.orders.advance_amount IS 'Amount paid in advance (0 for COD)';
