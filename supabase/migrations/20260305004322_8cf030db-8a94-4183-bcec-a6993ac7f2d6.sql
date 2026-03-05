
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true);

CREATE POLICY "Anyone can view review images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'review-images');

CREATE POLICY "Admins can upload review images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete review images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'review-images' AND public.has_role(auth.uid(), 'admin'));
