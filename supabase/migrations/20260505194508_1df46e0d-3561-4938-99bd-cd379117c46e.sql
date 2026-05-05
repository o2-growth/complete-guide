-- Sub-fase 7B: Custom Fields
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('global','task_type','project')),
  task_type_id uuid REFERENCES public.task_types(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN (
    'text','textarea','number','date','datetime','select','multi_select','checkbox',
    'url','email','phone','currency','rating','user','tag','file','formula'
  )),
  options jsonb DEFAULT '[]'::jsonb,
  required boolean NOT NULL DEFAULT false,
  default_value jsonb,
  position int NOT NULL DEFAULT 0,
  help_text text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cfd_tenant_scope_key ON public.custom_field_definitions
  (tenant_id, scope,
   COALESCE(task_type_id, '00000000-0000-0000-0000-000000000000'::uuid),
   COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
   key);
CREATE INDEX IF NOT EXISTS idx_cfd_tenant ON public.custom_field_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cfd_task_type ON public.custom_field_definitions(task_type_id) WHERE task_type_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cfd_project ON public.custom_field_definitions(project_id) WHERE project_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.task_custom_field_values (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  field_definition_id uuid NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  value jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, field_definition_id)
);
CREATE INDEX IF NOT EXISTS idx_tcfv_task ON public.task_custom_field_values(task_id);
CREATE INDEX IF NOT EXISTS idx_tcfv_definition ON public.task_custom_field_values(field_definition_id);

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_custom_field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cfd_select ON public.custom_field_definitions;
CREATE POLICY cfd_select ON public.custom_field_definitions FOR SELECT USING (tenant_id IN (SELECT public.user_tenant_ids()));
DROP POLICY IF EXISTS cfd_insert ON public.custom_field_definitions;
CREATE POLICY cfd_insert ON public.custom_field_definitions FOR INSERT WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_role_in_tenant(tenant_id) IN ('admin','manager'));
DROP POLICY IF EXISTS cfd_update ON public.custom_field_definitions;
CREATE POLICY cfd_update ON public.custom_field_definitions FOR UPDATE USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_role_in_tenant(tenant_id) IN ('admin','manager'));
DROP POLICY IF EXISTS cfd_delete ON public.custom_field_definitions;
CREATE POLICY cfd_delete ON public.custom_field_definitions FOR DELETE USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_role_in_tenant(tenant_id) IN ('admin','manager'));

DROP POLICY IF EXISTS tcfv_all ON public.task_custom_field_values;
CREATE POLICY tcfv_all ON public.task_custom_field_values FOR ALL
USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_custom_field_values.task_id AND t.tenant_id IN (SELECT public.user_tenant_ids())))
WITH CHECK (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_custom_field_values.task_id AND t.tenant_id IN (SELECT public.user_tenant_ids())));

DROP TRIGGER IF EXISTS tg_cfd_updated ON public.custom_field_definitions;
CREATE TRIGGER tg_cfd_updated BEFORE UPDATE ON public.custom_field_definitions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS tg_tcfv_updated ON public.task_custom_field_values;
CREATE TRIGGER tg_tcfv_updated BEFORE UPDATE ON public.task_custom_field_values FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sub-fase 7C: Time Tracking
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS billable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2),
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_time_entries_billable ON public.time_entries(tenant_id, billable, started_at) WHERE billable = true;
CREATE INDEX IF NOT EXISTS idx_time_entries_user_started ON public.time_entries(user_id, started_at DESC);

CREATE OR REPLACE FUNCTION public.user_timesheet(_tenant uuid, _user uuid, _start timestamptz, _end timestamptz)
RETURNS TABLE (day date, total_minutes int, billable_minutes int, total_amount numeric, task_count bigint)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT date_trunc('day', started_at)::date AS day,
    COALESCE(SUM(minutes), 0)::int,
    COALESCE(SUM(CASE WHEN billable THEN minutes ELSE 0 END), 0)::int,
    COALESCE(SUM(CASE WHEN billable THEN minutes * COALESCE(hourly_rate, 0) / 60.0 ELSE 0 END), 0)::numeric,
    COUNT(DISTINCT task_id)
  FROM public.time_entries
  WHERE tenant_id = _tenant AND user_id = _user AND ended_at IS NOT NULL
    AND started_at >= _start AND started_at < _end
    AND _tenant IN (SELECT public.user_tenant_ids())
  GROUP BY 1 ORDER BY 1 DESC;
$$;
GRANT EXECUTE ON FUNCTION public.user_timesheet(uuid, uuid, timestamptz, timestamptz) TO authenticated;

-- Sub-fase 7D: Goals upgrade
ALTER TABLE public.key_results
  ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT 'numeric'
    CHECK (target_type IN ('numeric','monetary','tasks','boolean','percentage')),
  ADD COLUMN IF NOT EXISTS auto_update boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS linked_task_filter jsonb,
  ADD COLUMN IF NOT EXISTS unit text;

