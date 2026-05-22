
-- ============================================================
-- LIMPAR TRIGGERS NAS TABELAS PRESERVADAS antes do drop
-- ============================================================
DROP TRIGGER IF EXISTS tg_seed_notif_prefs ON public.tenant_members;
DROP TRIGGER IF EXISTS tg_tenant_members_updated ON public.tenant_members;
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Drop policies em tabelas preservadas que referenciam funções que vão sumir
DO $$ DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies
           WHERE schemaname='public'
             AND tablename IN ('tenants','tenant_members','profiles','invitations',
                               'email_send_log','email_send_state','email_unsubscribe_tokens','suppressed_emails')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- 1) DROP de TODAS tabelas exceto auth/email infra
-- ============================================================
DO $$
DECLARE r record;
  keep text[] := ARRAY['tenants','tenant_members','profiles','invitations',
                       'email_send_log','email_send_state','email_unsubscribe_tokens','suppressed_emails'];
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> ALL(keep) LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
  END LOOP;
END $$;

-- Drop materialized views
DO $$ DECLARE r record;
BEGIN
  FOR r IN SELECT matviewname FROM pg_matviews WHERE schemaname='public' LOOP
    EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS public.%I CASCADE', r.matviewname);
  END LOOP;
END $$;

-- Drop todas funções públicas (recriaremos as essenciais depois)
DO $$ DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname as name, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
  LOOP
    BEGIN EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', r.name, r.args);
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
END $$;

-- Drop enums órfãos
DO $$ DECLARE r record;
BEGIN
  FOR r IN SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
           WHERE n.nspname='public' AND t.typtype='e' AND t.typname <> 'tenant_role'
  LOOP
    BEGIN EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', r.typname);
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
END $$;

-- ============================================================
-- 2) Helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $fn$
BEGIN NEW.updated_at = now(); RETURN NEW; END $fn$;

CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $fn$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid()
$fn$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $fn$
  SELECT EXISTS(SELECT 1 FROM public.tenant_members
                WHERE tenant_id=_tenant AND user_id=auth.uid())
$fn$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_tenant uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $fn$
  SELECT EXISTS(SELECT 1 FROM public.tenant_members
                WHERE tenant_id=_tenant AND user_id=auth.uid()
                  AND role IN ('admin'::tenant_role,'manager'::tenant_role))
$fn$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_tenant uuid, _role tenant_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $fn$
  SELECT EXISTS(SELECT 1 FROM public.tenant_members
                WHERE tenant_id=_tenant AND user_id=auth.uid() AND role=_role)
$fn$;

-- Recriar triggers updated_at preservados
CREATE TRIGGER tg_tenants_updated BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tg_tenant_members_updated BEFORE UPDATE ON public.tenant_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS básico nas preservadas
CREATE POLICY tenants_read ON public.tenants FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_tenant_ids()));
CREATE POLICY tenants_update ON public.tenants FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(id));

CREATE POLICY tm_read ON public.tenant_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY tm_self_insert ON public.tenant_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY tm_admin_manage ON public.tenant_members FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ============================================================
-- 3) Novo modelo de tarefas
-- ============================================================
CREATE TYPE public.task_priority AS ENUM ('none','low','medium','high','urgent');

CREATE TABLE public.spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text DEFAULT 'folder',
  color text DEFAULT '#63F161',
  is_private boolean NOT NULL DEFAULT false,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_spaces_tenant ON public.spaces(tenant_id) WHERE archived_at IS NULL;

CREATE TABLE public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  sort_order int NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_folders_space ON public.folders(space_id) WHERE archived_at IS NULL;

CREATE TABLE public.lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  icon text DEFAULT 'list-checks',
  color text,
  is_private boolean NOT NULL DEFAULT false,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  task_seq int NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lists_space ON public.lists(space_id) WHERE archived_at IS NULL;
CREATE INDEX idx_lists_folder ON public.lists(folder_id) WHERE archived_at IS NULL;

CREATE TABLE public.list_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#94a3b8',
  sort_order int NOT NULL DEFAULT 0,
  is_done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_list_statuses_list ON public.list_statuses(list_id, sort_order);

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  number int NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  status_id uuid REFERENCES public.list_statuses(id) ON DELETE SET NULL,
  priority public.task_priority NOT NULL DEFAULT 'none',
  start_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  estimate_minutes int,
  progress_pct int CHECK (progress_pct BETWEEN 0 AND 100),
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_list ON public.tasks(list_id) WHERE archived_at IS NULL;
CREATE INDEX idx_tasks_parent ON public.tasks(parent_task_id);
CREATE INDEX idx_tasks_tenant_due ON public.tasks(tenant_id, due_at) WHERE archived_at IS NULL;

CREATE TABLE public.task_assignees (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);
CREATE INDEX idx_task_assignees_user ON public.task_assignees(user_id);

CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#7c3aed',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE public.task_tags (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE public.checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Checklist',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  content text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_checklist_items_cl ON public.checklist_items(checklist_id, sort_order);

CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_comments_task ON public.task_comments(task_id, created_at);

CREATE TABLE public.task_activity (
  id bigserial PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_activity_task ON public.task_activity(task_id, created_at DESC);

-- ============================================================
-- 4) Triggers
-- ============================================================
CREATE TRIGGER tg_spaces_u BEFORE UPDATE ON public.spaces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tg_folders_u BEFORE UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tg_lists_u BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tg_tasks_u BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tg_task_comments_u BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_task_assign_number()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $fn$
BEGIN
  IF NEW.number IS NULL OR NEW.number = 0 THEN
    UPDATE public.lists SET task_seq = task_seq + 1
    WHERE id = NEW.list_id RETURNING task_seq INTO NEW.number;
  END IF;
  RETURN NEW;
