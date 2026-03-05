ALTER TABLE public.orders 
ADD COLUMN tracking_id text,
ADD COLUMN courier_provider text DEFAULT 'redx';