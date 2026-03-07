-- =============================================
-- 03-functions.sql — Security & Utility Functions
-- 02-tables.sql রান করার পরে রান করুন
-- =============================================

-- ─── has_role: চেক করে ইউজারের নির্দিষ্ট রোল আছে কিনা ───
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ─── is_super_admin: প্রথম অ্যাডমিন কিনা চেক করে ───
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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

-- ─── add_team_member: টিম মেম্বার যোগ (শুধু সুপার অ্যাডমিন) ───
CREATE OR REPLACE FUNCTION public.add_team_member(_email text, _role app_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _target_user_id uuid;
  _existing_role_id uuid;
  _super_admin_id uuid;
BEGIN
  SELECT user_id INTO _super_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  IF auth.uid() IS NULL OR auth.uid() != _super_admin_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
  END IF;

  SELECT id INTO _target_user_id
  FROM auth.users
  WHERE email = lower(trim(_email));

  IF _target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  SELECT id INTO _existing_role_id
  FROM public.user_roles
  WHERE user_id = _target_user_id AND role = _role;

  IF _existing_role_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_exists');
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, _role);
  RETURN jsonb_build_object('success', true, 'user_id', _target_user_id);
END;
$$;

-- ─── remove_team_member: টিম মেম্বার সরানো (শুধু সুপার অ্যাডমিন) ───
CREATE OR REPLACE FUNCTION public.remove_team_member(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _super_admin_id uuid;
BEGIN
  SELECT user_id INTO _super_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  IF auth.uid() IS NULL OR auth.uid() != _super_admin_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
  END IF;

  IF _user_id = _super_admin_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_remove_super_admin');
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── update_updated_at: Auto-update timestamp trigger ───
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── Triggers: updated_at auto-update ───
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courier_settings_updated_at
  BEFORE UPDATE ON public.courier_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facebook_pixel_updated_at
  BEFORE UPDATE ON public.facebook_pixel_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
