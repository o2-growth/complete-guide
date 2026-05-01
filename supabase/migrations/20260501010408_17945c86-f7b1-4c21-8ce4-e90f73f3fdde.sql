-- ============== AUTOMATIONS ENGINE ==============
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  run_count INT NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members read rules" ON public.automation_rules FOR SELECT
  USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY "tenant members write rules" ON public.automation_rules FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));
CREATE INDEX idx_rules_tenant_event ON public.automation_rules(tenant_id, trigger_event) WHERE active;
CREATE TRIGGER trg_rules_touch BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.automation_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'ok',
  error TEXT,
  actions_executed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members read runs" ON public.automation_runs FOR SELECT
  USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE INDEX idx_runs_rule_at ON public.automation_runs(rule_id, created_at DESC);

CREATE TABLE public.automation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members read events" ON public.automation_events FOR SELECT
  USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE INDEX idx_events_pending ON public.automation_events(processed_at, created_at) WHERE processed_at IS NULL;

CREATE OR REPLACE FUNCTION public.enqueue_automation_event(_tenant uuid, _event text, _payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.automation_events(tenant_id, event, payload)
  VALUES (_tenant, _event, COALESCE(_payload, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.tg_tasks_emit_automation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_payload jsonb;
BEGIN
  v_payload := jsonb_build_object(
    'task_id', NEW.id, 'project_id', NEW.project_id, 'title', NEW.title,
    'priority', NEW.priority, 'assignee_id', NEW.assignee_id, 'due_at', NEW.due_at,
    'type_id', NEW.type_id, 'status_id', NEW.status_id
  );
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_automation_event(NEW.tenant_id, 'task.created', v_payload);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status_id IS DISTINCT FROM OLD.status_id THEN
      PERFORM public.enqueue_automation_event(NEW.tenant_id, 'task.updated',
        v_payload || jsonb_build_object('old_status_id', OLD.status_id));
    END IF;
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
      PERFORM public.enqueue_automation_event(NEW.tenant_id, 'task.completed', v_payload);
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_tasks_automation
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_tasks_emit_automation();

-- ============== INVITATIONS ==============
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  email TEXT NOT NULL,
  role public.tenant_role NOT NULL DEFAULT 'specialist',
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  invited_by UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage invitations" ON public.invitations FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin','manager'))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin','manager'));
CREATE POLICY "tenant members view invitations" ON public.invitations FOR SELECT
  USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE INDEX idx_invitations_email ON public.invitations(email) WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token uuid)
RETURNS TABLE(id uuid, tenant_id uuid, tenant_name text, email text, role public.tenant_role, expires_at timestamptz, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, i.tenant_id, t.name, i.email, i.role, i.expires_at, i.status
  FROM public.invitations i JOIN public.tenants t ON t.id = i.tenant_id
  WHERE i.token = _token LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.accept_invitation(_token uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inv public.invitations; v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_inv FROM public.invitations WHERE token = _token;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'invitation not found'; END IF;
  IF v_inv.status <> 'pending' THEN RAISE EXCEPTION 'invitation is %', v_inv.status; END IF;
  IF v_inv.expires_at < now() THEN
    UPDATE public.invitations SET status = 'expired' WHERE id = v_inv.id;
    RAISE EXCEPTION 'invitation expired';
  END IF;
  INSERT INTO public.tenant_members(tenant_id, user_id, role)
  VALUES (v_inv.tenant_id, v_user, v_inv.role)
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;
  UPDATE public.invitations
    SET status = 'accepted', accepted_at = now(), accepted_by = v_user
    WHERE id = v_inv.id;
  RETURN v_inv.tenant_id;
END $$;

-- ============== BILLING ==============
CREATE TABLE public.billing_plans (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  max_members INT,
  max_projects INT,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  position INT NOT NULL DEFAULT 0
);
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads plans" ON public.billing_plans FOR SELECT USING (true);

INSERT INTO public.billing_plans(id, name, price_monthly, max_members, max_projects, features, position) VALUES
  ('free','Free',0,5,10,
    '{"automations":3,"webhooks":1,"ai_credits":50,"exports":false,"priority_support":false}'::jsonb,1),
  ('pro','Pro',49,25,50,
    '{"automations":50,"webhooks":10,"ai_credits":1000,"exports":true,"priority_support":false}'::jsonb,2),
  ('business','Business',199,200,500,
    '{"automations":-1,"webhooks":-1,"ai_credits":10000,"exports":true,"priority_support":true,"sso":true}'::jsonb,3);

CREATE TABLE public.tenant_billing (
  tenant_id UUID NOT NULL PRIMARY KEY,
  plan_id TEXT NOT NULL DEFAULT 'free' REFERENCES public.billing_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  external_customer_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_billing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members read billing" ON public.tenant_billing FOR SELECT
  USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY "admins update billing" ON public.tenant_billing FOR UPDATE
  USING (public.user_role_in_tenant(tenant_id) = 'admin')
  WITH CHECK (public.user_role_in_tenant(tenant_id) = 'admin');
CREATE POLICY "admins insert billing" ON public.tenant_billing FOR INSERT
  WITH CHECK (public.user_role_in_tenant(tenant_id) = 'admin');

INSERT INTO public.tenant_billing(tenant_id, plan_id)
  SELECT id, 'free' FROM public.tenants
  ON CONFLICT (tenant_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_workspace(_name text, _slug text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_tenant uuid; v_slug text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  v_slug := COALESCE(NULLIF(_slug,''), lower(regexp_replace(_name,'[^a-zA-Z0-9]+','-','g')) || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6));
  INSERT INTO public.tenants(name, slug, created_by) VALUES (_name, v_slug, v_user) RETURNING id INTO v_tenant;
  INSERT INTO public.tenant_members(tenant_id, user_id, role) VALUES (v_tenant, v_user, 'admin');
  INSERT INTO public.tenant_billing(tenant_id, plan_id) VALUES (v_tenant, 'free');
  RETURN v_tenant;
END $$;

-- ============== RICH COMMENTS ==============
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE public.comment_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, emoji)
);
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members read reactions" ON public.comment_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.comments c
    JOIN public.tasks t ON t.id = c.task_id
    WHERE c.id = comment_reactions.comment_id
      AND t.tenant_id IN (SELECT user_tenant_ids())
  ));
CREATE POLICY "users insert own reactions" ON public.comment_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own reactions" ON public.comment_reactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.toggle_comment_reaction(_comment_id uuid, _emoji text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_existing uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO v_existing FROM public.comment_reactions
    WHERE comment_id = _comment_id AND user_id = v_user AND emoji = _emoji;
  IF v_existing IS NOT NULL THEN
    DELETE FROM public.comment_reactions WHERE id = v_existing;
    RETURN false;
  END IF;
  INSERT INTO public.comment_reactions(comment_id, user_id, emoji) VALUES (_comment_id, v_user, _emoji);
  RETURN true;
END $$;