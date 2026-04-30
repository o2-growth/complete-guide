-- Ensure shared updated_at trigger exists
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1) Per-user weekly capacity
CREATE TABLE IF NOT EXISTS public.user_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  hours_per_week NUMERIC NOT NULL DEFAULT 40 CHECK (hours_per_week >= 0 AND hours_per_week <= 168),
  workdays SMALLINT[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  daily_hours NUMERIC NOT NULL DEFAULT 8 CHECK (daily_hours >= 0 AND daily_hours <= 24),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

ALTER TABLE public.user_capacity ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_capacity_read ON public.user_capacity
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY user_capacity_manage_own ON public.user_capacity
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY user_capacity_admin_manage ON public.user_capacity
  FOR ALL TO authenticated
  USING (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role))
  WITH CHECK (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role));

CREATE TRIGGER trg_user_capacity_updated
  BEFORE UPDATE ON public.user_capacity
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_user_capacity_tenant ON public.user_capacity(tenant_id);

-- 2) Time off
DO $$ BEGIN
  CREATE TYPE public.time_off_kind AS ENUM ('vacation','sick','holiday','personal','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.time_off_status AS ENUM ('pending','approved','rejected','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  kind public.time_off_kind NOT NULL DEFAULT 'vacation',
  status public.time_off_status NOT NULL DEFAULT 'approved',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_time_off()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date must be on or after start_date';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_time_off_validate
  BEFORE INSERT OR UPDATE ON public.time_off
  FOR EACH ROW EXECUTE FUNCTION public.validate_time_off();

CREATE TRIGGER trg_time_off_updated
  BEFORE UPDATE ON public.time_off
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.time_off ENABLE ROW LEVEL SECURITY;

CREATE POLICY time_off_read ON public.time_off
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY time_off_manage_own ON public.time_off
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY time_off_admin_manage ON public.time_off
  FOR ALL TO authenticated
  USING (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role))
  WITH CHECK (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role));

CREATE INDEX IF NOT EXISTS idx_time_off_tenant_user ON public.time_off(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_time_off_dates ON public.time_off(start_date, end_date);

-- 3) Helper function
CREATE OR REPLACE FUNCTION public.capacity_for_user(
  _tenant_id UUID,
  _user_id UUID,
  _from DATE,
  _to DATE
) RETURNS TABLE (
  available_hours NUMERIC,
  off_days INTEGER,
  workdays_total INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap RECORD;
  d DATE;
  total_workdays INT := 0;
  off_count INT := 0;
BEGIN
  SELECT uc.hours_per_week, uc.workdays, uc.daily_hours INTO cap
  FROM public.user_capacity uc
  WHERE uc.tenant_id = _tenant_id AND uc.user_id = _user_id;

  IF NOT FOUND THEN
    cap.hours_per_week := 40;
    cap.workdays := ARRAY[1,2,3,4,5]::SMALLINT[];
    cap.daily_hours := 8;
  END IF;

  d := _from;
  WHILE d <= _to LOOP
    IF EXTRACT(DOW FROM d)::SMALLINT = ANY(cap.workdays) THEN
      total_workdays := total_workdays + 1;
      IF EXISTS (
        SELECT 1 FROM public.time_off t
        WHERE t.tenant_id = _tenant_id
          AND t.user_id = _user_id
          AND t.status = 'approved'
          AND d BETWEEN t.start_date AND t.end_date
      ) THEN
        off_count := off_count + 1;
      END IF;
    END IF;
    d := d + 1;
  END LOOP;

  available_hours := GREATEST(total_workdays - off_count, 0) * cap.daily_hours;
  off_days := off_count;
  workdays_total := total_workdays;
  RETURN NEXT;
END;
$$;