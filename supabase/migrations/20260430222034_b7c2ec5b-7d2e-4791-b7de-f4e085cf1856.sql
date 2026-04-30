-- Passo 32 (retry, idempotent)

do $$ begin
  create type notification_kind as enum (
    'kr_at_risk', 'anomaly_critical', 'sla_breach_soon', 'deadline_near',
    'task_assigned', 'approval_pending', 'forecast_drop', 'manual'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_channel as enum ('in_app', 'email');
exception when duplicate_object then null; end $$;

create table if not exists public.notification_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  kind notification_kind not null,
  enabled boolean not null default true,
  channels notification_channel[] not null default '{in_app}',
  threshold jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id, kind)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  kind notification_kind not null,
  title text not null,
  body text,
  link text,
  severity text not null default 'info' check (severity in ('info','warning','critical')),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_tenant_idx on public.notifications(tenant_id, created_at desc);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email_digest text not null default 'daily' check (email_digest in ('off','daily','weekly')),
  in_app_enabled boolean not null default true,
  quiet_hours_start int default 22,
  quiet_hours_end int default 8,
  updated_at timestamptz not null default now()
);

alter table public.notification_rules enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "tenant members read rules" on public.notification_rules;
create policy "tenant members read rules" on public.notification_rules
  for select using (tenant_id in (select user_tenant_ids()));
drop policy if exists "tenant members write rules" on public.notification_rules;
create policy "tenant members write rules" on public.notification_rules
  for all using (tenant_id in (select user_tenant_ids()))
  with check (tenant_id in (select user_tenant_ids()));

drop policy if exists "user reads own notifications" on public.notifications;
create policy "user reads own notifications" on public.notifications
  for select using (user_id = auth.uid() or (user_id is null and tenant_id in (select user_tenant_ids())));
drop policy if exists "user updates own notifications" on public.notifications;
create policy "user updates own notifications" on public.notifications
  for update using (user_id = auth.uid());
drop policy if exists "tenant inserts notifications" on public.notifications;
create policy "tenant inserts notifications" on public.notifications
  for insert with check (tenant_id in (select user_tenant_ids()));

drop policy if exists "user reads own prefs" on public.notification_preferences;
create policy "user reads own prefs" on public.notification_preferences
  for select using (user_id = auth.uid());
drop policy if exists "user upserts own prefs" on public.notification_preferences;
create policy "user upserts own prefs" on public.notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.mark_notifications_read(_ids uuid[] default null)
returns int language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if _ids is null then
    update public.notifications set read_at = now()
      where user_id = auth.uid() and read_at is null;
  else
    update public.notifications set read_at = now()
      where user_id = auth.uid() and id = any(_ids) and read_at is null;
  end if;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

