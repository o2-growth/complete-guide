
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  latency_ms INTEGER,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  prompt_summary TEXT,
  response_summary TEXT,
  status TEXT DEFAULT 'success',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_created ON public.ai_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_tenant_created ON public.ai_interactions(tenant_id, created_at DESC);

ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own ai interactions"
  ON public.ai_interactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_tenant_role(tenant_id, 'admin'::public.tenant_role));

CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.ai_interactions
   WHERE user_id = _user_id
     AND created_at > now() - interval '1 hour';
$$;
