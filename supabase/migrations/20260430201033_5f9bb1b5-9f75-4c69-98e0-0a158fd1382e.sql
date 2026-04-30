
create table if not exists public.dim_date (
  d date primary key,
  year int not null, quarter int not null, month int not null,
  week int not null, dow int not null, day int not null,
  is_weekend boolean not null
);
insert into public.dim_date (d, year, quarter, month, week, dow, day, is_weekend)
select g::date,
       extract(year from g)::int, extract(quarter from g)::int, extract(month from g)::int,
       extract(week from g)::int, extract(dow from g)::int, extract(day from g)::int,
       extract(dow from g) in (0,6)
from generate_series('2024-01-01'::date, '2027-12-31'::date, interval '1 day') g
on conflict do nothing;
alter table public.dim_date enable row level security;
create policy "dim_date readable by authenticated" on public.dim_date for select to authenticated using (true);

create table if not exists public.fact_tasks_daily (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  d date not null,
  squad_id uuid, project_id uuid, assignee_id uuid, type_id uuid,
  created_count int not null default 0,
  done_count int not null default 0,
  overdue_count int not null default 0,
  spent_minutes int not null default 0,
  estimate_minutes int not null default 0,
  refreshed_at timestamptz not null default now()
);
create index if not exists idx_fact_tasks_daily_tenant_d on public.fact_tasks_daily(tenant_id, d);
create unique index if not exists uq_fact_tasks_daily on public.fact_tasks_daily(
  tenant_id, d,
  coalesce(squad_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(assignee_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(type_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
alter table public.fact_tasks_daily enable row level security;
create policy "tenant members read fact_tasks_daily" on public.fact_tasks_daily
  for select to authenticated using (tenant_id in (select user_tenant_ids()));

create table if not exists public.fact_posts_daily (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  d date not null,
  channel text, campaign_id uuid,
  posts_published int not null default 0,
  reach int not null default 0,
  impressions int not null default 0,
  likes int not null default 0,
  comments int not null default 0,
  shares int not null default 0,
  saves int not null default 0,
  clicks int not null default 0,
  refreshed_at timestamptz not null default now()
);
create index if not exists idx_fact_posts_daily_tenant_d on public.fact_posts_daily(tenant_id, d);
create unique index if not exists uq_fact_posts_daily on public.fact_posts_daily(
  tenant_id, d, coalesce(channel,''),
  coalesce(campaign_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
alter table public.fact_posts_daily enable row level security;
create policy "tenant members read fact_posts_daily" on public.fact_posts_daily
  for select to authenticated using (tenant_id in (select user_tenant_ids()));

create table if not exists public.saved_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  source text not null check (source in ('tasks','posts')),
  metrics jsonb not null default '[]'::jsonb,
  dimensions jsonb not null default '[]'::jsonb,
  filters jsonb not null default '{}'::jsonb,
  chart_type text not null default 'bar',
  is_favorite boolean not null default false,
  created_by uuid, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_saved_reports_tenant on public.saved_reports(tenant_id);
alter table public.saved_reports enable row level security;
create policy "tenant members read saved_reports" on public.saved_reports
  for select to authenticated using (tenant_id in (select user_tenant_ids()));
create policy "tenant members write saved_reports" on public.saved_reports
  for all to authenticated using (tenant_id in (select user_tenant_ids()))
  with check (tenant_id in (select user_tenant_ids()));
create trigger trg_saved_reports_updated before update on public.saved_reports
  for each row execute function public.touch_updated_at();

create table if not exists public.report_schedules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  report_id uuid not null references public.saved_reports(id) on delete cascade,
  cadence text not null check (cadence in ('daily','weekly','monthly')),
  recipients text[] not null default '{}',
  next_run_at timestamptz, last_run_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.report_schedules enable row level security;
create policy "tenant members manage report_schedules" on public.report_schedules
  for all to authenticated using (tenant_id in (select user_tenant_ids()))
  with check (tenant_id in (select user_tenant_ids()));

create table if not exists public.metric_anomalies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  detected_at timestamptz not null default now(),
  source text not null,
  metric text not null,
  dimension_key text, dimension_value text,
  expected numeric not null, observed numeric not null,
  delta_pct numeric not null,
  severity text not null check (severity in ('info','warning','critical')),
  explanation text, suggested_action text,
  status text not null default 'open' check (status in ('open','ack','dismissed')),
  acknowledged_by uuid, acknowledged_at timestamptz
);
create index if not exists idx_anomalies_tenant_detected on public.metric_anomalies(tenant_id, detected_at desc);
alter table public.metric_anomalies enable row level security;
create policy "tenant members read anomalies" on public.metric_anomalies
  for select to authenticated using (tenant_id in (select user_tenant_ids()));
create policy "tenant members update anomalies" on public.metric_anomalies
  for update to authenticated using (tenant_id in (select user_tenant_ids()));

create or replace function public.refresh_warehouse(_tenant uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_from date := (current_date - interval '90 days')::date;
  v_tasks int; v_posts int;
begin
  if _tenant not in (select user_tenant_ids()) then raise exception 'access denied'; end if;
  delete from public.fact_tasks_daily where tenant_id = _tenant and d >= v_from;
  insert into public.fact_tasks_daily
    (tenant_id, d, squad_id, project_id, assignee_id, type_id,
     created_count, done_count, overdue_count, spent_minutes, estimate_minutes)
  select t.tenant_id,
         coalesce(t.done_at::date, t.created_at::date) as d,
         p.squad_id, t.project_id, t.assignee_id, t.type_id,
         count(*) filter (where t.created_at::date = coalesce(t.done_at::date, t.created_at::date)),
         count(*) filter (where t.done_at is not null),
         count(*) filter (where t.done_at is null and t.due_at is not null and t.due_at < now()),
         coalesce(sum(t.spent_minutes),0)::int,
         coalesce(sum(t.estimate_minutes),0)::int
    from public.tasks t
    left join public.projects p on p.id = t.project_id
   where t.tenant_id = _tenant
     and coalesce(t.done_at::date, t.created_at::date) >= v_from
   group by 1,2,3,4,5,6;
  get diagnostics v_tasks = row_count;

  delete from public.fact_posts_daily where tenant_id = _tenant and d >= v_from;
  insert into public.fact_posts_daily
    (tenant_id, d, channel, campaign_id, posts_published, reach, impressions, likes, comments, shares, saves, clicks)
  select t.tenant_id,
         coalesce(t.published_at::date, m.collected_at::date) as d,
         t.social_channel::text,
         t.social_campaign_id,
         count(distinct t.id) filter (where t.publish_state = 'published'),
         coalesce(sum(m.reach),0)::int, coalesce(sum(m.impressions),0)::int,
         coalesce(sum(m.likes),0)::int, coalesce(sum(m.comments),0)::int,
         coalesce(sum(m.shares),0)::int, coalesce(sum(m.saves),0)::int,
         coalesce(sum(m.clicks),0)::int
    from public.tasks t
    left join public.post_metrics m on m.task_id = t.id
   where t.tenant_id = _tenant and t.social_channel is not null
     and coalesce(t.published_at::date, m.collected_at::date) >= v_from
   group by 1,2,3,4;
  get diagnostics v_posts = row_count;

  return jsonb_build_object('tasks_rows', v_tasks, 'posts_rows', v_posts, 'refreshed_at', now());
end; $$;
revoke execute on function public.refresh_warehouse(uuid) from anon;

create or replace function public.run_report(_report_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_r public.saved_reports;
  v_sql text; v_dim_cols text; v_metric_cols text;
  v_where text := ''; v_rows jsonb; v_table text;
begin
  select * into v_r from public.saved_reports where id = _report_id;
  if v_r.id is null then raise exception 'report not found'; end if;
  if v_r.tenant_id not in (select user_tenant_ids()) then raise exception 'access denied'; end if;

  v_table := case when v_r.source = 'posts' then 'public.fact_posts_daily' else 'public.fact_tasks_daily' end;

  if v_r.source = 'tasks' then
    v_dim_cols := (select string_agg(quote_ident(x), ',') from jsonb_array_elements_text(v_r.dimensions) x
                    where x in ('d','squad_id','project_id','assignee_id','type_id'));
    v_metric_cols := (select string_agg('sum('||quote_ident(x)||') as '||quote_ident(x), ',')
                       from jsonb_array_elements_text(v_r.metrics) x
                       where x in ('created_count','done_count','overdue_count','spent_minutes','estimate_minutes'));
  else
    v_dim_cols := (select string_agg(quote_ident(x), ',') from jsonb_array_elements_text(v_r.dimensions) x
                    where x in ('d','channel','campaign_id'));
    v_metric_cols := (select string_agg('sum('||quote_ident(x)||') as '||quote_ident(x), ',')
                       from jsonb_array_elements_text(v_r.metrics) x
                       where x in ('posts_published','reach','impressions','likes','comments','shares','saves','clicks'));
  end if;

  if v_dim_cols is null then v_dim_cols := 'd'; end if;
  if v_metric_cols is null then v_metric_cols := 'count(*) as total'; end if;

  if (v_r.filters ? 'date_from') then v_where := v_where || format(' and d >= %L', v_r.filters->>'date_from'); end if;
  if (v_r.filters ? 'date_to')   then v_where := v_where || format(' and d <= %L', v_r.filters->>'date_to');   end if;

  v_sql := format(
    'select coalesce(jsonb_agg(row_to_json(t)), ''[]''::jsonb) from (
       select %s, %s from %s where tenant_id = %L %s
       group by %s order by %s limit 1000
     ) t',
    v_dim_cols, v_metric_cols, v_table, v_r.tenant_id, v_where, v_dim_cols, v_dim_cols
  );

  execute v_sql into v_rows;
  return jsonb_build_object('rows', v_rows, 'name', v_r.name, 'chart_type', v_r.chart_type);
end; $$;
revoke execute on function public.run_report(uuid) from anon;

create or replace function public.detect_anomalies(_tenant uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_count int := 0; r record; v_sev text; v_delta numeric;
begin
  if _tenant not in (select user_tenant_ids()) then raise exception 'access denied'; end if;

  for r in
    with last7 as (
      select sum(done_count)::numeric/7 as avg_recent
      from public.fact_tasks_daily where tenant_id = _tenant and d >= current_date - 7 and d < current_date
    ),
    base30 as (
      select sum(done_count)::numeric/30 as avg_base
      from public.fact_tasks_daily where tenant_id = _tenant and d >= current_date - 37 and d < current_date - 7
    )
    select last7.avg_recent, base30.avg_base from last7, base30
  loop
    if r.avg_base is not null and r.avg_base > 0 then
      v_delta := ((r.avg_recent - r.avg_base) / r.avg_base) * 100;
      if abs(v_delta) >= 25 then
        v_sev := case when abs(v_delta) >= 60 then 'critical' when abs(v_delta) >= 40 then 'warning' else 'info' end;
        insert into public.metric_anomalies(tenant_id, source, metric, expected, observed, delta_pct, severity, suggested_action)
        values (_tenant, 'tasks', 'done_count', round(r.avg_base,2), round(r.avg_recent,2), round(v_delta,1), v_sev,
                case when v_delta < 0 then 'Investigar bloqueios e revisar capacity da semana'
                     else 'Bom! Documente o que mudou para repetir o padrão' end);
        v_count := v_count + 1;
      end if;
    end if;
  end loop;

  for r in
    with last7 as (select sum(overdue_count)::numeric/7 as avg_recent from public.fact_tasks_daily where tenant_id = _tenant and d >= current_date - 7 and d < current_date),
         base30 as (select sum(overdue_count)::numeric/30 as avg_base from public.fact_tasks_daily where tenant_id = _tenant and d >= current_date - 37 and d < current_date - 7)
    select last7.avg_recent, base30.avg_base from last7, base30
  loop
    if r.avg_recent > coalesce(r.avg_base,0) * 1.3 and r.avg_recent >= 2 then
      insert into public.metric_anomalies(tenant_id, source, metric, expected, observed, delta_pct, severity, suggested_action)
      values (_tenant, 'tasks', 'overdue_count', round(coalesce(r.avg_base,0),2), round(r.avg_recent,2),
              round(((r.avg_recent - coalesce(r.avg_base,0)) / nullif(r.avg_base,0)) * 100, 1),
              'warning', 'Pico de tarefas atrasadas — revisar prioridades e SLAs ativos');
      v_count := v_count + 1;
    end if;
  end loop;

  for r in
    with last7 as (select sum(likes+comments+shares+saves)::numeric/7 as avg_recent from public.fact_posts_daily where tenant_id = _tenant and d >= current_date - 7 and d < current_date),
         base30 as (select sum(likes+comments+shares+saves)::numeric/30 as avg_base from public.fact_posts_daily where tenant_id = _tenant and d >= current_date - 37 and d < current_date - 7)
    select last7.avg_recent, base30.avg_base from last7, base30
  loop
    if r.avg_base is not null and r.avg_base > 0 then
      v_delta := ((r.avg_recent - r.avg_base) / r.avg_base) * 100;
      if v_delta <= -25 then
        v_sev := case when v_delta <= -50 then 'critical' when v_delta <= -35 then 'warning' else 'info' end;
        insert into public.metric_anomalies(tenant_id, source, metric, expected, observed, delta_pct, severity, suggested_action)
        values (_tenant, 'posts', 'engagement', round(r.avg_base,2), round(r.avg_recent,2), round(v_delta,1), v_sev,
                'Engajamento social em queda — testar novos formatos e horários da cadência');
        v_count := v_count + 1;
      end if;
    end if;
  end loop;

  return v_count;
end; $$;
revoke execute on function public.detect_anomalies(uuid) from anon;
