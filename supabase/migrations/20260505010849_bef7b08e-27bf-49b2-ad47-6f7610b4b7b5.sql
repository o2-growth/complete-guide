CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  number int NOT NULL,
  title text NOT NULL,
  description text,
  requester_user_id uuid REFERENCES public.profiles(id),
  requester_email text,
  requester_name text,
  owner_user_id uuid REFERENCES public.profiles(id),
  squad_id uuid REFERENCES public.squads(id),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting','resolved','closed')),
  channel text DEFAULT 'internal' CHECK (channel IN ('internal','email','form','chat')),
  sla_response_minutes int,
  sla_resolution_minutes int,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, number)
);

CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES public.profiles(id),
  body text NOT NULL,
  internal boolean NOT NULL DEFAULT false,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.profiles(id),
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_tenant         ON public.tickets (tenant_id);
CREATE INDEX idx_tickets_owner          ON public.tickets (owner_user_id);
CREATE INDEX idx_tickets_status         ON public.tickets (status);
CREATE INDEX idx_tickets_squad          ON public.tickets (squad_id);
CREATE INDEX idx_tickets_priority       ON public.tickets (priority);
CREATE INDEX idx_tickets_created_at     ON public.tickets (created_at DESC);
CREATE INDEX idx_tickets_tenant_status  ON public.tickets (tenant_id, status);
CREATE INDEX idx_ticket_messages_ticket ON public.ticket_messages (ticket_id, created_at);
CREATE INDEX idx_ticket_events_ticket   ON public.ticket_events   (ticket_id, created_at);

CREATE TRIGGER tg_set_updated_at_tickets
BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_set_ticket_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.number IS NULL OR NEW.number = 0 THEN
    SELECT COALESCE(MAX(number), 0) + 1 INTO NEW.number
    FROM public.tickets WHERE tenant_id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER tg_tickets_set_number BEFORE INSERT ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.tg_set_ticket_number();

CREATE OR REPLACE FUNCTION public.tg_audit_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ticket_events (ticket_id, actor_user_id, kind, payload)
    VALUES (NEW.id, v_actor, 'created',
      jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'status', NEW.status));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.ticket_events (ticket_id, actor_user_id, kind, payload)
      VALUES (NEW.id, v_actor, 'status_changed', jsonb_build_object('from', OLD.status, 'to', NEW.status));
    END IF;
    IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
      INSERT INTO public.ticket_events (ticket_id, actor_user_id, kind, payload)
      VALUES (NEW.id, v_actor, 'assigned', jsonb_build_object('from', OLD.owner_user_id, 'to', NEW.owner_user_id));
    END IF;
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      INSERT INTO public.ticket_events (ticket_id, actor_user_id, kind, payload)
      VALUES (NEW.id, v_actor, 'priority_changed', jsonb_build_object('from', OLD.priority, 'to', NEW.priority));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER tg_tickets_audit AFTER INSERT OR UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_ticket();

CREATE OR REPLACE FUNCTION public.tg_audit_ticket_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.ticket_events (ticket_id, actor_user_id, kind, payload)
  VALUES (NEW.ticket_id, NEW.author_user_id, 'commented',
    jsonb_build_object('message_id', NEW.id, 'internal', NEW.internal));
  UPDATE public.tickets
     SET first_response_at = COALESCE(first_response_at, now())
   WHERE id = NEW.ticket_id AND NEW.internal = false
     AND requester_user_id IS DISTINCT FROM NEW.author_user_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER tg_ticket_messages_audit AFTER INSERT ON public.ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_ticket_message();

ALTER TABLE public.tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_events   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_select" ON public.tickets FOR SELECT USING (
  tenant_id IN (SELECT public.user_tenant_ids()) AND (
    public.user_role_in_tenant(tenant_id) IN ('admin','manager')
    OR owner_user_id = (select auth.uid())
    OR requester_user_id = (select auth.uid())
    OR created_by = (select auth.uid())
  )
);

CREATE POLICY "tickets_insert" ON public.tickets FOR INSERT
WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "tickets_update" ON public.tickets FOR UPDATE USING (
  tenant_id IN (SELECT public.user_tenant_ids()) AND (
    public.user_role_in_tenant(tenant_id) IN ('admin','manager')
    OR owner_user_id = (select auth.uid())
  )
);

CREATE POLICY "tickets_delete" ON public.tickets FOR DELETE USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager')
);

CREATE POLICY "ticket_messages_select" ON public.ticket_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_messages.ticket_id
      AND t.tenant_id IN (SELECT public.user_tenant_ids())
      AND (
        public.user_role_in_tenant(t.tenant_id) IN ('admin','manager')
        OR t.owner_user_id = (select auth.uid())
        OR t.requester_user_id = (select auth.uid())
        OR t.created_by = (select auth.uid())
      )
  ) AND (
    ticket_messages.internal = false
    OR public.user_role_in_tenant(
      (SELECT t.tenant_id FROM public.tickets t WHERE t.id = ticket_messages.ticket_id)
    ) IN ('admin','manager','specialist')
  )
);

CREATE POLICY "ticket_messages_insert" ON public.ticket_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_messages.ticket_id
      AND t.tenant_id IN (SELECT public.user_tenant_ids())
      AND (
        public.user_role_in_tenant(t.tenant_id) IN ('admin','manager','specialist')
        OR t.requester_user_id = (select auth.uid())
        OR t.created_by = (select auth.uid())
      )
  )
);

CREATE POLICY "ticket_events_select" ON public.ticket_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_events.ticket_id
      AND t.tenant_id IN (SELECT public.user_tenant_ids())
      AND (
        public.user_role_in_tenant(t.tenant_id) IN ('admin','manager')
        OR t.owner_user_id = (select auth.uid())
        OR t.requester_user_id = (select auth.uid())
        OR t.created_by = (select auth.uid())
      )
  )
);

CREATE OR REPLACE FUNCTION public.assign_ticket_owner(_ticket_id uuid, _user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tenant uuid; v_role text;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.tickets WHERE id = _ticket_id;
  IF v_tenant IS NULL THEN RAISE EXCEPTION 'Ticket não encontrado'; END IF;
  v_role := public.user_role_in_tenant(v_tenant);
  IF v_role NOT IN ('admin','manager') THEN RAISE EXCEPTION 'Sem permissão pra atribuir ticket'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members WHERE tenant_id = v_tenant AND user_id = _user_id
  ) THEN RAISE EXCEPTION 'Usuário não pertence ao tenant'; END IF;
  UPDATE public.tickets SET owner_user_id = _user_id, updated_at = now() WHERE id = _ticket_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.assign_ticket_owner(uuid, uuid) TO authenticated;