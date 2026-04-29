-- ============================================================
-- Bootstrap de workspace por usuário
-- ============================================================

CREATE OR REPLACE FUNCTION public.ensure_user_workspace(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_project_id UUID;
  v_user_email TEXT;
  v_user_name TEXT;
  v_inbox_key TEXT;
  v_squad_id UUID;
  v_member_count INT;
BEGIN
  -- 1) Tenant default O2 Inc.
  SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'o2-inc' LIMIT 1;
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, slug, primary_color, accent_color, created_by)
    VALUES ('O2 Inc.', 'o2-inc', '#0EA5E9', '#FCD34D', _user_id)
    RETURNING id INTO v_tenant_id;
  END IF;

  -- 2) Squads padrão (idempotente por nome)
  IF NOT EXISTS (SELECT 1 FROM public.squads WHERE tenant_id = v_tenant_id AND kind = 'ia') THEN
    INSERT INTO public.squads (tenant_id, name, kind, color)
    VALUES (v_tenant_id, 'IA & Automação', 'ia', '#7c3aed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.squads WHERE tenant_id = v_tenant_id AND kind = 'marketing') THEN
    INSERT INTO public.squads (tenant_id, name, kind, color)
    VALUES (v_tenant_id, 'Marketing', 'marketing', '#ef4444');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.squads WHERE tenant_id = v_tenant_id AND kind = 'expansao') THEN
    INSERT INTO public.squads (tenant_id, name, kind, color)
    VALUES (v_tenant_id, 'Expansão', 'expansao', '#10b981');
  END IF;

  -- 3) Status padrão (idempotente por slug)
  INSERT INTO public.task_statuses (tenant_id, name, slug, color, position, is_done)
  VALUES
    (v_tenant_id, 'A fazer',    'todo',        '#94a3b8', 1, false),
    (v_tenant_id, 'Fazendo',    'doing',       '#0ea5e9', 2, false),
    (v_tenant_id, 'Em revisão', 'in_review',   '#f59e0b', 3, false),
    (v_tenant_id, 'Concluído',  'done',        '#10b981', 4, true)
  ON CONFLICT DO NOTHING;

  -- 4) Membership no tenant: 1º usuário vira admin, demais specialists
  SELECT count(*) INTO v_member_count FROM public.tenant_members WHERE tenant_id = v_tenant_id;
  IF NOT EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = v_tenant_id AND user_id = _user_id) THEN
    INSERT INTO public.tenant_members (tenant_id, user_id, role)
    VALUES (v_tenant_id, _user_id, CASE WHEN v_member_count = 0 THEN 'admin'::public.tenant_role ELSE 'specialist'::public.tenant_role END);
  END IF;

  -- 5) Projeto Inbox pessoal
  SELECT email INTO v_user_email FROM auth.users WHERE id = _user_id;
  v_user_name := COALESCE(split_part(v_user_email, '@', 1), 'user');
  v_inbox_key := 'IN' || upper(substr(translate(v_user_name, '._-', ''), 1, 4));

  -- garante chave única dentro do tenant (sufixo numérico se colidir)
  IF EXISTS (SELECT 1 FROM public.projects WHERE tenant_id = v_tenant_id AND key = v_inbox_key) THEN
    -- o projeto já existe? se o created_by for o próprio usuário, usa; senão gera nova key
    SELECT id INTO v_project_id FROM public.projects
      WHERE tenant_id = v_tenant_id AND key = v_inbox_key AND created_by = _user_id;
    IF v_project_id IS NULL THEN
      v_inbox_key := v_inbox_key || substr(replace(_user_id::text, '-', ''), 1, 4);
    END IF;
  END IF;

  IF v_project_id IS NULL THEN
    INSERT INTO public.projects (tenant_id, name, key, description, color, icon, created_by)
    VALUES (
      v_tenant_id,
      'Inbox de ' || v_user_name,
      v_inbox_key,
      'Caixa de entrada pessoal — tarefas criadas via Quick Add caem aqui.',
      '#0EA5E9',
      'inbox',
      _user_id
    )
    RETURNING id INTO v_project_id;
  END IF;

  -- 6) Membership no projeto Inbox
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (v_project_id, _user_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;

  -- 7) Salva o inbox_project_id nas preferences do profile
  UPDATE public.profiles
    SET preferences = COALESCE(preferences, '{}'::jsonb) ||
                      jsonb_build_object(
                        'inbox_project_id', v_project_id,
                        'tenant_id', v_tenant_id
                      )
    WHERE id = _user_id;

  RETURN v_project_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_user_workspace(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_workspace(UUID) TO authenticated;

-- ============================================================
-- Estende handle_new_user para chamar ensure_user_workspace
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;

  PERFORM public.ensure_user_workspace(NEW.id);

  RETURN NEW;
END;
$$;

-- ============================================================
-- Backfill: provisiona workspace para usuários já existentes
-- ============================================================

DO $$
DECLARE u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    PERFORM public.ensure_user_workspace(u.id);
  END LOOP;
END $$;