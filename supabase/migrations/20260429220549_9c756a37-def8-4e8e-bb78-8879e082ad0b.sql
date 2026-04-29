-- =========================================================
-- Oxy Growth OS — Migration 001: Schema inicial (retry)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "moddatetime" SCHEMA extensions;

-- ENUMS
CREATE TYPE public.tenant_role AS ENUM ('admin', 'manager', 'specialist', 'requester');
CREATE TYPE public.project_role AS ENUM ('owner', 'editor', 'commenter', 'viewer');
CREATE TYPE public.squad_role AS ENUM ('lead', 'specialist');
CREATE TYPE public.task_priority AS ENUM ('none', 'low', 'medium', 'high', 'urgent');
CREATE TYPE public.activity_kind AS ENUM ('created','updated','status_changed','assigned','commented','deleted','attached','time_logged');
CREATE TYPE public.notification_channel AS ENUM ('in_app','email','push');
CREATE TYPE public.squad_kind AS ENUM ('ia','marketing','expansao','custom');

-- updated_at genérico
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, display_name TEXT, avatar_url TEXT, email TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo', locale TEXT DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER tg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- tenants
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, logo_url TEXT,
  primary_color TEXT DEFAULT '#0EA5E9', accent_color TEXT DEFAULT '#FCD34D',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER tg_tenants_updated BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- tenant_members
CREATE TABLE public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.tenant_role NOT NULL DEFAULT 'specialist',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
CREATE INDEX idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant ON public.tenant_members(tenant_id);
CREATE TRIGGER tg_tenant_members_updated BEFORE UPDATE ON public.tenant_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- helpers de tenant (não dependem de project_members)
CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_role_in_tenant(_tenant_id UUID)
RETURNS public.tenant_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.tenant_members WHERE tenant_id = _tenant_id AND user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_tenant_id UUID, _role public.tenant_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = _tenant_id AND user_id = auth.uid() AND role = _role
  );
$$;

-- squads
CREATE TABLE public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, kind public.squad_kind NOT NULL DEFAULT 'custom',
  color TEXT, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX idx_squads_tenant ON public.squads(tenant_id);
CREATE TRIGGER tg_squads_updated BEFORE UPDATE ON public.squads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_in_squad public.squad_role NOT NULL DEFAULT 'specialist',
  capacity_hours_week NUMERIC(5,2) DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (squad_id, user_id)
);
CREATE TRIGGER tg_squad_members_updated BEFORE UPDATE ON public.squad_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  squad_id UUID REFERENCES public.squads(id) ON DELETE SET NULL,
  name TEXT NOT NULL, key TEXT NOT NULL, description TEXT,
  color TEXT, icon TEXT,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  task_seq INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);
CREATE INDEX idx_projects_tenant ON public.projects(tenant_id);
CREATE INDEX idx_projects_squad ON public.projects(squad_id);
CREATE TRIGGER tg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.project_role NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);
CREATE TRIGGER tg_project_members_updated BEFORE UPDATE ON public.project_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- helper de projeto (depois das tabelas)
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members WHERE project_id = _project_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id
    WHERE p.id = _project_id AND tm.user_id = auth.uid() AND tm.role IN ('admin','manager')
  );
$$;

-- task_statuses / task_types
CREATE TABLE public.task_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE,
  name TEXT NOT NULL, slug TEXT NOT NULL, color TEXT,
  position INTEGER NOT NULL DEFAULT 0, is_done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_statuses_tenant ON public.task_statuses(tenant_id);
CREATE TRIGGER tg_statuses_updated BEFORE UPDATE ON public.task_statuses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE,
  name TEXT NOT NULL, slug TEXT NOT NULL, icon TEXT, color TEXT,
  default_estimate_minutes INTEGER,
  checklist JSONB DEFAULT '[]'::jsonb,
  workflow JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_types_tenant ON public.task_types(tenant_id);
CREATE TRIGGER tg_types_updated BEFORE UPDATE ON public.task_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  number INTEGER NOT NULL, code TEXT,
  title TEXT NOT NULL, description TEXT,
  status_id UUID REFERENCES public.task_statuses(id) ON DELETE SET NULL,
  type_id UUID REFERENCES public.task_types(id) ON DELETE SET NULL,
  priority public.task_priority NOT NULL DEFAULT 'none',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ, due_at TIMESTAMPTZ,
  estimate_minutes INTEGER, spent_minutes INTEGER NOT NULL DEFAULT 0,
  checklist JSONB DEFAULT '[]'::jsonb,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  position NUMERIC NOT NULL DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  done_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, number)
);
CREATE INDEX idx_tasks_tenant ON public.tasks(tenant_id);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status_id);
CREATE INDEX idx_tasks_due ON public.tasks(due_at);
CREATE INDEX idx_tasks_parent ON public.tasks(parent_task_id);
CREATE INDEX idx_tasks_title_trgm ON public.tasks USING gin (title gin_trgm_ops);
CREATE TRIGGER tg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.set_task_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_key TEXT; v_next INTEGER;
BEGIN
  IF NEW.number IS NULL OR NEW.number = 0 THEN
    UPDATE public.projects SET task_seq = task_seq + 1
      WHERE id = NEW.project_id RETURNING task_seq, key INTO v_next, v_key;
    NEW.number := v_next;
    NEW.code := COALESCE(v_key,'TASK') || '-' || v_next;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tg_set_task_number BEFORE INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_task_number();

