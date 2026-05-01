-- ============ INTEGRAÇÕES EXTERNAS ============
CREATE TABLE IF NOT EXISTS public.external_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google_drive','google_calendar','slack_2way','notion','zapier','make','github','jira','linear','trello_advanced')),
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','disconnected','error','pending')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  webhook_url text,
  sync_schedule text DEFAULT 'manual' CHECK (sync_schedule IN ('manual','15min','hourly','daily')),
  last_sync_at timestamptz,
  last_error text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, provider, display_name)
);
CREATE INDEX IF NOT EXISTS idx_ext_integ_tenant ON public.external_integrations(tenant_id);
ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ext_integ_read" ON public.external_integrations
  FOR SELECT TO authenticated USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY "ext_integ_write" ON public.external_integrations
  FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id, 'admin') OR public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'admin') OR public.has_tenant_role(tenant_id, 'manager'));

CREATE TABLE IF NOT EXISTS public.external_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.external_integrations(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','ok','failed')),
  direction text DEFAULT 'in' CHECK (direction IN ('in','out','both')),
  items_processed integer DEFAULT 0,
  items_failed integer DEFAULT 0,
  error text,
  payload jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_sync_runs_tenant ON public.external_sync_runs(tenant_id, started_at DESC);
ALTER TABLE public.external_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_runs_read" ON public.external_sync_runs
  FOR SELECT TO authenticated USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY "sync_runs_insert" ON public.external_sync_runs
  FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

-- ============ IA PROATIVA ============
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('prioritize_today','redistribute_overload','next_post','optimize_boost','smart_reply','focus_block','followup_overdue','tag_task','tag_post')),
  title text NOT NULL,
  body text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','applied','dismissed','snoozed')),
  context_url text,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  acted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_ai_sugg_user ON public.ai_suggestions(user_id, status, created_at DESC);
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_sugg_own" ON public.ai_suggestions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  squad_id uuid REFERENCES public.squads(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('morning_briefing','squad_summary','weekly_recap')),
  period_date date NOT NULL,
  content text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, squad_id, kind, period_date)
);
CREATE INDEX IF NOT EXISTS idx_ai_sum_tenant_date ON public.ai_summaries(tenant_id, period_date DESC);
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_sum_read" ON public.ai_summaries
  FOR SELECT TO authenticated USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY "ai_sum_write" ON public.ai_summaries
  FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE TABLE IF NOT EXISTS public.voice_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_url text,
  transcript text,
  summary text,
  duration_sec integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.voice_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_own" ON public.voice_briefings
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ COMERCIAL ============
CREATE TABLE IF NOT EXISTS public.marketing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  company text,
  plan_interest text,
  source text DEFAULT 'landing',
  utm jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','lost')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.marketing_leads(email);
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_anon_insert" ON public.marketing_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "leads_auth_read" ON public.marketing_leads
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.pricing_plans_public (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_label text DEFAULT 'Começar agora',
  highlight boolean DEFAULT false,
  position integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_plans_public ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing_anon_read" ON public.pricing_plans_public
  FOR SELECT TO anon, authenticated USING (active = true);

CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_slug text NOT NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','cancelled','expired')),
  amount numeric(10,2),
  currency text DEFAULT 'BRL',
  stripe_session_id text,
  return_url text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkout_own" ON public.checkout_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR (tenant_id IS NOT NULL AND tenant_id IN (SELECT user_tenant_ids())))
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.subscription_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_slug text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  converted_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(tenant_id, plan_slug)
);
ALTER TABLE public.subscription_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trials_read" ON public.subscription_trials
  FOR SELECT TO authenticated USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY "trials_write" ON public.subscription_trials
  FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id, 'admin') OR public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'admin') OR public.has_tenant_role(tenant_id, 'manager'));

