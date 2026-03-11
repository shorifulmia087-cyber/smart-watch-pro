
-- Add product_id column to review_images (nullable for backward compatibility)
ALTER TABLE public.review_images 
ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- Index for efficient filtering
CREATE INDEX idx_review_images_product_id ON public.review_images(product_id);
