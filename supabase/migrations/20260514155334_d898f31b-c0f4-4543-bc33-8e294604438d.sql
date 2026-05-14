CREATE OR REPLACE FUNCTION public.accept_invitation(_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.invitations;
  v_user uuid := (select auth.uid());
  v_user_email text;
  v_existing_preferences jsonb;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Você precisa entrar para aceitar este convite';
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user;

  SELECT * INTO v_inv
  FROM public.invitations
  WHERE token = _token;

  IF v_inv.id IS NULL THEN
    RAISE EXCEPTION 'Convite não encontrado';
  END IF;

  IF lower(coalesce(v_user_email, '')) <> lower(v_inv.email) THEN
    RAISE EXCEPTION 'Este convite foi enviado para %, mas você entrou como %', v_inv.email, coalesce(v_user_email, 'outro e-mail');
  END IF;

  IF v_inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Este convite está com status %', v_inv.status;
  END IF;

  IF v_inv.expires_at < now() THEN
    UPDATE public.invitations
    SET status = 'expired'
    WHERE id = v_inv.id;
    RAISE EXCEPTION 'Este convite expirou';
  END IF;

  INSERT INTO public.tenant_members(tenant_id, user_id, role)
  VALUES (v_inv.tenant_id, v_user, v_inv.role)
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  SELECT coalesce(preferences, '{}'::jsonb) INTO v_existing_preferences
  FROM public.profiles
  WHERE id = v_user;

  UPDATE public.profiles
  SET preferences = coalesce(v_existing_preferences, '{}'::jsonb) || jsonb_build_object('tenant_id', v_inv.tenant_id)
  WHERE id = v_user;

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), accepted_by = v_user
  WHERE id = v_inv.id;

  RETURN v_inv.tenant_id;
END
$$;