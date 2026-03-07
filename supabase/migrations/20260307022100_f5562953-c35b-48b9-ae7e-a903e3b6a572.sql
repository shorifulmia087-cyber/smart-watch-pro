
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS upazila text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS division text;

CREATE INDEX IF NOT EXISTS idx_orders_division ON public.orders(division);
CREATE INDEX IF NOT EXISTS idx_orders_district ON public.orders(district);
