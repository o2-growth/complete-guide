-- Approval workflows
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY aw_read ON public.approval_workflows FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY aw_manage ON public.approval_workflows FOR ALL TO authenticated
  USING (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role))
  WITH CHECK (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role));

CREATE TRIGGER trg_aw_updated BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Steps
DO $$ BEGIN
  CREATE TYPE public.approver_kind AS ENUM ('user','tenant_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  position INT NOT NULL,
  name TEXT NOT NULL,
  approver_kind public.approver_kind NOT NULL DEFAULT 'tenant_role',
  approver_user_id UUID,
  approver_role public.tenant_role,
  required_approvals INT NOT NULL DEFAULT 1 CHECK (required_approvals >= 1),
  allow_skip BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, position)
);

ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY as_read ON public.approval_steps FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY as_manage ON public.approval_steps FOR ALL TO authenticated
  USING (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role))
  WITH CHECK (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role));

CREATE TRIGGER trg_as_updated BEFORE UPDATE ON public.approval_steps
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Instances
DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('draft','in_progress','approved','rejected','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.approval_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id),
  task_id UUID,
  current_step_position INT NOT NULL DEFAULT 1,
  status public.approval_status NOT NULL DEFAULT 'in_progress',
  requested_by UUID NOT NULL,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_read ON public.approval_instances FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY ai_insert ON public.approval_instances FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()) AND requested_by = auth.uid());
CREATE POLICY ai_update_admin ON public.approval_instances FOR UPDATE TO authenticated
  USING (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role) OR requested_by = auth.uid());

CREATE TRIGGER trg_ai_updated BEFORE UPDATE ON public.approval_instances
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_ai_task ON public.approval_instances(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_tenant_status ON public.approval_instances(tenant_id, status);

-- Decisions
DO $$ BEGIN
  CREATE TYPE public.decision_kind AS ENUM ('approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.approval_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.approval_instances(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.approval_steps(id),
  tenant_id UUID NOT NULL,
  decided_by UUID NOT NULL,
  decision public.decision_kind NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instance_id, step_id, decided_by)
);

ALTER TABLE public.approval_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_read ON public.approval_decisions FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY ad_insert ON public.approval_decisions FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()) AND decided_by = auth.uid());

-- RPC: start an approval instance
CREATE OR REPLACE FUNCTION public.approval_start(
  _workflow_id UUID,
  _task_id UUID,
  _notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wf RECORD;
  new_id UUID;
BEGIN
  SELECT * INTO wf FROM public.approval_workflows WHERE id = _workflow_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Workflow não encontrado ou inativo'; END IF;

  -- Caller must belong to the workflow's tenant
  IF NOT (wf.tenant_id IN (SELECT user_tenant_ids())) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.approval_steps WHERE workflow_id = _workflow_id) THEN
    RAISE EXCEPTION 'Workflow não tem etapas';
  END IF;

  INSERT INTO public.approval_instances (tenant_id, workflow_id, task_id, requested_by, notes, current_step_position, status)
  VALUES (wf.tenant_id, _workflow_id, _task_id, auth.uid(), _notes, 1, 'in_progress')
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approval_start(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approval_start(UUID, UUID, TEXT) TO authenticated;

-- RPC: register a decision and advance the instance if quorum reached
CREATE OR REPLACE FUNCTION public.approval_decide(
  _instance_id UUID,
  _decision public.decision_kind,
  _comment TEXT DEFAULT NULL
) RETURNS public.approval_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inst RECORD;
  step RECORD;
  approvals INT;
  next_step RECORD;
  is_eligible BOOLEAN;
BEGIN
  SELECT * INTO inst FROM public.approval_instances WHERE id = _instance_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Instância não encontrada'; END IF;
  IF inst.status <> 'in_progress' THEN RAISE EXCEPTION 'Instância não está em andamento'; END IF;
  IF NOT (inst.tenant_id IN (SELECT user_tenant_ids())) THEN RAISE EXCEPTION 'Acesso negado'; END IF;

  SELECT * INTO step FROM public.approval_steps
    WHERE workflow_id = inst.workflow_id AND position = inst.current_step_position;
  IF NOT FOUND THEN RAISE EXCEPTION 'Etapa atual não encontrada'; END IF;

  -- Check eligibility
  IF step.approver_kind = 'user' THEN
    is_eligible := step.approver_user_id = auth.uid();
  ELSE
    is_eligible := has_tenant_role(inst.tenant_id, COALESCE(step.approver_role, 'admin'::tenant_role));
  END IF;
  IF NOT is_eligible THEN RAISE EXCEPTION 'Você não é aprovador desta etapa'; END IF;

  -- Record (one decision per user per step enforced by UNIQUE)
  INSERT INTO public.approval_decisions (instance_id, step_id, tenant_id, decided_by, decision, comment)
  VALUES (_instance_id, step.id, inst.tenant_id, auth.uid(), _decision, _comment);

  IF _decision = 'rejected' THEN
    UPDATE public.approval_instances
      SET status = 'rejected', completed_at = now()
      WHERE id = _instance_id;
    RETURN 'rejected';
  END IF;

  SELECT COUNT(*) INTO approvals FROM public.approval_decisions
    WHERE instance_id = _instance_id AND step_id = step.id AND decision = 'approved';

  IF approvals >= step.required_approvals THEN
    SELECT * INTO next_step FROM public.approval_steps
      WHERE workflow_id = inst.workflow_id AND position = inst.current_step_position + 1;
    IF NOT FOUND THEN
      UPDATE public.approval_instances
        SET status = 'approved', completed_at = now()
        WHERE id = _instance_id;
      RETURN 'approved';
    ELSE
      UPDATE public.approval_instances
        SET current_step_position = next_step.position
        WHERE id = _instance_id;
      RETURN 'in_progress';
    END IF;
  END IF;

  RETURN 'in_progress';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approval_decide(UUID, public.decision_kind, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approval_decide(UUID, public.decision_kind, TEXT) TO authenticated;