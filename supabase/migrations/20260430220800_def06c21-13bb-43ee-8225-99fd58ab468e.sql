-- ============== OKRs ==============
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  description text,
  period_start date not null,
  period_end date not null,
  owner_id uuid,
  status text not null default 'active' check (status in ('active','done','at_risk','dropped')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_goals_tenant on public.goals(tenant_id);
alter table public.goals enable row level security;
create policy "goals tenant rw" on public.goals
  for all to authenticated using (tenant_id in (select user_tenant_ids()))
  with check (tenant_id in (select user_tenant_ids()));
create trigger trg_goals_updated before update on public.goals
  for each row execute function public.touch_updated_at();

create table if not exists public.key_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  source text not null check (source in ('tasks','posts','manual')),
  metric text not null,
  dimension_key text,
  dimension_value text,
  baseline numeric not null default 0,
  target numeric not null,
  current_value numeric not null default 0,
  unit text,
  direction text not null default 'up' check (direction in ('up','down')),
  manual_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_kr_goal on public.key_results(goal_id);
alter table public.key_results enable row level security;
create policy "kr tenant rw" on public.key_results
  for all to authenticated using (tenant_id in (select user_tenant_ids()))
  with check (tenant_id in (select user_tenant_ids()));
create trigger trg_kr_updated before update on public.key_results
  for each row execute function public.touch_updated_at();

-- Calcula progresso atual de cada KR a partir do warehouse
create or replace function public.kr_progress(_tenant uuid)
returns int
language plpgsql security definer set search_path = public
as $$
declare r record; v numeric; pct numeric;
begin
  for r in select * from public.key_results where tenant_id = _tenant loop
    if r.source = 'manual' then
      v := coalesce(r.manual_value, r.current_value);
    elsif r.source = 'tasks' then
      execute format(
        'select coalesce(sum(%I),0)::numeric from public.fact_tasks_daily
         where tenant_id = $1 and d between $2 and $3',
         r.metric)
      into v
      using _tenant,
            (select period_start from public.goals where id = r.goal_id),
            (select period_end   from public.goals where id = r.goal_id);
    elsif r.source = 'posts' then
      execute format(
        'select coalesce(sum(%I),0)::numeric from public.fact_posts_daily
         where tenant_id = $1 and d between $2 and $3',
         r.metric)
      into v
      using _tenant,
            (select period_start from public.goals where id = r.goal_id),
            (select period_end   from public.goals where id = r.goal_id);
    end if;
    update public.key_results set current_value = coalesce(v,0), updated_at = now() where id = r.id;
  end loop;
  -- atualiza status do goal (at_risk se < 50% no meio do periodo)
  update public.goals g
  set status = case
    when now()::date >= g.period_end then 'done'
    when now()::date > g.period_start + ((g.period_end - g.period_start)/2)
         and (
           select coalesce(avg(
             case when k.direction = 'up' then
               case when k.target = k.baseline then 0
                    else greatest(0, least(1, (k.current_value - k.baseline)/(k.target - k.baseline))) end
             else
               case when k.baseline = k.target then 0
                    else greatest(0, least(1, (k.baseline - k.current_value)/(k.baseline - k.target))) end
             end
           ),0) from public.key_results k where k.goal_id = g.id
         ) < 0.5
      then 'at_risk'
    else 'active'
  end
  where g.tenant_id = _tenant and g.status not in ('dropped');
  return 1;
end $$;
revoke execute on function public.kr_progress(uuid) from anon;

-- ============== Forecast (regressao linear simples) ==============
-- Devolve previsao para os proximos _days_ahead com base em historico do warehouse
create or replace function public.forecast_metric(
  _tenant uuid, _source text, _metric text, _days_back int default 60, _days_ahead int default 30
) returns table (d date, value numeric, kind text)
language plpgsql security definer set search_path = public
as $$
declare
  n int := 0; sum_x numeric := 0; sum_y numeric := 0; sum_xy numeric := 0; sum_xx numeric := 0;
  slope numeric := 0; intercept numeric := 0;
  rec record;
begin
  if _source = 'tasks' then
    for rec in execute format(
      'select d::date as dd, %I::numeric as v from public.fact_tasks_daily
       where tenant_id = $1 and d >= current_date - $2 order by d', _metric)
      using _tenant, _days_back loop
      n := n + 1;
      sum_x := sum_x + n; sum_y := sum_y + rec.v;
      sum_xy := sum_xy + n*rec.v; sum_xx := sum_xx + n*n;
      d := rec.dd; value := rec.v; kind := 'history'; return next;
    end loop;
  elsif _source = 'posts' then
    for rec in execute format(
      'select d::date as dd, sum(%I)::numeric as v from public.fact_posts_daily
       where tenant_id = $1 and d >= current_date - $2 group by d order by d', _metric)
      using _tenant, _days_back loop
      n := n + 1;
      sum_x := sum_x + n; sum_y := sum_y + rec.v;
      sum_xy := sum_xy + n*rec.v; sum_xx := sum_xx + n*n;
      d := rec.dd; value := rec.v; kind := 'history'; return next;
    end loop;
  end if;

  if n >= 2 then
    slope := (n*sum_xy - sum_x*sum_y) / nullif((n*sum_xx - sum_x*sum_x),0);
    intercept := (sum_y - slope*sum_x) / n;
  end if;

  for i in 1.._days_ahead loop
    d := current_date + i;
    value := greatest(0, intercept + slope*(n + i));
    kind := 'forecast';
    return next;
  end loop;
end $$;
revoke execute on function public.forecast_metric(uuid, text, text, int, int) from anon;

-- ============== Schedules helpers ==============
create or replace function public.compute_next_run(_cadence text, _from timestamptz default now())
returns timestamptz language sql immutable as $$
  select case _cadence
    when 'daily'   then date_trunc('day',   _from) + interval '1 day  8 hours'
    when 'weekly'  then date_trunc('week',  _from) + interval '7 days 8 hours'
    when 'monthly' then (date_trunc('month',_from) + interval '1 month')::timestamptz + interval '8 hours'
  end
$$;

create or replace function public.due_schedules()
returns table (id uuid, tenant_id uuid, report_id uuid, cadence text, recipients text[])
language sql security definer set search_path = public as $$
  select id, tenant_id, report_id, cadence, recipients
  from public.report_schedules
  where active = true and (next_run_at is null or next_run_at <= now())
$$;
revoke execute on function public.due_schedules() from anon;