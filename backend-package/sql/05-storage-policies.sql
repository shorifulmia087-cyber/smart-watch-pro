-- =============================================
-- 05-storage-policies.sql — Storage Bucket Policies
-- ⚠️ আগে Dashboard থেকে buckets তৈরি করুন:
--    product-images (Public)
--    review-images (Public)
--    brand-assets (Public)
-- =============================================

-- যেকেউ দেখতে পারবে
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('product-images', 'review-images', 'brand-assets'));

-- শুধু অ্যাডমিন আপলোড করতে পারবে
CREATE POLICY "Admin upload access"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('product-images', 'review-images', 'brand-assets')
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- শুধু অ্যাডমিন আপডেট করতে পারবে
CREATE POLICY "Admin update access"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('product-images', 'review-images', 'brand-assets')
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- শুধু অ্যাডমিন ডিলিট করতে পারবে
CREATE POLICY "Admin delete access"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('product-images', 'review-images', 'brand-assets')
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