create or replace function public.scan_notifications(_tenant uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_count int := 0; r record;
begin
  if _tenant not in (select user_tenant_ids()) then raise exception 'access denied'; end if;

  for r in
    select a.id, a.severity, a.metric, a.delta_pct, a.suggested_action
    from public.metric_anomalies a
    where a.tenant_id = _tenant and a.status = 'open'
      and a.severity in ('critical','warning')
      and a.detected_at >= now() - interval '24 hours'
      and not exists (
        select 1 from public.notifications n
        where n.tenant_id = _tenant and n.kind = 'anomaly_critical'
          and (n.payload->>'anomaly_id')::uuid = a.id
      )
  loop
    insert into public.notifications(tenant_id, user_id, kind, title, body, link, severity, payload)
    select _tenant, tm.user_id, 'anomaly_critical',
           'Anomalia ' || r.severity || ': ' || r.metric,
           coalesce(r.suggested_action, 'Variação de ' || r.delta_pct || '% detectada'),
           '/app/anomalias', r.severity,
           jsonb_build_object('anomaly_id', r.id)
    from public.tenant_members tm
    where tm.tenant_id = _tenant and tm.role in ('admin','manager');
    v_count := v_count + 1;
  end loop;

  for r in
    select g.id as goal_id, g.name
    from public.goals g
    where g.tenant_id = _tenant and g.status = 'at_risk'
      and not exists (
        select 1 from public.notifications n
        where n.tenant_id = _tenant and n.kind = 'kr_at_risk'
          and (n.payload->>'goal_id')::uuid = g.id
          and n.created_at >= now() - interval '7 days'
      )
  loop
    insert into public.notifications(tenant_id, user_id, kind, title, body, link, severity, payload)
    select _tenant, tm.user_id, 'kr_at_risk',
           'KR em risco: ' || r.name,
           'Goal abaixo de 50% do esperado para o período',
           '/app/okrs', 'warning',
           jsonb_build_object('goal_id', r.goal_id)
    from public.tenant_members tm
    where tm.tenant_id = _tenant and tm.role in ('admin','manager');
    v_count := v_count + 1;
  end loop;

  for r in
    select t.id, t.title, t.assignee_id, t.due_at
    from public.tasks t
    where t.tenant_id = _tenant
      and t.assignee_id is not null
      and t.done_at is null
      and t.due_at is not null
      and t.due_at between now() and now() + interval '24 hours'
      and not exists (
        select 1 from public.notifications n
        where n.tenant_id = _tenant and n.kind = 'deadline_near'
          and (n.payload->>'task_id')::uuid = t.id
          and n.created_at >= now() - interval '20 hours'
      )
  loop
    insert into public.notifications(tenant_id, user_id, kind, title, body, link, severity, payload)
    values (_tenant, r.assignee_id, 'deadline_near',
            'Prazo se aproximando: ' || r.title,
            'Vence em ' || to_char(r.due_at, 'DD/MM HH24:MI'),
            '/app', 'warning',
            jsonb_build_object('task_id', r.id));
    v_count := v_count + 1;
  end loop;

  return v_count;
end $$;

create or replace function public.exec_kpis(_tenant uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_done int; v_done_prev int; v_overdue int;
  v_anomalies int; v_at_risk int;
  v_revenue int; v_spent int; v_engagement int;
begin
  if _tenant not in (select user_tenant_ids()) then raise exception 'access denied'; end if;

  select coalesce(sum(done_count),0) into v_done
    from public.fact_tasks_daily where tenant_id = _tenant and d >= current_date - 7;
  select coalesce(sum(done_count),0) into v_done_prev
    from public.fact_tasks_daily where tenant_id = _tenant and d >= current_date - 14 and d < current_date - 7;
  select coalesce(sum(overdue_count),0) into v_overdue
    from public.fact_tasks_daily where tenant_id = _tenant and d = current_date - 1;

  select count(*) into v_anomalies from public.metric_anomalies
    where tenant_id = _tenant and status = 'open';
  select count(*) into v_at_risk from public.goals
    where tenant_id = _tenant and status = 'at_risk';

  select coalesce(sum(revenue_cents),0), coalesce(sum(spent_cents),0)
    into v_revenue, v_spent
    from public.ad_boosts where tenant_id = _tenant;

  select coalesce(sum(likes+comments+shares+saves),0) into v_engagement
    from public.fact_posts_daily where tenant_id = _tenant and d >= current_date - 7;

  return jsonb_build_object(
    'done_7d', v_done,
    'done_prev_7d', v_done_prev,
    'done_delta_pct', case when v_done_prev > 0 then round(((v_done - v_done_prev)::numeric / v_done_prev) * 100, 1) else 0 end,
    'overdue', v_overdue,
    'anomalies_open', v_anomalies,
    'goals_at_risk', v_at_risk,
    'revenue_cents', v_revenue,
    'spent_cents', v_spent,
    'roas', case when v_spent > 0 then round((v_revenue::numeric / v_spent) * 100) / 100 else 0 end,
    'engagement_7d', v_engagement,
    'generated_at', now()
  );
end $$;

create or replace function public.seed_notification_prefs()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notification_preferences(user_id, tenant_id)
  values (new.user_id, new.tenant_id)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists tg_seed_notif_prefs on public.tenant_members;
create trigger tg_seed_notif_prefs after insert on public.tenant_members
  for each row execute function public.seed_notification_prefs();