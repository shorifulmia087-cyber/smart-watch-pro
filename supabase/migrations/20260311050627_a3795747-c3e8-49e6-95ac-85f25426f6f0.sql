
-- SMS Settings table
CREATE TABLE public.sms_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text NOT NULL DEFAULT '',
  sender_id text NOT NULL DEFAULT '',
  provider text NOT NULL DEFAULT 'bulksmsbd',
  is_active boolean NOT NULL DEFAULT false,
  templates jsonb NOT NULL DEFAULT '[
    {"id":"confirmed","label":"অর্ডার নিশ্চিত","template":"প্রিয় {name}, আপনার অর্ডার #{order_id} নিশ্চিত হয়েছে। মোট: ৳{total}। ধন্যবাদ!"},
    {"id":"shipped","label":"শিপমেন্ট","template":"প্রিয় {name}, আপনার অর্ডার #{order_id} শিপ করা হয়েছে। ট্র্যাকিং: {tracking_id}। ধন্যবাদ!"},
    {"id":"delivered","label":"ডেলিভারি সম্পন্ন","template":"প্রিয় {name}, আপনার অর্ডার #{order_id} সফলভাবে ডেলিভারি হয়েছে। আমাদের সাথে থাকুন!"}
  ]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sms settings" ON public.sms_settings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert sms settings" ON public.sms_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update sms settings" ON public.sms_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Order Notes table
CREATE TABLE public.order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view order notes" ON public.order_notes FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert order notes" ON public.order_notes FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete order notes" ON public.order_notes FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Insert default SMS settings row
INSERT INTO public.sms_settings (id) VALUES (gen_random_uuid());
