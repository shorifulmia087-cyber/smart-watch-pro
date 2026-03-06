
-- Add fraud_error_message column to orders for storing API error details
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fraud_error_message text DEFAULT NULL;
