
CREATE OR REPLACE FUNCTION public.remove_team_member(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
  END IF;

  -- Prevent removing yourself
  IF _user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_remove_self');
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
