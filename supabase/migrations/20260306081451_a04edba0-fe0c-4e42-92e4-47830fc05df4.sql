
-- Add fraud check columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fraud_total_parcels integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fraud_total_delivered integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fraud_total_cancel integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fraud_success_rate numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fraud_flag text DEFAULT NULL;

-- Add min_success_rate to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS min_success_rate integer NOT NULL DEFAULT 60;
