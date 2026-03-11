
-- Add order_manager to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'order_manager';

-- Update add_team_member to allow admins to add order_managers
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
  _caller_is_super boolean;
  _caller_is_admin boolean;
BEGIN
  -- Find the super admin (first admin by created_at)
  SELECT user_id INTO _super_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  _caller_is_super := (auth.uid() IS NOT NULL AND auth.uid() = _super_admin_id);
  _caller_is_admin := EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');

  -- Permission check: super admin can add any role, admin can only add order_manager
  IF NOT _caller_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
  END IF;

  -- Only super admin can add admin role
  IF _role = 'admin' AND NOT _caller_is_super THEN
    RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
  END IF;

  -- Look up the user by email
  SELECT id INTO _target_user_id
  FROM auth.users
  WHERE email = lower(trim(_email));

  IF _target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  -- Check if already has this role
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

-- Update remove_team_member to allow admins to remove order_managers
CREATE OR REPLACE FUNCTION public.remove_team_member(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _super_admin_id uuid;
  _caller_is_super boolean;
  _caller_is_admin boolean;
  _target_role app_role;
BEGIN
  -- Find the super admin
  SELECT user_id INTO _super_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  _caller_is_super := (auth.uid() IS NOT NULL AND auth.uid() = _super_admin_id);
  _caller_is_admin := EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');

  IF NOT _caller_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
  END IF;

  -- Can't remove the super admin
  IF _user_id = _super_admin_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_remove_super_admin');
  END IF;

  -- Get target's role
  SELECT role INTO _target_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;

  -- Non-super admins can only remove order_managers
  IF NOT _caller_is_super AND _target_role = 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
