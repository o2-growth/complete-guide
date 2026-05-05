CREATE TABLE public.personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  age_range text,
  occupation text,
  pain_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  channels text[] NOT NULL DEFAULT '{}',
  bio text,
  avatar_url text,
  color text NOT NULL DEFAULT '#0EA5E9',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX idx_personas_tenant ON public.personas(tenant_id);

CREATE TABLE public.audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  persona_ids uuid[] NOT NULL DEFAULT '{}',
  channels text[] NOT NULL DEFAULT '{}',
  size_estimate int,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX idx_audiences_tenant ON public.audiences(tenant_id);
CREATE INDEX idx_audiences_persona_ids ON public.audiences USING gin (persona_ids);

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS persona_id uuid REFERENCES public.personas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS audience_id uuid REFERENCES public.audiences(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_persona_id ON public.tasks(persona_id) WHERE persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_audience_id ON public.tasks(audience_id) WHERE audience_id IS NOT NULL;

CREATE TRIGGER tg_personas_updated_at
  BEFORE UPDATE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tg_audiences_updated_at
  BEFORE UPDATE ON public.audiences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personas_select_tenant" ON public.personas FOR SELECT
USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY "personas_insert_team" ON public.personas FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
);
CREATE POLICY "personas_update_team" ON public.personas FOR UPDATE
USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
);
CREATE POLICY "personas_delete_team" ON public.personas FOR DELETE
USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager')
);

CREATE POLICY "audiences_select_tenant" ON public.audiences FOR SELECT
USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY "audiences_insert_team" ON public.audiences FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
);
CREATE POLICY "audiences_update_team" ON public.audiences FOR UPDATE
USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
);
CREATE POLICY "audiences_delete_team" ON public.audiences FOR DELETE
USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager')
);