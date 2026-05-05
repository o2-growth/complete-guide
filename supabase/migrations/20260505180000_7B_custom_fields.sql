-- Sub-fase 7B: Custom Fields em tasks (17 tipos, scope global/task_type/project)

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
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, scope, COALESCE(task_type_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid), key)
);

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
CREATE POLICY cfd_select ON public.custom_field_definitions FOR SELECT
USING (tenant_id IN (SELECT public.user_tenant_ids()));

DROP POLICY IF EXISTS cfd_insert ON public.custom_field_definitions;
CREATE POLICY cfd_insert ON public.custom_field_definitions FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager')
);

DROP POLICY IF EXISTS cfd_update ON public.custom_field_definitions;
CREATE POLICY cfd_update ON public.custom_field_definitions FOR UPDATE
USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager')
);

DROP POLICY IF EXISTS cfd_delete ON public.custom_field_definitions;
CREATE POLICY cfd_delete ON public.custom_field_definitions FOR DELETE
USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager')
);

DROP POLICY IF EXISTS tcfv_all ON public.task_custom_field_values;
CREATE POLICY tcfv_all ON public.task_custom_field_values FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.tasks t
    WHERE t.id = task_custom_field_values.task_id
      AND t.tenant_id IN (SELECT public.user_tenant_ids()))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.tasks t
    WHERE t.id = task_custom_field_values.task_id
      AND t.tenant_id IN (SELECT public.user_tenant_ids()))
);

DROP TRIGGER IF EXISTS tg_cfd_updated ON public.custom_field_definitions;
CREATE TRIGGER tg_cfd_updated BEFORE UPDATE ON public.custom_field_definitions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tg_tcfv_updated ON public.task_custom_field_values;
CREATE TRIGGER tg_tcfv_updated BEFORE UPDATE ON public.task_custom_field_values
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
