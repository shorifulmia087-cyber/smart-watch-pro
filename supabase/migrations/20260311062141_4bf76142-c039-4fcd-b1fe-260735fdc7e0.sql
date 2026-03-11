
-- Add referrer_source column to orders table
ALTER TABLE public.orders ADD COLUMN referrer_source text DEFAULT null;
