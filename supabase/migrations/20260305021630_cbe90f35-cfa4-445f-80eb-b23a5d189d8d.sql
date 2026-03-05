ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'returned';

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_title text DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_description text DEFAULT NULL;