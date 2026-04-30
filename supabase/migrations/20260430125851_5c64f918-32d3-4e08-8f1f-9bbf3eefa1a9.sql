
-- Token de aprovação na submission
ALTER TABLE public.demand_submissions
  ADD COLUMN IF NOT EXISTS approval_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS uniq_demand_sub_approval_token
  ON public.demand_submissions(approval_token);

-- Função pública para buscar submission por token (sem JWT)
CREATE OR REPLACE FUNCTION public.get_demand_submission_by_token(_token uuid)
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  form_id uuid,
  status text,
  payload jsonb,
  requester_name text,
  requester_email text,
  created_at timestamptz,
  task_id uuid,
  form_title text,
  form_description text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    s.id, s.tenant_id, s.form_id, s.status, s.payload,
    s.requester_name, s.requester_email, s.created_at, s.task_id,
    f.title, f.description
  FROM public.demand_submissions s
  JOIN public.demand_forms f ON f.id = s.form_id
  WHERE s.approval_token = _token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_demand_submission_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_demand_submission_by_token(uuid) TO anon, authenticated;
