
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true);

CREATE POLICY "Admins can upload brand assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'brand-assets' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update brand assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete brand assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view brand assets" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');