-- assignment_matrix
CREATE TABLE public.assignment_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  type_id UUID REFERENCES public.task_types(id) ON DELETE CASCADE,
  status_id UUID REFERENCES public.task_statuses(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER tg_matrix_updated BEFORE UPDATE ON public.assignment_matrix FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.auto_assign_on_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_assignee UUID;
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status_id IS DISTINCT FROM OLD.status_id) THEN
    SELECT assignee_id INTO v_assignee FROM public.assignment_matrix
      WHERE tenant_id = NEW.tenant_id
        AND (project_id = NEW.project_id OR project_id IS NULL)
        AND (type_id = NEW.type_id OR type_id IS NULL)
        AND status_id = NEW.status_id
      ORDER BY priority DESC NULLS LAST LIMIT 1;
    IF v_assignee IS NOT NULL THEN NEW.assignee_id := v_assignee; END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tg_auto_assign BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.auto_assign_on_status_change();

-- tags
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE TRIGGER tg_tags_updated BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.task_tags (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  mentions UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_task ON public.comments(task_id);
CREATE TRIGGER tg_comments_updated BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- attachments
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL, path TEXT NOT NULL, filename TEXT NOT NULL,
  mime_type TEXT, size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_task ON public.attachments(task_id);
CREATE TRIGGER tg_attachments_updated BEFORE UPDATE ON public.attachments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- time_entries
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ, minutes INTEGER, note TEXT, source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_active_timer_per_user ON public.time_entries(user_id) WHERE ended_at IS NULL;
CREATE INDEX idx_time_entries_task ON public.time_entries(task_id);
CREATE TRIGGER tg_time_entries_updated BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- pomodoros
CREATE TABLE public.pomodoros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  planned_minutes INTEGER NOT NULL DEFAULT 25,
  break_minutes INTEGER NOT NULL DEFAULT 5,
  ambient TEXT, completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_active_pomo_per_user ON public.pomodoros(user_id) WHERE ended_at IS NULL;
CREATE TRIGGER tg_pomodoros_updated BEFORE UPDATE ON public.pomodoros FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- habits
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, cadence TEXT DEFAULT 'daily',
  target_per_period INTEGER DEFAULT 1, color TEXT,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER tg_habits_updated BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.habit_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, checkin_date)
);

