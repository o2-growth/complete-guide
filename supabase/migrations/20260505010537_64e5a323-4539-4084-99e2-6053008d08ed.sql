ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_projects_parent ON public.projects(parent_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_parent_sort ON public.projects(tenant_id, parent_id, sort_order);

CREATE OR REPLACE FUNCTION public.validate_project_depth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_depth integer := 1;
  v_current uuid := NEW.parent_id;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.parent_id = NEW.id THEN RAISE EXCEPTION 'project cannot be parent of itself'; END IF;
  WHILE v_current IS NOT NULL LOOP
    v_depth := v_depth + 1;
    IF v_depth > 3 THEN RAISE EXCEPTION 'project hierarchy depth cannot exceed 3 levels'; END IF;
    SELECT parent_id INTO v_current FROM public.projects WHERE id = v_current;
    IF v_current = NEW.id THEN RAISE EXCEPTION 'cyclic project hierarchy detected'; END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_validate_project_depth ON public.projects;
CREATE TRIGGER tg_validate_project_depth
  BEFORE INSERT OR UPDATE OF parent_id ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.validate_project_depth();

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS progress_pct smallint NOT NULL DEFAULT 0
    CHECK (progress_pct >= 0 AND progress_pct <= 100);

COMMENT ON COLUMN public.tasks.progress_pct IS
  'Progresso manual 0-100. Independente de subtarefas. Usado pela barra de progresso e slider gestual.';