CREATE OR REPLACE FUNCTION public.refresh_kr_progress(_tenant uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE kr record; v_value numeric;
BEGIN
  IF NOT (_tenant IN (SELECT public.user_tenant_ids())) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  FOR kr IN SELECT k.* FROM public.key_results k JOIN public.goals g ON g.id = k.goal_id
    WHERE g.tenant_id = _tenant AND k.auto_update = true
  LOOP
    IF kr.target_type = 'tasks' THEN
      SELECT COUNT(*) INTO v_value FROM public.tasks t
      WHERE t.tenant_id = _tenant AND t.done_at IS NOT NULL
        AND (kr.linked_task_filter->>'project_id' IS NULL OR t.project_id::text = kr.linked_task_filter->>'project_id')
        AND (kr.linked_task_filter->>'tag_id' IS NULL OR EXISTS (
          SELECT 1 FROM public.task_tags tt WHERE tt.task_id = t.id AND tt.tag_id::text = kr.linked_task_filter->>'tag_id'));
      UPDATE public.key_results SET current_value = v_value, updated_at = now() WHERE id = kr.id;
    END IF;
  END LOOP;
END; $$;
GRANT EXECUTE ON FUNCTION public.refresh_kr_progress(uuid) TO authenticated;

-- Sub-fase 7E: Whiteboards
CREATE TABLE IF NOT EXISTS public.whiteboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  snapshot jsonb NOT NULL DEFAULT '{"elements": [], "appState": {}, "files": {}}'::jsonb,
  thumbnail_url text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_whiteboards_tenant ON public.whiteboards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whiteboards_project ON public.whiteboards(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whiteboards_task ON public.whiteboards(task_id) WHERE task_id IS NOT NULL;
DROP TRIGGER IF EXISTS tg_set_updated_at_whiteboards ON public.whiteboards;
CREATE TRIGGER tg_set_updated_at_whiteboards BEFORE UPDATE ON public.whiteboards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS whiteboards_select ON public.whiteboards;
CREATE POLICY whiteboards_select ON public.whiteboards FOR SELECT USING (tenant_id IN (SELECT public.user_tenant_ids()));
DROP POLICY IF EXISTS whiteboards_insert ON public.whiteboards;
CREATE POLICY whiteboards_insert ON public.whiteboards FOR INSERT WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist'));
DROP POLICY IF EXISTS whiteboards_update ON public.whiteboards;
CREATE POLICY whiteboards_update ON public.whiteboards FOR UPDATE USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist'));
DROP POLICY IF EXISTS whiteboards_delete ON public.whiteboards;
CREATE POLICY whiteboards_delete ON public.whiteboards FOR DELETE USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_role_in_tenant(tenant_id) IN ('admin','manager'));

-- Sub-fase 7F: Dashboards
CREATE TABLE IF NOT EXISTS public.dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX IF NOT EXISTS idx_dashboards_tenant ON public.dashboards(tenant_id);

CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id uuid NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN (
    'kpi','chart_bar','chart_line','chart_donut','task_list','calendar_mini',
    'timesheet_snippet','recent_activity','goals_progress','workload_heatmap','embed','markdown'
  )),
  title text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position int NOT NULL DEFAULT 0,
  width int NOT NULL DEFAULT 1 CHECK (width BETWEEN 1 AND 4),
  height int NOT NULL DEFAULT 1 CHECK (height BETWEEN 1 AND 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard ON public.dashboard_widgets(dashboard_id);

ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dashboards_select ON public.dashboards;
CREATE POLICY dashboards_select ON public.dashboards FOR SELECT USING (tenant_id IN (SELECT public.user_tenant_ids()));
DROP POLICY IF EXISTS dashboards_all ON public.dashboards;
CREATE POLICY dashboards_all ON public.dashboards FOR ALL
USING (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist'))
WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()) AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist'));
DROP POLICY IF EXISTS dw_all ON public.dashboard_widgets;
CREATE POLICY dw_all ON public.dashboard_widgets FOR ALL
USING (EXISTS (SELECT 1 FROM public.dashboards d WHERE d.id = dashboard_widgets.dashboard_id AND d.tenant_id IN (SELECT public.user_tenant_ids())))
WITH CHECK (EXISTS (SELECT 1 FROM public.dashboards d WHERE d.id = dashboard_widgets.dashboard_id AND d.tenant_id IN (SELECT public.user_tenant_ids())));
DROP TRIGGER IF EXISTS tg_dashboards_updated ON public.dashboards;
CREATE TRIGGER tg_dashboards_updated BEFORE UPDATE ON public.dashboards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS tg_dw_updated ON public.dashboard_widgets;
CREATE TRIGGER tg_dw_updated BEFORE UPDATE ON public.dashboard_widgets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sub-fase 7I: Automations upgrade (coluna boolean é "active", não "is_active")
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'Zap',
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#0EA5E9',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_category text;
CREATE INDEX IF NOT EXISTS idx_automation_rules_active_no_template
  ON public.automation_rules(tenant_id, trigger_event)
  WHERE active = true AND is_template = false;