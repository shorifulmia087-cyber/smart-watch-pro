ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS developer_name text DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS developer_url text DEFAULT '';