
ALTER TABLE public.products ADD COLUMN available_colors text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.orders ADD COLUMN selected_color text NULL;
