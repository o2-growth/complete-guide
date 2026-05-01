
-- HELP CENTER
CREATE TABLE public.help_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.help_categories(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body_md text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  views int NOT NULL DEFAULT 0,
  helpful_count int NOT NULL DEFAULT 0,
  not_helpful_count int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  title text NOT NULL,
  body_md text NOT NULL,
  kind text NOT NULL DEFAULT 'feature' CHECK (kind IN ('feature','fix','improvement','breaking')),
  released_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.system_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  status text NOT NULL DEFAULT 'operational' CHECK (status IN ('operational','degraded','outage','maintenance')),
  message text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "help_categories_read_all" ON public.help_categories FOR SELECT USING (true);
CREATE POLICY "help_articles_read_published" ON public.help_articles FOR SELECT USING (published = true);
CREATE POLICY "changelog_read_all" ON public.changelog_entries FOR SELECT USING (true);
CREATE POLICY "status_read_all" ON public.system_status FOR SELECT USING (true);

-- GAMIFICAÇÃO
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  icon text,
  xp_reward int NOT NULL DEFAULT 10,
  category text NOT NULL DEFAULT 'general',
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  threshold_kind text,
  threshold_value int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE public.user_xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  xp_total int NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_activity_date date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind text NOT NULL,
  xp int NOT NULL,
  ref_id uuid,
  ref_kind text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_read_all" ON public.achievements FOR SELECT USING (true);

CREATE POLICY "user_achievements_read" ON public.user_achievements FOR SELECT
  USING (user_id = auth.uid() OR tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY "user_achievements_insert_own" ON public.user_achievements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_xp_read_tenant" ON public.user_xp FOR SELECT
  USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY "user_xp_upsert_own" ON public.user_xp FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "xp_events_read" ON public.xp_events FOR SELECT
  USING (user_id = auth.uid() OR tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY "xp_events_insert_own" ON public.xp_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- WHITE-LABEL / ENTERPRISE
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_domain text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS white_label boolean NOT NULL DEFAULT false;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS data_residency text NOT NULL DEFAULT 'us-east-1';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS sla_tier text NOT NULL DEFAULT 'standard' CHECK (sla_tier IN ('standard','premium','enterprise'));

CREATE TABLE public.sso_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('saml','oidc')),
  metadata_url text,
  entity_id text,
  domains text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reason text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.compliance_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('audit','soc2','gdpr','full')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  file_url text,
  date_from date,
  date_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sso_admin_manage" ON public.sso_configurations FOR ALL
  USING (public.has_tenant_role(tenant_id, 'admin'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'admin'));

CREATE POLICY "impersonation_admin_read" ON public.impersonation_sessions FOR SELECT
  USING (public.has_tenant_role(tenant_id, 'admin') OR admin_user_id = auth.uid());
CREATE POLICY "impersonation_admin_insert" ON public.impersonation_sessions FOR INSERT
  WITH CHECK (admin_user_id = auth.uid() AND public.has_tenant_role(tenant_id, 'admin'));
CREATE POLICY "impersonation_admin_update" ON public.impersonation_sessions FOR UPDATE
  USING (admin_user_id = auth.uid());

CREATE POLICY "compliance_admin_manage" ON public.compliance_exports FOR ALL
  USING (public.has_tenant_role(tenant_id, 'admin'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'admin'));

-- RPCs
CREATE OR REPLACE FUNCTION public.award_xp(_tenant uuid, _kind text, _xp int, _ref_id uuid DEFAULT NULL, _ref_kind text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _new_total int; _new_level int;
  _today date := current_date;
  _last date; _streak int; _longest int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.xp_events (user_id, tenant_id, kind, xp, ref_id, ref_kind)
  VALUES (_uid, _tenant, _kind, _xp, _ref_id, _ref_kind);
  SELECT last_activity_date, current_streak, longest_streak INTO _last, _streak, _longest
  FROM public.user_xp WHERE user_id = _uid AND tenant_id = _tenant;
  IF _last IS NULL THEN _streak := 1;
  ELSIF _last = _today THEN _streak := COALESCE(_streak, 1);
  ELSIF _last = _today - 1 THEN _streak := COALESCE(_streak, 0) + 1;
  ELSE _streak := 1; END IF;
  _longest := GREATEST(COALESCE(_longest, 0), _streak);
  INSERT INTO public.user_xp (user_id, tenant_id, xp_total, level, current_streak, longest_streak, last_activity_date)
  VALUES (_uid, _tenant, _xp, 1 + (_xp / 100), _streak, _longest, _today)
  ON CONFLICT (user_id, tenant_id) DO UPDATE
  SET xp_total = public.user_xp.xp_total + _xp,
      level = 1 + ((public.user_xp.xp_total + _xp) / 100),
      current_streak = _streak,
      longest_streak = _longest,
      last_activity_date = _today,
      updated_at = now()
  RETURNING xp_total, level INTO _new_total, _new_level;
  RETURN jsonb_build_object('xp_total', _new_total, 'level', _new_level, 'streak', _streak);
END; $$;

CREATE OR REPLACE FUNCTION public.check_achievements(_tenant uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid(); _ach record; _value int; _unlocked int := 0;
BEGIN
  IF _uid IS NULL THEN RETURN 0; END IF;
  FOR _ach IN
    SELECT a.* FROM public.achievements a
    WHERE a.threshold_kind IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.user_achievements ua WHERE ua.user_id = _uid AND ua.achievement_id = a.id)
  LOOP
    _value := 0;
    IF _ach.threshold_kind = 'tasks_done' THEN
      SELECT count(*) INTO _value FROM public.tasks WHERE assignee_id = _uid AND status = 'done';
    ELSIF _ach.threshold_kind = 'streak_days' THEN
      SELECT current_streak INTO _value FROM public.user_xp WHERE user_id = _uid AND tenant_id = _tenant;
    ELSIF _ach.threshold_kind = 'xp_total' THEN
      SELECT xp_total INTO _value FROM public.user_xp WHERE user_id = _uid AND tenant_id = _tenant;
    ELSIF _ach.threshold_kind = 'level' THEN
      SELECT level INTO _value FROM public.user_xp WHERE user_id = _uid AND tenant_id = _tenant;
    END IF;
    IF COALESCE(_value, 0) >= _ach.threshold_value THEN
      INSERT INTO public.user_achievements (user_id, tenant_id, achievement_id)
      VALUES (_uid, _tenant, _ach.id) ON CONFLICT DO NOTHING;
      _unlocked := _unlocked + 1;
    END IF;
  END LOOP;
  RETURN _unlocked;
END; $$;

CREATE OR REPLACE FUNCTION public.squad_leaderboard(_tenant uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, xp_total int, level int, current_streak int, achievements_count int)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT ux.user_id, p.display_name, p.avatar_url, ux.xp_total, ux.level, ux.current_streak,
    (SELECT count(*)::int FROM public.user_achievements ua WHERE ua.user_id = ux.user_id AND ua.tenant_id = _tenant)
  FROM public.user_xp ux
  LEFT JOIN public.profiles p ON p.id = ux.user_id
  WHERE ux.tenant_id = _tenant AND _tenant IN (SELECT public.user_tenant_ids())
  ORDER BY ux.xp_total DESC LIMIT 50;
$$;

CREATE OR REPLACE FUNCTION public.start_impersonation(_target_user uuid, _tenant uuid, _reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF NOT public.has_tenant_role(_tenant, 'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  INSERT INTO public.impersonation_sessions (admin_user_id, target_user_id, tenant_id, reason)
  VALUES (auth.uid(), _target_user, _tenant, _reason) RETURNING id INTO _id;
  RETURN _id;
END; $$;

-- SEEDS
INSERT INTO public.help_categories (slug, name, description, icon, position) VALUES
  ('getting-started', 'Comece aqui', 'Primeiros passos no Oxy', 'Rocket', 1),
  ('tasks', 'Tarefas e projetos', 'Gestão de trabalho diário', 'CheckSquare', 2),
  ('social', 'Mídias sociais', 'Calendário, posts e métricas', 'Share2', 3),
  ('ai', 'IA e Copiloto', 'Recursos de IA', 'Sparkles', 4),
  ('admin', 'Administração', 'Workspace, equipe e billing', 'Settings', 5),
  ('integrations', 'Integrações', 'Conectores e API', 'Plug', 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.help_articles (category_id, slug, title, body_md, tags) VALUES
  ((SELECT id FROM public.help_categories WHERE slug='getting-started'), 'criar-primeiro-projeto', 'Criando seu primeiro projeto', E'# Como criar um projeto\n\n1. Vá em **Projetos**\n2. Clique em **Novo projeto**\n3. Escolha squad e nome\n4. Adicione tarefas.', ARRAY['onboarding','projeto']),
  ((SELECT id FROM public.help_categories WHERE slug='tasks'), 'quick-add-nlp', 'Quick Add com linguagem natural', E'# Adicione tarefas rapidamente\n\nDigite: "Reunião amanhã 15h" ou "Post LinkedIn sexta urgente". O Oxy entende datas, prioridades e canais.', ARRAY['quickadd','nlp']),
  ((SELECT id FROM public.help_categories WHERE slug='ai'), 'usar-copiloto', 'Como usar o Copiloto IA', E'# Copiloto IA\n\nPergunte: "O que fazer hoje?", "Como está meu ROAS?", "Simule +R$1000 no boost X".', ARRAY['ia','copiloto']),
  ((SELECT id FROM public.help_categories WHERE slug='social'), 'aprovacao-publica', 'Aprovação pública de posts', E'# Compartilhe para aprovação\n\nNa aba Social, clique **Gerar link de aprovação**. Cliente aprova sem conta.', ARRAY['social']),
  ((SELECT id FROM public.help_categories WHERE slug='admin'), 'convidar-membros', 'Convidando membros do time', E'# Convites\n\nVá em **Workspaces → Convidar**. Defina papel. Convite expira em 14 dias.', ARRAY['admin','convite']),
  ((SELECT id FROM public.help_categories WHERE slug='integrations'), 'api-publica', 'Usando a API pública', E'# API REST\n\nGere token em **Developer Hub → API**. Use header `X-API-Key`. Endpoint base `/api/v1/`.', ARRAY['api','sdk'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.changelog_entries (version, title, body_md, kind, released_at) VALUES
  ('1.0.0', 'Lançamento Oxy Growth OS', 'Suite completa: tarefas, social, IA, relatórios, automações.', 'feature', now()),
  ('0.9.0', 'IA Proativa + Camada comercial', 'Sugestões automáticas, briefings, planos públicos.', 'feature', now() - interval '7 days'),
  ('0.8.0', 'Marketplace + SDK', 'Templates do marketplace e SDK TypeScript.', 'feature', now() - interval '14 days')
ON CONFLICT DO NOTHING;

INSERT INTO public.system_status (service, status, message) VALUES
  ('API REST', 'operational', 'Operando normalmente'),
  ('Webhooks', 'operational', 'Operando normalmente'),
  ('IA Gateway', 'operational', 'Operando normalmente'),
  ('Database', 'operational', 'Operando normalmente'),
  ('Storage', 'operational', 'Operando normalmente')
ON CONFLICT DO NOTHING;

INSERT INTO public.achievements (code, name, description, icon, xp_reward, category, rarity, threshold_kind, threshold_value) VALUES
  ('first_task','Primeira tarefa','Concluiu sua primeira tarefa','CheckCircle',10,'tasks','common','tasks_done',1),
  ('ten_tasks','Maratonista','Concluiu 10 tarefas','Trophy',50,'tasks','common','tasks_done',10),
  ('fifty_tasks','Centurião','Concluiu 50 tarefas','Award',150,'tasks','rare','tasks_done',50),
  ('hundred_tasks','Lenda','Concluiu 100 tarefas','Crown',500,'tasks','epic','tasks_done',100),
  ('streak_3','Aquecendo','3 dias seguidos ativo','Flame',30,'streak','common','streak_days',3),
  ('streak_7','Em chamas','7 dias seguidos ativo','Flame',100,'streak','rare','streak_days',7),
  ('streak_30','Imparável','30 dias seguidos ativo','Zap',500,'streak','epic','streak_days',30),
  ('level_5','Nível 5','Atingiu nível 5','Star',0,'level','common','level',5),
  ('level_10','Nível 10','Atingiu nível 10','Star',0,'level','rare','level',10),
  ('level_25','Nível 25','Atingiu nível 25','Star',0,'level','epic','level',25),
  ('xp_1000','Mil XP','Acumulou 1000 XP','Sparkles',0,'xp','common','xp_total',1000),
  ('xp_10000','10K XP','Acumulou 10.000 XP','Sparkles',0,'xp','legendary','xp_total',10000)
ON CONFLICT (code) DO NOTHING;

GRANT EXECUTE ON FUNCTION public.award_xp(uuid,text,int,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_achievements(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.squad_leaderboard(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_impersonation(uuid,uuid,text) TO authenticated;