END $fn$;
CREATE TRIGGER tg_tasks_number BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_task_assign_number();

CREATE OR REPLACE FUNCTION public.tg_list_seed_statuses()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $fn$
BEGIN
  INSERT INTO public.list_statuses (list_id, name, color, sort_order, is_done) VALUES
    (NEW.id, 'PENDENTE','#94a3b8',0,false),
    (NEW.id, 'EM PROGRESSO','#3b82f6',1,false),
    (NEW.id, 'CONCLUÍDO','#22c55e',2,true);
  RETURN NEW;
END $fn$;
CREATE TRIGGER tg_lists_seed AFTER INSERT ON public.lists
  FOR EACH ROW EXECUTE FUNCTION public.tg_list_seed_statuses();

CREATE OR REPLACE FUNCTION public.tg_task_log()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $fn$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO public.task_activity(task_id,user_id,kind,payload)
    VALUES (NEW.id, NEW.created_by,'created', jsonb_build_object('title',NEW.title));
  ELSIF TG_OP='UPDATE' THEN
    IF NEW.status_id IS DISTINCT FROM OLD.status_id THEN
      INSERT INTO public.task_activity(task_id,user_id,kind,payload)
      VALUES (NEW.id, auth.uid(),'status_changed', jsonb_build_object('from',OLD.status_id,'to',NEW.status_id));
    END IF;
    IF NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
      INSERT INTO public.task_activity(task_id,user_id,kind,payload)
      VALUES (NEW.id, auth.uid(), CASE WHEN NEW.completed_at IS NULL THEN 'reopened' ELSE 'completed' END, NULL);
    END IF;
  END IF;
  RETURN NEW;
END $fn$;
CREATE TRIGGER tg_tasks_log AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_task_log();

-- ============================================================
-- 5) RLS
-- ============================================================
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY spaces_sel ON public.spaces FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) AND (NOT is_private OR owner_id = auth.uid() OR public.is_tenant_admin(tenant_id)));
CREATE POLICY spaces_ins ON public.spaces FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(tenant_id));
CREATE POLICY spaces_upd ON public.spaces FOR UPDATE TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY spaces_del ON public.spaces FOR DELETE TO authenticated USING (public.is_tenant_admin(tenant_id) OR owner_id = auth.uid());

CREATE POLICY folders_all ON public.folders FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.spaces s WHERE s.id=folders.space_id AND public.is_tenant_member(s.tenant_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.spaces s WHERE s.id=folders.space_id AND public.is_tenant_member(s.tenant_id)));

CREATE POLICY lists_sel ON public.lists FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) AND (NOT is_private OR owner_id=auth.uid() OR public.is_tenant_admin(tenant_id)));
CREATE POLICY lists_iud ON public.lists FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY ls_all ON public.list_statuses FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.lists l WHERE l.id=list_statuses.list_id AND public.is_tenant_member(l.tenant_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.lists l WHERE l.id=list_statuses.list_id AND public.is_tenant_member(l.tenant_id)));

CREATE POLICY tasks_sel ON public.tasks FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) AND EXISTS(
    SELECT 1 FROM public.lists l WHERE l.id=tasks.list_id
      AND (NOT l.is_private OR l.owner_id=auth.uid() OR public.is_tenant_admin(l.tenant_id))));
CREATE POLICY tasks_iud ON public.tasks FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY ta_all ON public.task_assignees FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=task_assignees.task_id AND public.is_tenant_member(t.tenant_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=task_assignees.task_id AND public.is_tenant_member(t.tenant_id)));

CREATE POLICY tags_all ON public.tags FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY tt_all ON public.task_tags FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=task_tags.task_id AND public.is_tenant_member(t.tenant_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=task_tags.task_id AND public.is_tenant_member(t.tenant_id)));

CREATE POLICY cl_all ON public.checklists FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=checklists.task_id AND public.is_tenant_member(t.tenant_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=checklists.task_id AND public.is_tenant_member(t.tenant_id)));

CREATE POLICY cli_all ON public.checklist_items FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.checklists c JOIN public.tasks t ON t.id=c.task_id WHERE c.id=checklist_items.checklist_id AND public.is_tenant_member(t.tenant_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.checklists c JOIN public.tasks t ON t.id=c.task_id WHERE c.id=checklist_items.checklist_id AND public.is_tenant_member(t.tenant_id)));

CREATE POLICY tc_sel ON public.task_comments FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=task_comments.task_id AND public.is_tenant_member(t.tenant_id)));
CREATE POLICY tc_ins ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=task_comments.task_id AND public.is_tenant_member(t.tenant_id)));
CREATE POLICY tc_upd ON public.task_comments FOR UPDATE TO authenticated USING (user_id=auth.uid());
CREATE POLICY tc_del ON public.task_comments FOR DELETE TO authenticated USING (user_id=auth.uid());

CREATE POLICY tact_sel ON public.task_activity FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=task_activity.task_id AND public.is_tenant_member(t.tenant_id)));
CREATE POLICY tact_ins ON public.task_activity FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.tasks t WHERE t.id=task_activity.task_id AND public.is_tenant_member(t.tenant_id)));