-- ============ RPCs ============
CREATE OR REPLACE FUNCTION public.generate_ai_suggestions(_tenant uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _count integer := 0;
  _overdue integer;
  _today integer;
BEGIN
  IF _tenant IS NULL OR _user IS NULL THEN
    RAISE EXCEPTION 'invalid input';
  END IF;
  IF _tenant NOT IN (SELECT user_tenant_ids()) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  UPDATE public.ai_suggestions
    SET status = 'dismissed'
    WHERE user_id = _user AND status = 'pending' AND created_at < now() - interval '24 hours';

  SELECT COUNT(*) INTO _today FROM public.tasks
    WHERE tenant_id = _tenant AND assignee_id = _user
      AND status NOT IN ('done','cancelled') AND due_at::date = current_date;

  IF _today > 5 THEN
    INSERT INTO public.ai_suggestions(tenant_id, user_id, kind, title, body, payload, context_url)
    VALUES (_tenant, _user, 'prioritize_today',
      'Você tem ' || _today || ' tarefas para hoje',
      'Considere mover algumas para amanhã ou delegar. Posso te ajudar a priorizar.',
      jsonb_build_object('count', _today),
      '/app/hoje');
    _count := _count + 1;
  END IF;

  SELECT COUNT(*) INTO _overdue FROM public.tasks
    WHERE tenant_id = _tenant AND assignee_id = _user
      AND status NOT IN ('done','cancelled') AND due_at < now() - interval '1 day';

  IF _overdue > 0 THEN
    INSERT INTO public.ai_suggestions(tenant_id, user_id, kind, title, body, payload, context_url)
    VALUES (_tenant, _user, 'followup_overdue',
      _overdue || ' tarefa(s) atrasada(s)',
      'Reagende ou conclua para limpar a lista.',
      jsonb_build_object('count', _overdue),
      '/app/atrasadas');
    _count := _count + 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tenant_id = _tenant AND assignee_id = _user
      AND status = 'in_progress' AND due_at::date <= current_date
  ) AND _today > 0 THEN
    INSERT INTO public.ai_suggestions(tenant_id, user_id, kind, title, body, payload, context_url)
    VALUES (_tenant, _user, 'focus_block',
      'Inicie um bloco de foco',
      'Use o Pomodoro pra destravar a primeira tarefa do dia.',
      '{}'::jsonb, '/app/foco');
    _count := _count + 1;
  END IF;

  RETURN _count;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_ai_suggestion(_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.ai_suggestions SET status = 'applied', acted_at = now()
    WHERE id = _id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.dismiss_ai_suggestion(_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.ai_suggestions SET status = 'dismissed', acted_at = now()
    WHERE id = _id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.start_trial(_tenant uuid, _plan_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _existing record;
  _new_id uuid;
BEGIN
  IF NOT (public.has_tenant_role(_tenant, 'admin') OR public.has_tenant_role(_tenant, 'manager')) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  SELECT * INTO _existing FROM public.subscription_trials WHERE tenant_id = _tenant AND plan_slug = _plan_slug;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'trial_already_used', 'ends_at', _existing.ends_at);
  END IF;
  INSERT INTO public.subscription_trials(tenant_id, plan_slug, ends_at, created_by)
    VALUES (_tenant, _plan_slug, now() + interval '14 days', auth.uid())
    RETURNING id INTO _new_id;
  RETURN jsonb_build_object('ok', true, 'id', _new_id, 'ends_at', now() + interval '14 days');
END;
$$;

CREATE OR REPLACE FUNCTION public.convert_lead(
  _email text, _name text DEFAULT NULL, _company text DEFAULT NULL,
  _plan text DEFAULT NULL, _source text DEFAULT 'landing', _utm jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.marketing_leads(email, name, company, plan_interest, source, utm)
    VALUES (lower(trim(_email)), _name, _company, _plan, _source, COALESCE(_utm, '{}'::jsonb))
    RETURNING id INTO _id;
  RETURN _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_lead(text,text,text,text,text,jsonb) TO anon, authenticated;

-- ============ SEED dos planos públicos ============
INSERT INTO public.pricing_plans_public(slug, name, tagline, price_monthly, price_yearly, features, cta_label, highlight, position)
VALUES
  ('free', 'Free', 'Para começar a organizar', 0, 0,
    '["Até 3 usuários","1 workspace","Tarefas, projetos e Kanban","Calendário editorial","Inbox social básica","Suporte da comunidade"]'::jsonb,
    'Começar grátis', false, 1),
  ('pro', 'Pro', 'Para times pequenos que querem crescer', 49, 470,
    '["Até 10 usuários","Workspaces ilimitados","IA Copilot + Gênio Growth","Agendamento social + Studio IA","Relatórios avançados + Forecast","Webhooks + API pública","Trial de 14 dias grátis","Suporte prioritário"]'::jsonb,
    'Começar trial de 14 dias', true, 2),
  ('business', 'Business', 'Para agências e operações maduras', 199, 1910,
    '["Usuários ilimitados","Tudo do Pro + SSO","Roles granulares + audit avançado","Aprovações multi-etapas","Marketplace de templates","Integrações nativas (Google, Slack, Notion, Jira, Linear)","SLA + suporte dedicado","Onboarding assistido"]'::jsonb,
    'Falar com vendas', false, 3)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, tagline = EXCLUDED.tagline,
  price_monthly = EXCLUDED.price_monthly, price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features, cta_label = EXCLUDED.cta_label,
  highlight = EXCLUDED.highlight, position = EXCLUDED.position;