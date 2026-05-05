# Sub-fase 7C — Time Tracking nativo

Patch para o Lovable Cloud (`project_id = dboftogzjobfvtjaoifh`). Adiciona colunas
de billable hours em `time_entries` e RPC `user_timesheet` agregando dias.

## SQL

```sql
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS billable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2),
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_time_entries_billable
  ON public.time_entries(tenant_id, billable, started_at) WHERE billable = true;
CREATE INDEX IF NOT EXISTS idx_time_entries_user_started
  ON public.time_entries(user_id, started_at DESC);

-- RPC: timesheet por user/período
CREATE OR REPLACE FUNCTION public.user_timesheet(
  _tenant uuid,
  _user uuid,
  _start timestamptz,
  _end timestamptz
) RETURNS TABLE (
  day date,
  total_minutes int,
  billable_minutes int,
  total_amount numeric,
  task_count bigint
) LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT
    date_trunc('day', started_at)::date AS day,
    COALESCE(SUM(minutes), 0)::int AS total_minutes,
    COALESCE(SUM(CASE WHEN billable THEN minutes ELSE 0 END), 0)::int AS billable_minutes,
    COALESCE(SUM(CASE WHEN billable THEN minutes * COALESCE(hourly_rate, 0) / 60.0 ELSE 0 END), 0)::numeric AS total_amount,
    COUNT(DISTINCT task_id) AS task_count
  FROM public.time_entries
  WHERE tenant_id = _tenant
    AND user_id = _user
    AND ended_at IS NOT NULL
    AND started_at >= _start
    AND started_at < _end
    AND _tenant IN (SELECT public.user_tenant_ids())
  GROUP BY 1
  ORDER BY 1 DESC;
$$;
GRANT EXECUTE ON FUNCTION public.user_timesheet(uuid, uuid, timestamptz, timestamptz) TO authenticated;
```

## Notas
- `billable` default `false` — não muda comportamento atual de timer.
- `hourly_rate` opcional; quando `billable=true` e rate `null`, `total_amount` da
  RPC ignora (multiplica por 0).
- `tags text[]` para categorização futura (ex: "qa", "deploy").
- Índice parcial em `billable=true` mantém leve em workspaces com pouca cobrança.
- RPC stable + security definer + `_tenant in user_tenant_ids` para RLS bypass
  controlado.
