
CREATE OR REPLACE FUNCTION public.add_team_member(_email text, _role app_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_user_id uuid;
  _existing_role_id uuid;
BEGIN
  -- Only allow admins to call this
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
  END IF;

  -- Look up the user by email in auth.users
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

  -- Insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role);

  RETURN jsonb_build_object('success', true, 'user_id', _target_user_id);
END;
$$;
