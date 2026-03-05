
CREATE TABLE public.courier_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  api_key text DEFAULT '',
  api_secret text DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view courier settings" ON public.courier_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update courier settings" ON public.courier_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert courier settings" ON public.courier_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default rows for each provider
INSERT INTO public.courier_settings (provider, api_key, api_secret, is_active) VALUES
  ('redx', '', '', false),
  ('pathao', '', '', false),
  ('steadfast', '', '', false);
