
CREATE TABLE public.review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review images"
ON public.review_images FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can insert review images"
ON public.review_images FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update review images"
ON public.review_images FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete review images"
ON public.review_images FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
