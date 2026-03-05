
ALTER TABLE public.courier_settings
ADD COLUMN IF NOT EXISTS is_sandbox boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS sandbox_api_key text DEFAULT '',
ADD COLUMN IF NOT EXISTS sandbox_api_secret text DEFAULT '',
ADD COLUMN IF NOT EXISTS production_api_key text DEFAULT '',
ADD COLUMN IF NOT EXISTS production_api_secret text DEFAULT '';

-- Migrate existing data: copy current api_key/api_secret to sandbox fields
UPDATE public.courier_settings
SET sandbox_api_key = COALESCE(api_key, ''),
    sandbox_api_secret = COALESCE(api_secret, '');
