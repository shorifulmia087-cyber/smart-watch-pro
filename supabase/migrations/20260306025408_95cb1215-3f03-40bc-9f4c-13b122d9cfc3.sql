
-- Add created_at to identify the first (super) admin
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Update add_team_member: only super admin (first admin) can add
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
  -- Find the super admin (first admin by created_at)
  SELECT user_id INTO _super_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Only super admin can call this
  IF auth.uid() IS NULL OR auth.uid() != _super_admin_id THEN
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

-- Update remove_team_member: only super admin can remove, can't remove super admin
CREATE OR REPLACE FUNCTION public.remove_team_member(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _super_admin_id uuid;
BEGIN
  -- Find the super admin
  SELECT user_id INTO _super_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  IF auth.uid() IS NULL OR auth.uid() != _super_admin_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
  END IF;

  -- Can't remove the super admin
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
