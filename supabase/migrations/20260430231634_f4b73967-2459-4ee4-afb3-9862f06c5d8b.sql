-- ============================================================
-- Passo 34: Copiloto IA + Benchmarks + Simulações What-if
-- ============================================================

-- 1. Conversas do copiloto (histórico persistente cross-módulo)
CREATE TABLE public.copilot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Nova conversa',
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members read copilot conv" ON public.copilot_conversations FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()) AND user_id = auth.uid());
CREATE POLICY "tenant members insert copilot conv" ON public.copilot_conversations FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()) AND user_id = auth.uid());
CREATE POLICY "tenant members update copilot conv" ON public.copilot_conversations FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()) AND user_id = auth.uid());
CREATE POLICY "tenant members delete copilot conv" ON public.copilot_conversations FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()) AND user_id = auth.uid());
CREATE TRIGGER trg_copilot_conv_updated BEFORE UPDATE ON public.copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_copilot_conv_tenant_user ON public.copilot_conversations(tenant_id, user_id, updated_at DESC);

CREATE TABLE public.copilot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('system','user','assistant','tool')),
  content text NOT NULL DEFAULT '',
  tool_calls jsonb,
  tool_name text,
  tool_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read copilot msgs" ON public.copilot_messages FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids())
    AND conversation_id IN (SELECT id FROM public.copilot_conversations WHERE user_id = auth.uid()));
CREATE POLICY "members insert copilot msgs" ON public.copilot_messages FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids())
    AND conversation_id IN (SELECT id FROM public.copilot_conversations WHERE user_id = auth.uid()));
CREATE INDEX idx_copilot_msgs_conv ON public.copilot_messages(conversation_id, created_at);

-- 2. Benchmarks setoriais (referências de mercado)
CREATE TABLE public.industry_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL,
  metric text NOT NULL,
  unit text NOT NULL DEFAULT 'pct',
  p25 numeric NOT NULL,
  p50 numeric NOT NULL,
  p75 numeric NOT NULL,
  source text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (industry, metric)
);
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone authed read benchmarks" ON public.industry_benchmarks FOR SELECT TO authenticated USING (true);

INSERT INTO public.industry_benchmarks (industry, metric, unit, p25, p50, p75, source) VALUES
  ('default','engagement_rate','pct',0.8,1.5,3.2,'Hootsuite/SocialInsider 2025'),
  ('default','reach_per_post','count',300,1200,4500,'Mix mercado'),
  ('default','ctr_link_in_bio','pct',1.2,2.8,5.5,'Linktree median'),
  ('default','roas','ratio',1.4,2.5,4.0,'Meta Ads benchmarks'),
  ('default','ontime_delivery','pct',62,78,91,'Asana State of Work'),
  ('default','task_cycle_days','days',6,3.2,1.5,'Atlassian 2024'),
  ('default','overdue_rate','pct',22,12,5,'Asana State of Work'),
  ('default','approval_cycle_hours','hours',48,18,6,'Mix mercado'),
  ('agencia_marketing','engagement_rate','pct',1.2,2.4,4.8,'SocialInsider Agências'),
  ('agencia_marketing','roas','ratio',1.8,3.0,5.0,'Meta Ads agências'),
  ('ecommerce','roas','ratio',2.0,3.5,6.0,'Shopify Plus'),
  ('ecommerce','engagement_rate','pct',0.6,1.2,2.5,'Hootsuite e-com'),
  ('saas_b2b','engagement_rate','pct',0.4,0.9,1.8,'LinkedIn B2B'),
  ('saas_b2b','task_cycle_days','days',5,2.5,1.2,'Atlassian SaaS')
ON CONFLICT (industry, metric) DO NOTHING;

-- Indústria por tenant (preference)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS industry text NOT NULL DEFAULT 'default';

