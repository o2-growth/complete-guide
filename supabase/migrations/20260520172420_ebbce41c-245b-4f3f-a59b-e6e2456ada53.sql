-- =========================================================
-- Fase A: visibilidade hierárquica (Espaço→Pasta→Lista→Tarefa)
-- =========================================================

-- 1. squads: ícone, privacidade, ordenação
ALTER TABLE public.squads
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- 2. projects: kind e privacidade
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='kind') THEN
    ALTER TABLE public.projects ADD COLUMN kind text NOT NULL DEFAULT 'list'
      CHECK (kind IN ('space_root','folder','list','inbox'));
  END IF;
END $$;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

-- Backfill kind
UPDATE public.projects p SET kind='inbox'
  WHERE p.kind='list' AND p.name LIKE 'Inbox de %';

UPDATE public.projects p SET kind='folder'
  WHERE p.kind='list'
    AND EXISTS (SELECT 1 FROM public.projects c WHERE c.parent_id = p.id);

-- 3. Helpers (SECURITY DEFINER, search_path fixo)
CREATE OR REPLACE FUNCTION public.is_squad_member(_squad_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.squad_members
    WHERE squad_id = _squad_id AND user_id = (select auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.can_see_project(_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = _project_id
      AND (
        -- admin/manager do tenant veem tudo
        public.has_tenant_role(p.tenant_id, 'admin'::tenant_role)
        OR public.has_tenant_role(p.tenant_id, 'manager'::tenant_role)
        -- criador do projeto (cobre Inbox pessoal)
        OR p.created_by = (select auth.uid())
        -- membro explícito do projeto
        OR public.is_project_member(p.id)
        -- membro do squad dono (se projeto não-privado e squad não-privado)
        OR (
          p.squad_id IS NOT NULL
          AND p.is_private = false
          AND public.is_squad_member(p.squad_id)
          AND EXISTS (SELECT 1 FROM public.squads s WHERE s.id = p.squad_id AND s.is_private = false)
        )
      )
      -- Inbox pessoal: apenas o dono
      AND (p.kind <> 'inbox' OR p.created_by = (select auth.uid())
           OR public.has_tenant_role(p.tenant_id, 'admin'::tenant_role))
  );
$$;

CREATE OR REPLACE FUNCTION public.can_see_task(_task_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = _task_id
      AND (
        t.assignee_id = (select auth.uid())
        OR t.reporter_id = (select auth.uid())
        OR t.created_by = (select auth.uid())
        OR public.can_see_project(t.project_id)
      )
  );
$$;

-- 4. RLS rewrite
-- projects: SELECT
DROP POLICY IF EXISTS projects_read ON public.projects;
CREATE POLICY projects_read ON public.projects FOR SELECT
  USING (
    tenant_id IN (SELECT user_tenant_ids())
    AND (
      has_tenant_role(tenant_id, 'admin'::tenant_role)
      OR has_tenant_role(tenant_id, 'manager'::tenant_role)
      OR created_by = (select auth.uid())
      OR is_project_member(id)
      OR (
        squad_id IS NOT NULL
        AND is_private = false
        AND is_squad_member(squad_id)
        AND EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.is_private = false)
      )
    )
    AND (kind <> 'inbox' OR created_by = (select auth.uid()) OR has_tenant_role(tenant_id, 'admin'::tenant_role))
  );

-- tasks: SELECT
DROP POLICY IF EXISTS tasks_read ON public.tasks;
CREATE POLICY tasks_read ON public.tasks FOR SELECT
  USING (
    tenant_id IN (SELECT user_tenant_ids())
    AND (
      assignee_id = (select auth.uid())
      OR reporter_id = (select auth.uid())
      OR created_by = (select auth.uid())
      OR can_see_project(project_id)
    )
  );

-- tasks: UPDATE (manter — só quem vê pode atualizar)
DROP POLICY IF EXISTS tasks_update ON public.tasks;
CREATE POLICY tasks_update ON public.tasks FOR UPDATE
  USING (
    tenant_id IN (SELECT user_tenant_ids())
    AND (
      assignee_id = (select auth.uid())
      OR reporter_id = (select auth.uid())
      OR created_by = (select auth.uid())
      OR can_see_project(project_id)
    )
  );

-- comments
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='comments') THEN
    EXECUTE 'DROP POLICY IF EXISTS comments_read ON public.comments';
    EXECUTE 'CREATE POLICY comments_read ON public.comments FOR SELECT USING (public.can_see_task(task_id))';
  END IF;
END $$;

-- attachments
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='attachments') THEN
    EXECUTE 'DROP POLICY IF EXISTS attachments_read ON public.attachments';
    EXECUTE 'CREATE POLICY attachments_read ON public.attachments FOR SELECT USING (task_id IS NULL OR public.can_see_task(task_id))';
  END IF;
END $$;

-- time_entries
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='time_entries') THEN
    EXECUTE 'DROP POLICY IF EXISTS time_entries_read ON public.time_entries';
    EXECUTE 'CREATE POLICY time_entries_read ON public.time_entries FOR SELECT USING (user_id = (select auth.uid()) OR (task_id IS NOT NULL AND public.can_see_task(task_id)))';
  END IF;
END $$;

-- task_assets
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='task_assets') THEN
    EXECUTE 'DROP POLICY IF EXISTS task_assets_read ON public.task_assets';
    EXECUTE 'CREATE POLICY task_assets_read ON public.task_assets FOR SELECT USING (public.can_see_task(task_id))';
  END IF;
END $$;

-- pomodoros
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pomodoros') THEN
    EXECUTE 'DROP POLICY IF EXISTS pomodoros_read ON public.pomodoros';
    EXECUTE 'CREATE POLICY pomodoros_read ON public.pomodoros FOR SELECT USING (user_id = (select auth.uid()) OR (task_id IS NOT NULL AND public.can_see_task(task_id)))';
  END IF;
END $$;

-- task_custom_field_values
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='task_custom_field_values') THEN
    EXECUTE 'DROP POLICY IF EXISTS tcfv_read ON public.task_custom_field_values';
    EXECUTE 'CREATE POLICY tcfv_read ON public.task_custom_field_values FOR SELECT USING (public.can_see_task(task_id))';
  END IF;
END $$;

-- 5. Trigger: herdar squad do pai
CREATE OR REPLACE FUNCTION public.tg_project_inherit_squad()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.squad_id IS NULL AND NEW.parent_id IS NOT NULL THEN
    SELECT p.squad_id INTO NEW.squad_id FROM public.projects p WHERE p.id = NEW.parent_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_project_inherit_squad ON public.projects;
CREATE TRIGGER tg_project_inherit_squad
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.tg_project_inherit_squad();

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_done ON public.tasks(assignee_id, done_at);
CREATE INDEX IF NOT EXISTS idx_tasks_reporter ON public.tasks(reporter_id);
CREATE INDEX IF NOT EXISTS idx_projects_squad_parent ON public.projects(squad_id, parent_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_kind ON public.projects(kind) WHERE archived = false;