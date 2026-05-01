-- ===== Step 40: Security hardcore + Marketplace + API tooling =====

-- ---------- Security audit log ----------
create table if not exists public.security_audit (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  severity text not null default 'info' check (severity in ('info','warn','error','critical')),
  ip text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_security_audit_tenant_created on public.security_audit(tenant_id, created_at desc);
create index if not exists idx_security_audit_user_created on public.security_audit(user_id, created_at desc);

alter table public.security_audit enable row level security;

create policy "sa_insert_self" on public.security_audit for insert to authenticated
with check (user_id = auth.uid());

create policy "sa_admin_read_tenant" on public.security_audit for select to authenticated
using (tenant_id is not null and (has_tenant_role(tenant_id, 'admin'::tenant_role) or has_tenant_role(tenant_id, 'manager'::tenant_role)));

create policy "sa_user_read_own" on public.security_audit for select to authenticated
using (user_id = auth.uid());

-- ---------- LGPD/GDPR ----------
create table if not exists public.privacy_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('terms','privacy','marketing','analytics','cookies')),
  granted boolean not null default true,
  version text not null default 'v1',
  ip text,
  user_agent text,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists idx_privacy_consents_user on public.privacy_consents(user_id, kind);

alter table public.privacy_consents enable row level security;

create policy "pc_owner_all" on public.privacy_consents for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('export','delete','rectify')),
  status text not null default 'pending' check (status in ('pending','processing','done','rejected')),
  notes text,
  payload jsonb,
  result_url text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_privacy_requests_user on public.privacy_requests(user_id, created_at desc);

alter table public.privacy_requests enable row level security;

create policy "pr_owner_select" on public.privacy_requests for select to authenticated using (user_id = auth.uid());
create policy "pr_owner_insert" on public.privacy_requests for insert to authenticated with check (user_id = auth.uid());

-- ---------- Personal data export RPC ----------
create or replace function public.export_my_personal_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null then raise exception 'unauthorized'; end if;
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.user_id = uid),
    'tasks_count', (select count(*) from public.tasks where assignee_id = uid),
    'comments_count', (select count(*) from public.task_comments where author_id = uid),
    'consents', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from public.privacy_consents c where c.user_id = uid),
    'requests', (select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) from public.privacy_requests r where r.user_id = uid),
    'exported_at', now()
  ) into result;

  insert into public.privacy_requests (user_id, kind, status, payload, completed_at)
  values (uid, 'export', 'done', result, now());

  insert into public.security_audit (user_id, event, severity, metadata)
  values (uid, 'data_export', 'info', '{"source":"export_my_personal_data"}'::jsonb);

  return result;
end $$;

-- ---------- Marketplace ----------
create table if not exists public.marketplace_templates (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid references auth.users(id) on delete set null,
  source_tenant_id uuid references public.tenants(id) on delete set null,
  name text not null,
  description text,
  category text not null default 'general',
  thumbnail_url text,
  payload jsonb not null,
  is_official boolean not null default false,
  is_public boolean not null default true,
  install_count integer not null default 0,
  rating_avg numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_marketplace_public on public.marketplace_templates(is_public, category);

alter table public.marketplace_templates enable row level security;

create policy "mt_public_read" on public.marketplace_templates for select using (is_public = true);
create policy "mt_author_all" on public.marketplace_templates for all to authenticated
using (author_user_id = auth.uid()) with check (author_user_id = auth.uid());

create table if not exists public.marketplace_installs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.marketplace_templates(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  installed_by uuid references auth.users(id) on delete set null,
  installed_at timestamptz not null default now()
);
create index if not exists idx_marketplace_installs_tenant on public.marketplace_installs(tenant_id);

alter table public.marketplace_installs enable row level security;

create policy "mi_member_read" on public.marketplace_installs for select to authenticated
using (tenant_id in (select user_tenant_ids()));

create policy "mi_self_insert" on public.marketplace_installs for insert to authenticated
with check (installed_by = auth.uid() and tenant_id in (select user_tenant_ids()));

-- RPC: install template
create or replace function public.install_marketplace_template(_template_id uuid, _tenant_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  tpl record;
  new_project uuid;
begin
  if uid is null then raise exception 'unauthorized'; end if;
  if not (has_tenant_role(_tenant_id, 'admin'::tenant_role) or has_tenant_role(_tenant_id, 'manager'::tenant_role)) then
    raise exception 'forbidden';
  end if;

  select * into tpl from public.marketplace_templates where id = _template_id and is_public = true;
  if not found then raise exception 'template not found'; end if;

  insert into public.projects (tenant_id, name, description)
  values (_tenant_id, tpl.name, coalesce(tpl.description,'Instalado do marketplace'))
  returning id into new_project;

  update public.marketplace_templates set install_count = install_count + 1 where id = _template_id;

  insert into public.marketplace_installs (template_id, tenant_id, installed_by)
  values (_template_id, _tenant_id, uid);

  return new_project;
end $$;

-- ---------- API usage telemetry ----------
create table if not exists public.api_usage_events (
  id bigint generated always as identity primary key,
  token_id uuid references public.api_tokens(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete cascade,
  resource text not null,
  method text not null,
  status_code int,
  duration_ms int,
  created_at timestamptz not null default now()
);
create index if not exists idx_api_usage_tenant_created on public.api_usage_events(tenant_id, created_at desc);

alter table public.api_usage_events enable row level security;

create policy "au_admin_read" on public.api_usage_events for select to authenticated
using (has_tenant_role(tenant_id, 'admin'::tenant_role) or has_tenant_role(tenant_id, 'manager'::tenant_role));

-- ---------- Webhooks v2: filter + replay ----------
alter table public.webhooks add column if not exists filter_jsonpath text;

create or replace function public.replay_webhook_delivery(_delivery_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  src record;
  new_id uuid;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  select wd.*, w.tenant_id as w_tenant
    into src
    from public.webhook_deliveries wd
    join public.webhooks w on w.id = wd.webhook_id
    where wd.id = _delivery_id;
  if not found then raise exception 'delivery not found'; end if;

  if not (has_tenant_role(src.w_tenant, 'admin'::tenant_role) or has_tenant_role(src.w_tenant, 'manager'::tenant_role)) then
    raise exception 'forbidden';
  end if;

  insert into public.webhook_deliveries (webhook_id, event, payload, status, attempts)
  values (src.webhook_id, src.event, src.payload, 'pending', 0)
  returning id into new_id;

  return new_id;
end $$;