-- recurrences
CREATE TABLE public.recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  rrule TEXT NOT NULL, next_run_at TIMESTAMPTZ,
  template JSONB, active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER tg_recurrences_updated BEFORE UPDATE ON public.recurrences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- reminders
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reminders_due ON public.reminders(remind_at) WHERE sent = FALSE;
CREATE TRIGGER tg_reminders_updated BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- demand_forms / submissions
CREATE TABLE public.demand_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  squad_id UUID REFERENCES public.squads(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, description TEXT,
  schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER tg_demand_forms_updated BEFORE UPDATE ON public.demand_forms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.demand_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.demand_forms(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  requester_name TEXT, requester_email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER tg_demand_subs_updated BEFORE UPDATE ON public.demand_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- activities
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  kind public.activity_kind NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activities_tenant ON public.activities(tenant_id);
CREATE INDEX idx_activities_task ON public.activities(task_id);

CREATE OR REPLACE FUNCTION public.audit_task_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activities(tenant_id, task_id, project_id, actor_id, kind, payload)
      VALUES (NEW.tenant_id, NEW.id, NEW.project_id, auth.uid(), 'created', jsonb_build_object('title', NEW.title));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status_id IS DISTINCT FROM OLD.status_id THEN
      INSERT INTO public.activities(tenant_id, task_id, project_id, actor_id, kind, payload)
        VALUES (NEW.tenant_id, NEW.id, NEW.project_id, auth.uid(), 'status_changed', jsonb_build_object('from', OLD.status_id, 'to', NEW.status_id));
    END IF;
    IF NEW.assignee_id IS DISTINCT FROM OLD.assignee_id THEN
      INSERT INTO public.activities(tenant_id, task_id, project_id, actor_id, kind, payload)
        VALUES (NEW.tenant_id, NEW.id, NEW.project_id, auth.uid(), 'assigned', jsonb_build_object('from', OLD.assignee_id, 'to', NEW.assignee_id));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activities(tenant_id, task_id, project_id, actor_id, kind, payload)
      VALUES (OLD.tenant_id, OLD.id, OLD.project_id, auth.uid(), 'deleted', jsonb_build_object('title', OLD.title));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER tg_audit_task AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.audit_task_change();

-- notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL, body TEXT, link TEXT,
  read_at TIMESTAMPTZ, payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id) WHERE read_at IS NULL;

-- saved_filters
CREATE TABLE public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, scope TEXT NOT NULL DEFAULT 'tasks',
  query JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER tg_filters_updated BEFORE UPDATE ON public.saved_filters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- oauth_connections
CREATE TABLE public.oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, account_email TEXT,
  access_token TEXT, refresh_token TEXT, expires_at TIMESTAMPTZ,
  scope TEXT, metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, account_email)
);
CREATE TRIGGER tg_oauth_updated BEFORE UPDATE ON public.oauth_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- task_embeddings
CREATE TABLE public.task_embeddings (
  task_id UUID PRIMARY KEY REFERENCES public.tasks(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  embedding vector(1536), content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_embeddings_ivf ON public.task_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE TRIGGER tg_embeddings_updated BEFORE UPDATE ON public.task_embeddings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ai_interactions
CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  feature TEXT NOT NULL, model TEXT,
  prompt TEXT, response TEXT,
  tokens_in INTEGER, tokens_out INTEGER,
  cost_cents NUMERIC(10,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_interactions_tenant ON public.ai_interactions(tenant_id);

-- materialized view
CREATE MATERIALIZED VIEW public.mv_workload_by_user AS
SELECT t.tenant_id, t.assignee_id AS user_id,
  date_trunc('week', COALESCE(t.due_at, t.start_at, t.created_at)) AS week_start,
  COUNT(*) FILTER (WHERE NOT t.archived) AS task_count,
  COALESCE(SUM(t.estimate_minutes) FILTER (WHERE NOT t.archived), 0) AS estimated_minutes,
  COALESCE(SUM(t.spent_minutes) FILTER (WHERE NOT t.archived), 0) AS spent_minutes
FROM public.tasks t
WHERE t.assignee_id IS NOT NULL
GROUP BY t.tenant_id, t.assignee_id, date_trunc('week', COALESCE(t.due_at, t.start_at, t.created_at));
CREATE UNIQUE INDEX idx_mv_workload_unique ON public.mv_workload_by_user(tenant_id, user_id, week_start);

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name, avatar_url)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
  ('attachments','attachments', false, 26214400),
  ('creatives','creatives', false, 52428800),
  ('avatars','avatars', true, 2097152),
  ('tenant-assets','tenant-assets', false, 10485760),
  ('exports','exports', false, 104857600)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY profiles_self_read ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.tenant_members tm1
    JOIN public.tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id
    WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id));
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY profiles_self_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY tenants_member_read ON public.tenants FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_tenant_ids()));
CREATE POLICY tenants_admin_update ON public.tenants FOR UPDATE TO authenticated
  USING (public.has_tenant_role(id, 'admin'));
CREATE POLICY tenants_authenticated_insert ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY tm_self_read ON public.tenant_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY tm_admin_manage ON public.tenant_members FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id, 'admin'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'admin'));
CREATE POLICY tm_self_insert ON public.tenant_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY squads_read ON public.squads FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY squads_admin_manage ON public.squads FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id, 'admin') OR public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'admin') OR public.has_tenant_role(tenant_id, 'manager'));

CREATE POLICY sm_read ON public.squad_members FOR SELECT TO authenticated
  USING (squad_id IN (SELECT id FROM public.squads WHERE tenant_id IN (SELECT public.user_tenant_ids())));
CREATE POLICY sm_admin_manage ON public.squad_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND (public.has_tenant_role(s.tenant_id,'admin') OR public.has_tenant_role(s.tenant_id,'manager'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND (public.has_tenant_role(s.tenant_id,'admin') OR public.has_tenant_role(s.tenant_id,'manager'))));

CREATE POLICY projects_read ON public.projects FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY projects_manage ON public.projects FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id, 'admin') OR public.has_tenant_role(tenant_id, 'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id, 'admin') OR public.has_tenant_role(tenant_id, 'manager'));

CREATE POLICY pm_read ON public.project_members FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE tenant_id IN (SELECT public.user_tenant_ids())));
CREATE POLICY pm_manage ON public.project_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (public.has_tenant_role(p.tenant_id,'admin') OR public.has_tenant_role(p.tenant_id,'manager'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (public.has_tenant_role(p.tenant_id,'admin') OR public.has_tenant_role(p.tenant_id,'manager'))));

