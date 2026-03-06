
CREATE TABLE public.facebook_pixel_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pixel_id text NOT NULL DEFAULT '',
  access_token text NOT NULL DEFAULT '',
  enabled_events text[] NOT NULL DEFAULT ARRAY['PageView', 'Purchase'],
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.facebook_pixel_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view pixel settings" ON public.facebook_pixel_settings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pixel settings" ON public.facebook_pixel_settings
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert pixel settings" ON public.facebook_pixel_settings
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default row
INSERT INTO public.facebook_pixel_settings (pixel_id, access_token, enabled_events)
VALUES ('', '', ARRAY['PageView', 'Purchase']);

-- Function to check if user is super admin (first admin by created_at)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1
  ) AND _user_id = (
    SELECT user_id FROM public.user_roles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1
  )
$$;