-- 3. Cenários de simulação salvos
CREATE TABLE public.simulation_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  created_by uuid NOT NULL,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('boost_budget','team_capacity','cadence_change','custom')),
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  ai_narrative text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.simulation_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read sims" ON public.simulation_scenarios FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY "members insert sims" ON public.simulation_scenarios FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()) AND created_by = auth.uid());
CREATE POLICY "members update sims" ON public.simulation_scenarios FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY "members delete sims" ON public.simulation_scenarios FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()) AND has_tenant_role(tenant_id, 'admin'::tenant_role));
CREATE TRIGGER trg_sim_updated BEFORE UPDATE ON public.simulation_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Scorecards mensais arquivados
CREATE TABLE public.monthly_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  period_month date NOT NULL, -- primeiro dia do mês
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  benchmarks jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_summary text,
  recommendations jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, period_month)
);
ALTER TABLE public.monthly_scorecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read scorecards" ON public.monthly_scorecards FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY "members insert scorecards" ON public.monthly_scorecards FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY "members delete scorecards" ON public.monthly_scorecards FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()) AND has_tenant_role(tenant_id, 'admin'::tenant_role));

-- ============================================================
-- 5. RPC: contexto consolidado para o copiloto (tasks + posts + KRs + anomalias + KPIs)
-- ============================================================
CREATE OR REPLACE FUNCTION public.copilot_context(_tenant uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_open_tasks int; v_overdue int; v_done7 int; v_due7 int;
  v_anomalies_open int; v_krs_at_risk int;
  v_engagement7 numeric; v_roas numeric;
  v_industry text;
BEGIN
  IF _tenant NOT IN (SELECT user_tenant_ids()) THEN RAISE EXCEPTION 'access denied'; END IF;
  SELECT industry INTO v_industry FROM public.tenants WHERE id = _tenant;

  SELECT count(*) FILTER (WHERE done_at IS NULL),
         count(*) FILTER (WHERE done_at IS NULL AND due_at IS NOT NULL AND due_at < now()),
         count(*) FILTER (WHERE done_at >= now() - interval '7 days'),
         count(*) FILTER (WHERE done_at IS NULL AND due_at BETWEEN now() AND now() + interval '7 days')
    INTO v_open_tasks, v_overdue, v_done7, v_due7
  FROM public.tasks WHERE tenant_id = _tenant;

  SELECT count(*) INTO v_anomalies_open FROM public.metric_anomalies
   WHERE tenant_id = _tenant AND status = 'open';

  SELECT count(*) INTO v_krs_at_risk FROM public.goals
   WHERE tenant_id = _tenant AND status = 'at_risk';

  SELECT coalesce(sum(likes+comments+shares+saves),0) INTO v_engagement7
    FROM public.fact_posts_daily WHERE tenant_id = _tenant AND d >= current_date - 7;

  SELECT CASE WHEN sum(spent_cents) > 0 THEN round(sum(revenue_cents)::numeric / sum(spent_cents), 2) ELSE 0 END
    INTO v_roas FROM public.ad_boosts WHERE tenant_id = _tenant;

  RETURN jsonb_build_object(
    'industry', v_industry,
    'open_tasks', v_open_tasks,
    'overdue', v_overdue,
    'done_7d', v_done7,
    'due_next_7d', v_due7,
    'anomalies_open', v_anomalies_open,
    'krs_at_risk', v_krs_at_risk,
    'engagement_7d', v_engagement7,
    'roas', v_roas,
    'ts', now()
  );
END $$;

-- ============================================================
-- 6. RPC: comparar métricas tenant vs benchmark setorial
-- ============================================================
CREATE OR REPLACE FUNCTION public.benchmark_compare(_tenant uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_industry text;
  v_engagement_rate numeric := 0;
  v_reach_avg numeric := 0;
  v_overdue_rate numeric := 0;
  v_ontime numeric := 0;
  v_cycle numeric := 0;
  v_roas numeric := 0;
  v_total_posts int := 0;
  v_total_tasks int := 0;
  v_done_tasks int := 0;
  v_followers numeric := 1;
  v_results jsonb := '[]'::jsonb;
  rec record;
  v_tenant_val numeric;
  v_status text;
BEGIN
  IF _tenant NOT IN (SELECT user_tenant_ids()) THEN RAISE EXCEPTION 'access denied'; END IF;
  SELECT industry INTO v_industry FROM public.tenants WHERE id = _tenant;

  -- agregados últimos 30d
  SELECT coalesce(sum(reach),0), coalesce(sum(impressions),1),
         coalesce(sum(likes+comments+shares+saves),0),
         coalesce(sum(posts_published),0)
    INTO v_reach_avg, v_followers, v_engagement_rate, v_total_posts
  FROM public.fact_posts_daily WHERE tenant_id = _tenant AND d >= current_date - 30;

  -- engagement_rate em pct sobre impressões
  v_engagement_rate := CASE WHEN v_followers > 0 THEN round((v_engagement_rate / v_followers) * 100, 2) ELSE 0 END;
  v_reach_avg := CASE WHEN v_total_posts > 0 THEN round(v_reach_avg / v_total_posts) ELSE 0 END;

  SELECT count(*), count(*) FILTER (WHERE done_at IS NOT NULL),
         coalesce(avg(EXTRACT(EPOCH FROM (done_at - created_at))/86400) FILTER (WHERE done_at IS NOT NULL),0)
    INTO v_total_tasks, v_done_tasks, v_cycle
  FROM public.tasks WHERE tenant_id = _tenant AND created_at >= current_date - 30;

  v_overdue_rate := CASE WHEN v_total_tasks > 0
    THEN round((SELECT count(*) FROM public.tasks WHERE tenant_id = _tenant AND done_at IS NULL AND due_at < now())::numeric / v_total_tasks * 100, 1)
    ELSE 0 END;
  v_ontime := CASE WHEN v_done_tasks > 0
    THEN round((SELECT count(*) FROM public.tasks WHERE tenant_id = _tenant AND done_at IS NOT NULL AND (due_at IS NULL OR done_at <= due_at))::numeric / v_done_tasks * 100, 1)
    ELSE 0 END;
  v_cycle := round(v_cycle, 1);

  SELECT CASE WHEN sum(spent_cents) > 0 THEN round(sum(revenue_cents)::numeric / sum(spent_cents), 2) ELSE 0 END
    INTO v_roas FROM public.ad_boosts WHERE tenant_id = _tenant;

  -- monta comparação: tenta industry, fallback default
  FOR rec IN
    SELECT b.* FROM public.industry_benchmarks b
     WHERE b.industry = COALESCE(v_industry,'default') OR b.industry = 'default'
     ORDER BY (b.industry = COALESCE(v_industry,'default')) DESC
  LOOP
    v_tenant_val := CASE rec.metric
      WHEN 'engagement_rate' THEN v_engagement_rate
      WHEN 'reach_per_post' THEN v_reach_avg
      WHEN 'roas' THEN v_roas
      WHEN 'ontime_delivery' THEN v_ontime
      WHEN 'overdue_rate' THEN v_overdue_rate
      WHEN 'task_cycle_days' THEN v_cycle
      ELSE NULL END;
    IF v_tenant_val IS NULL THEN CONTINUE; END IF;

    -- métricas "menor é melhor": overdue_rate, task_cycle_days
    IF rec.metric IN ('overdue_rate','task_cycle_days') THEN
      v_status := CASE WHEN v_tenant_val <= rec.p75 THEN 'top' WHEN v_tenant_val <= rec.p50 THEN 'good' WHEN v_tenant_val <= rec.p25 THEN 'avg' ELSE 'low' END;
    ELSE
      v_status := CASE WHEN v_tenant_val >= rec.p75 THEN 'top' WHEN v_tenant_val >= rec.p50 THEN 'good' WHEN v_tenant_val >= rec.p25 THEN 'avg' ELSE 'low' END;
    END IF;

    v_results := v_results || jsonb_build_object(
      'metric', rec.metric, 'unit', rec.unit, 'tenant', v_tenant_val,
      'p25', rec.p25, 'p50', rec.p50, 'p75', rec.p75,
      'status', v_status, 'industry', rec.industry, 'source', rec.source
    );
  END LOOP;

  RETURN jsonb_build_object('industry', v_industry, 'comparisons', v_results, 'computed_at', now());
END $$;

-- ============================================================
-- 7. RPC: simulação what-if
--   kind: boost_budget {budget_multiplier, current_roas?}
--         team_capacity {extra_people, hours_per_week}
--         cadence_change {posts_per_week_delta}
-- ============================================================
CREATE OR REPLACE FUNCTION public.run_simulation(_tenant uuid, _kind text, _inputs jsonb)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_result jsonb := '{}'::jsonb;
  v_curr_spent numeric := 0; v_curr_rev numeric := 0; v_curr_roas numeric := 0;
  v_mult numeric; v_new_spent numeric; v_new_rev numeric; v_new_roas numeric;
  v_extra int; v_hours int; v_capacity_now int := 0; v_avg_min int := 60; v_extra_tasks int;
  v_delta int; v_curr_eng numeric := 0; v_avg_per_post numeric := 0; v_new_eng numeric;
BEGIN
  IF _tenant NOT IN (SELECT user_tenant_ids()) THEN RAISE EXCEPTION 'access denied'; END IF;

  IF _kind = 'boost_budget' THEN
    SELECT coalesce(sum(spent_cents),0), coalesce(sum(revenue_cents),0)
      INTO v_curr_spent, v_curr_rev FROM public.ad_boosts WHERE tenant_id = _tenant;
    v_curr_roas := CASE WHEN v_curr_spent > 0 THEN v_curr_rev / v_curr_spent ELSE 0 END;
    v_mult := COALESCE((_inputs->>'budget_multiplier')::numeric, 2);
    v_new_spent := v_curr_spent * v_mult;
    -- assume retorno marginal decrescente: ROAS efetivo cai 8% a cada dobra
    v_new_roas := v_curr_roas * power(0.92, log(2, GREATEST(v_mult,1)));
    v_new_rev := v_new_spent * v_new_roas;
    v_result := jsonb_build_object(
      'kind','boost_budget',
      'current', jsonb_build_object('spent_cents', v_curr_spent, 'revenue_cents', v_curr_rev, 'roas', round(v_curr_roas,2)),
      'projected', jsonb_build_object('spent_cents', round(v_new_spent), 'revenue_cents', round(v_new_rev), 'roas', round(v_new_roas,2)),
      'delta_revenue_cents', round(v_new_rev - v_curr_rev),
      'assumptions', 'Retorno marginal decrescente: ROAS efetivo cai 8% a cada dobra de budget'
    );

  ELSIF _kind = 'team_capacity' THEN
    v_extra := COALESCE((_inputs->>'extra_people')::int, 1);
    v_hours := COALESCE((_inputs->>'hours_per_week')::int, 30);
    SELECT coalesce(avg(estimate_minutes) FILTER (WHERE estimate_minutes > 0), 60)
      INTO v_avg_min FROM public.tasks WHERE tenant_id = _tenant AND created_at >= current_date - 30;
    v_extra_tasks := floor((v_extra * v_hours * 60.0) / GREATEST(v_avg_min,1));
    v_result := jsonb_build_object(
      'kind','team_capacity',
      'extra_people', v_extra,
      'hours_per_week', v_hours,
      'avg_task_minutes', v_avg_min,
      'extra_tasks_per_week', v_extra_tasks,
      'extra_tasks_per_month', v_extra_tasks * 4,
      'assumptions', 'Estima tarefas adicionais usando estimate_minutes médio dos últimos 30d'
    );

  ELSIF _kind = 'cadence_change' THEN
    v_delta := COALESCE((_inputs->>'posts_per_week_delta')::int, 3);
    SELECT coalesce(avg(likes+comments+shares+saves),0), coalesce(sum(likes+comments+shares+saves),0)
      INTO v_avg_per_post, v_curr_eng FROM public.fact_posts_daily WHERE tenant_id = _tenant AND d >= current_date - 30;
    v_new_eng := v_curr_eng + (v_delta * 4 * v_avg_per_post * 0.85); -- 4 semanas, eficiência 85%
    v_result := jsonb_build_object(
      'kind','cadence_change',
      'posts_per_week_delta', v_delta,
      'avg_engagement_per_post', round(v_avg_per_post),
      'current_engagement_30d', v_curr_eng,
      'projected_engagement_30d', round(v_new_eng),
      'delta', round(v_new_eng - v_curr_eng),
      'assumptions', 'Eficiência marginal 85% (saturação de audiência)'
    );

  ELSE
    v_result := jsonb_build_object('error', 'unknown kind: ' || _kind);
  END IF;

  RETURN v_result;
END $$;