CREATE POLICY statuses_read ON public.task_statuses FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY statuses_manage ON public.task_statuses FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id,'admin') OR public.has_tenant_role(tenant_id,'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id,'admin') OR public.has_tenant_role(tenant_id,'manager'));
CREATE POLICY types_read ON public.task_types FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY types_manage ON public.task_types FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id,'admin') OR public.has_tenant_role(tenant_id,'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id,'admin') OR public.has_tenant_role(tenant_id,'manager'));

CREATE POLICY tasks_read ON public.tasks FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY tasks_insert ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY tasks_update ON public.tasks FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY tasks_delete ON public.tasks FOR DELETE TO authenticated
  USING (public.has_tenant_role(tenant_id,'admin') OR public.has_tenant_role(tenant_id,'manager'));

CREATE POLICY am_read ON public.assignment_matrix FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY am_manage ON public.assignment_matrix FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id,'admin') OR public.has_tenant_role(tenant_id,'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id,'admin') OR public.has_tenant_role(tenant_id,'manager'));

CREATE POLICY tags_read ON public.tags FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY tags_manage ON public.tags FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY tt_read ON public.task_tags FOR SELECT TO authenticated
  USING (task_id IN (SELECT id FROM public.tasks WHERE tenant_id IN (SELECT public.user_tenant_ids())));
CREATE POLICY tt_manage ON public.task_tags FOR ALL TO authenticated
  USING (task_id IN (SELECT id FROM public.tasks WHERE tenant_id IN (SELECT public.user_tenant_ids())))
  WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE tenant_id IN (SELECT public.user_tenant_ids())));

CREATE POLICY comments_read ON public.comments FOR SELECT TO authenticated
  USING (task_id IN (SELECT id FROM public.tasks WHERE tenant_id IN (SELECT public.user_tenant_ids())));
CREATE POLICY comments_insert ON public.comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND task_id IN (SELECT id FROM public.tasks WHERE tenant_id IN (SELECT public.user_tenant_ids())));
CREATE POLICY comments_update_own ON public.comments FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE POLICY comments_delete_own ON public.comments FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE POLICY attachments_read ON public.attachments FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY attachments_insert ON public.attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY attachments_delete_own ON public.attachments FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

CREATE POLICY te_read ON public.time_entries FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY te_manage_own ON public.time_entries FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY pomo_own ON public.pomodoros FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY habits_own ON public.habits FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY habit_checkins_own ON public.habit_checkins FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY recurrences_read ON public.recurrences FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY recurrences_manage ON public.recurrences FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id,'admin') OR public.has_tenant_role(tenant_id,'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id,'admin') OR public.has_tenant_role(tenant_id,'manager'));

CREATE POLICY reminders_own ON public.reminders FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY demand_forms_public_read ON public.demand_forms FOR SELECT TO anon, authenticated USING (active = TRUE);
CREATE POLICY demand_forms_manage ON public.demand_forms FOR ALL TO authenticated
  USING (public.has_tenant_role(tenant_id,'admin') OR public.has_tenant_role(tenant_id,'manager'))
  WITH CHECK (public.has_tenant_role(tenant_id,'admin') OR public.has_tenant_role(tenant_id,'manager'));

CREATE POLICY demand_subs_public_insert ON public.demand_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.demand_forms f WHERE f.id = form_id AND f.active = TRUE AND f.tenant_id = demand_submissions.tenant_id));
CREATE POLICY demand_subs_read ON public.demand_submissions FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY demand_subs_manage ON public.demand_submissions FOR UPDATE TO authenticated
  USING (public.has_tenant_role(tenant_id,'admin') OR public.has_tenant_role(tenant_id,'manager'));

CREATE POLICY activities_read ON public.activities FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY notif_own ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY filters_read ON public.saved_filters FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (is_shared = TRUE AND tenant_id IN (SELECT public.user_tenant_ids())));
CREATE POLICY filters_manage ON public.saved_filters FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY oauth_own ON public.oauth_connections FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY emb_read ON public.task_embeddings FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY emb_manage ON public.task_embeddings FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY ai_read ON public.ai_interactions FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY ai_insert ON public.ai_interactions FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

-- STORAGE policies
CREATE POLICY "avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars user write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars user update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars user delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "attach read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('attachments','creatives','tenant-assets','exports')
         AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_tenant_ids()));
CREATE POLICY "attach write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('attachments','creatives','tenant-assets','exports')
              AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_tenant_ids()));
CREATE POLICY "attach update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('attachments','creatives','tenant-assets','exports')
         AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_tenant_ids()));
CREATE POLICY "attach delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('attachments','creatives','tenant-assets','exports')
         AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_tenant_ids()));