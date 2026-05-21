-- Espaços padrão (ClickUp-like) + Pipefy → Banco de Projetos

CREATE OR REPLACE FUNCTION public.seed_clickup_spaces(_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _banco uuid;
  _ia uuid;
  _exp uuid;
BEGIN
  IF _tenant_id IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.squads WHERE tenant_id = _tenant_id AND name = 'Banco de Projetos') THEN
    INSERT INTO public.squads (tenant_id, name, kind, color, description, sort_order)
    VALUES (_tenant_id, 'Banco de Projetos', 'custom', '#0ea5e9', 'Cards do Pipefy e portfólio de projetos', 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.squads WHERE tenant_id = _tenant_id AND kind = 'ia') THEN
    INSERT INTO public.squads (tenant_id, name, kind, color, description, sort_order)
    VALUES (_tenant_id, 'Team IA & Automação', 'ia', '#7c3aed', 'Espaço do time de IA', 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.squads WHERE tenant_id = _tenant_id AND kind = 'expansao') THEN
    INSERT INTO public.squads (tenant_id, name, kind, color, description, sort_order)
    VALUES (_tenant_id, 'Team Expansão', 'expansao', '#10b981', 'Espaço do time de Expansão', 2);
  END IF;

  SELECT id INTO _banco FROM public.squads
  WHERE tenant_id = _tenant_id AND name = 'Banco de Projetos' LIMIT 1;
  SELECT id INTO _ia FROM public.squads
  WHERE tenant_id = _tenant_id AND kind = 'ia' LIMIT 1;
  SELECT id INTO _exp FROM public.squads
  WHERE tenant_id = _tenant_id AND kind = 'expansao' LIMIT 1;

  IF _banco IS NULL OR _ia IS NULL OR _exp IS NULL THEN RETURN; END IF;

  -- Raiz de espaço por squad (kind space_root) se ainda não existir
  INSERT INTO public.projects (tenant_id, squad_id, name, key, kind, sort_order, color)
  SELECT _tenant_id, _banco, 'Banco de Projetos', 'BANCO', 'space_root', 0, '#0ea5e9'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE tenant_id = _tenant_id AND squad_id = _banco AND kind = 'space_root'
  );

  INSERT INTO public.projects (tenant_id, squad_id, name, key, kind, sort_order, color)
  SELECT _tenant_id, _ia, 'Team IA & Automação', 'IA', 'space_root', 0, '#7c3aed'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE tenant_id = _tenant_id AND squad_id = _ia AND kind = 'space_root'
  );

  INSERT INTO public.projects (tenant_id, squad_id, name, key, kind, sort_order, color)
  SELECT _tenant_id, _exp, 'Team Expansão', 'EXP', 'space_root', 0, '#10b981'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE tenant_id = _tenant_id AND squad_id = _exp AND kind = 'space_root'
  );

  -- Pipefy cards sem squad → Banco de Projetos
  UPDATE public.projects
  SET squad_id = _banco, updated_at = now()
  WHERE tenant_id = _tenant_id
    AND pipefy_card_id IS NOT NULL
    AND (squad_id IS NULL OR squad_id <> _banco);
END;
$$;

REVOKE ALL ON FUNCTION public.seed_clickup_spaces(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_clickup_spaces(uuid) TO authenticated;

-- Chama seed ao final do bootstrap existente (corpo preservado da função original)
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
  SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'o2-inc' LIMIT 1;
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, slug, primary_color, accent_color, created_by)
    VALUES ('O2 Inc.', 'o2-inc', '#0EA5E9', '#FCD34D', _user_id)
    RETURNING id INTO v_tenant_id;
  END IF;

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

  INSERT INTO public.task_statuses (tenant_id, name, slug, color, position, is_done)
  VALUES
    (v_tenant_id, 'A fazer',    'todo',        '#94a3b8', 1, false),
    (v_tenant_id, 'Fazendo',    'doing',       '#0ea5e9', 2, false),
    (v_tenant_id, 'Em revisão', 'in_review',   '#f59e0b', 3, false),
    (v_tenant_id, 'Concluído',  'done',        '#10b981', 4, true)
  ON CONFLICT DO NOTHING;

  SELECT count(*) INTO v_member_count FROM public.tenant_members WHERE tenant_id = v_tenant_id;
  IF NOT EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = v_tenant_id AND user_id = _user_id) THEN
    INSERT INTO public.tenant_members (tenant_id, user_id, role)
    VALUES (v_tenant_id, _user_id, CASE WHEN v_member_count = 0 THEN 'admin'::public.tenant_role ELSE 'specialist'::public.tenant_role END);
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = _user_id;
  v_user_name := COALESCE(split_part(v_user_email, '@', 1), 'user');
  v_inbox_key := 'IN' || upper(substr(translate(v_user_name, '._-', ''), 1, 4));

  IF EXISTS (SELECT 1 FROM public.projects WHERE tenant_id = v_tenant_id AND key = v_inbox_key) THEN
    SELECT id INTO v_project_id FROM public.projects
      WHERE tenant_id = v_tenant_id AND key = v_inbox_key AND created_by = _user_id;
    IF v_project_id IS NULL THEN
      v_inbox_key := v_inbox_key || substr(replace(_user_id::text, '-', ''), 1, 4);
    END IF;
  END IF;

  IF v_project_id IS NULL THEN
    INSERT INTO public.projects (tenant_id, name, key, description, color, icon, created_by, kind)
    VALUES (
      v_tenant_id,
      'Inbox de ' || v_user_name,
      v_inbox_key,
      'Lista pessoal — depositar tarefas rápidas.',
      '#0EA5E9',
      'inbox',
      _user_id,
      'inbox'
    )
    RETURNING id INTO v_project_id;
  END IF;

  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (v_project_id, _user_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;

  UPDATE public.profiles
    SET preferences = COALESCE(preferences, '{}'::jsonb) ||
                      jsonb_build_object(
                        'inbox_project_id', v_project_id,
                        'tenant_id', v_tenant_id
                      )
    WHERE id = _user_id;

  PERFORM public.seed_clickup_spaces(v_tenant_id);

  RETURN v_project_id;
END;
$$;
