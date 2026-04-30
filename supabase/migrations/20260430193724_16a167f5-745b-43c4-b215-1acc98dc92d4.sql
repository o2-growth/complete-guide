-- ============ CREATORS / UGC ============
create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  handle text,
  email text,
  phone text,
  avatar_url text,
  niche text,
  followers_count int default 0,
  engagement_rate numeric(5,2) default 0,
  notes text,
  tags text[] default '{}',
  status text not null default 'active' check (status in ('active','paused','archived')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_creators_tenant on public.creators(tenant_id);
alter table public.creators enable row level security;
create policy "creators tenant" on public.creators for all
  using (tenant_id in (select user_tenant_ids()))
  with check (tenant_id in (select user_tenant_ids()));
create trigger trg_creators_updated before update on public.creators
  for each row execute function public.set_updated_at();

create table if not exists public.creator_contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  campaign_id uuid references public.social_campaigns(id) on delete set null,
  title text not null,
  scope text,
  rights_start date,
  rights_end date,
  exclusivity boolean default false,
  channels text[] default '{}',
  fee_cents int default 0,
  currency text default 'BRL',
  status text not null default 'draft' check (status in ('draft','active','expired','cancelled')),
  briefing text,
  contract_url text,
  signed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_contracts_tenant on public.creator_contracts(tenant_id);
create index if not exists idx_contracts_creator on public.creator_contracts(creator_id);
alter table public.creator_contracts enable row level security;
create policy "contracts tenant" on public.creator_contracts for all
  using (tenant_id in (select user_tenant_ids()))
  with check (tenant_id in (select user_tenant_ids()));
create trigger trg_contracts_updated before update on public.creator_contracts
  for each row execute function public.set_updated_at();

create table if not exists public.ugc_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  creator_id uuid references public.creators(id) on delete set null,
  inbox_item_id uuid references public.social_inbox_items(id) on delete set null,
  asset_id uuid references public.media_assets(id) on delete set null,
  source_url text,
  caption text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','reposted','archived')),
  rights_ok boolean default false,
  rights_until date,
  reposted_task_id uuid references public.tasks(id) on delete set null,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ugc_tenant on public.ugc_assets(tenant_id);
create index if not exists idx_ugc_status on public.ugc_assets(status);
alter table public.ugc_assets enable row level security;
create policy "ugc tenant" on public.ugc_assets for all
  using (tenant_id in (select user_tenant_ids()))
  with check (tenant_id in (select user_tenant_ids()));
create trigger trg_ugc_updated before update on public.ugc_assets
  for each row execute function public.set_updated_at();

-- ============ BIO PAGES ============
create table if not exists public.bio_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null unique,
  title text not null,
  bio text,
  avatar_url text,
  theme jsonb not null default '{"bg":"#0F172A","fg":"#FFFFFF","accent":"#0EA5E9","button_style":"rounded"}'::jsonb,
  active boolean not null default true,
  views int not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_bio_pages_tenant on public.bio_pages(tenant_id);
alter table public.bio_pages enable row level security;
create policy "bio_pages tenant rw" on public.bio_pages for all
  using (tenant_id in (select user_tenant_ids()))
  with check (tenant_id in (select user_tenant_ids()));
create policy "bio_pages public read active" on public.bio_pages for select
  to anon using (active = true);
create trigger trg_bio_pages_updated before update on public.bio_pages
  for each row execute function public.set_updated_at();

create table if not exists public.bio_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  page_id uuid not null references public.bio_pages(id) on delete cascade,
  label text not null,
  url text not null,
  icon text,
  position numeric not null default 0,
  active boolean not null default true,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  clicks int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_bio_links_page on public.bio_links(page_id, position);
alter table public.bio_links enable row level security;
create policy "bio_links tenant rw" on public.bio_links for all
  using (tenant_id in (select user_tenant_ids()))
  with check (tenant_id in (select user_tenant_ids()));
create policy "bio_links public read active" on public.bio_links for select
  to anon using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );
create trigger trg_bio_links_updated before update on public.bio_links
  for each row execute function public.set_updated_at();

-- ============ LINK CLICKS ============
create table if not exists public.link_clicks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  bio_link_id uuid references public.bio_links(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  campaign_id uuid references public.social_campaigns(id) on delete set null,
  channel text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referer text,
  user_agent text,
  country text,
  device text,
  clicked_at timestamptz not null default now()
);
create index if not exists idx_clicks_tenant_time on public.link_clicks(tenant_id, clicked_at desc);
create index if not exists idx_clicks_link on public.link_clicks(bio_link_id);
create index if not exists idx_clicks_campaign on public.link_clicks(campaign_id);
alter table public.link_clicks enable row level security;
create policy "clicks tenant read" on public.link_clicks for select
  using (tenant_id in (select user_tenant_ids()));
-- inserts feitos via edge com service role; nada de policy de insert para usuários

-- ============ AD BOOSTS ============
create table if not exists public.ad_boosts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  campaign_id uuid references public.social_campaigns(id) on delete set null,
  channel text not null,
  objective text not null default 'reach' check (objective in ('reach','engagement','traffic','conversions','leads','video_views')),
  budget_cents int not null default 0,
  spent_cents int not null default 0,
  revenue_cents int not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'planned' check (status in ('planned','running','paused','done','cancelled')),
  external_id text,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_boosts_tenant on public.ad_boosts(tenant_id);
create index if not exists idx_boosts_campaign on public.ad_boosts(campaign_id);
alter table public.ad_boosts enable row level security;
create policy "boosts tenant" on public.ad_boosts for all
  using (tenant_id in (select user_tenant_ids()))
  with check (tenant_id in (select user_tenant_ids()));
create trigger trg_boosts_updated before update on public.ad_boosts
  for each row execute function public.set_updated_at();

-- ============ RPCs ============

-- ROAS por campanha
create or replace function public.campaign_roas(_campaign_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_spent int; v_revenue int; v_clicks int;
  v_boosts int; v_running int;
begin
  select tenant_id into v_tenant from public.social_campaigns where id = _campaign_id;
  if v_tenant is null then raise exception 'campanha não encontrada'; end if;
  if v_tenant not in (select user_tenant_ids()) then raise exception 'acesso negado'; end if;

  select coalesce(sum(spent_cents),0), coalesce(sum(revenue_cents),0),
         count(*), count(*) filter (where status='running')
    into v_spent, v_revenue, v_boosts, v_running
  from public.ad_boosts where campaign_id = _campaign_id;

  select count(*) into v_clicks from public.link_clicks where campaign_id = _campaign_id;

  return jsonb_build_object(
    'spent_cents', v_spent,
    'revenue_cents', v_revenue,
    'roas', case when v_spent > 0 then round((v_revenue::numeric / v_spent) * 100) / 100 else 0 end,
    'clicks', v_clicks,
    'cpc_cents', case when v_clicks > 0 then round(v_spent::numeric / v_clicks) else 0 end,
    'boosts_total', v_boosts,
    'boosts_running', v_running
  );
end;
$$;

revoke execute on function public.campaign_roas(uuid) from anon;

-- Recomendar posts para boostar (top engagement nos últimos 30d sem boost ativo)
create or replace function public.recommend_boosts(_tenant uuid, _limit int default 5)
returns table(task_id uuid, title text, channel text, reach int, engagement int, score numeric)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.title, t.social_channel::text,
         coalesce(pm.reach,0),
         coalesce(pm.likes,0)+coalesce(pm.comments,0)+coalesce(pm.shares,0)+coalesce(pm.saves,0),
         (coalesce(pm.likes,0)+coalesce(pm.comments,0)*3+coalesce(pm.shares,0)*4+coalesce(pm.saves,0)*5)::numeric
         / nullif(coalesce(pm.reach,0),0)
  from public.tasks t
  join lateral (
    select * from public.post_metrics m
    where m.task_id = t.id order by collected_at desc limit 1
  ) pm on true
  where t.tenant_id = _tenant
    and t.published_at >= now() - interval '30 days'
    and not exists (
      select 1 from public.ad_boosts b
      where b.task_id = t.id and b.status in ('running','planned')
    )
  order by 6 desc nulls last
  limit _limit;
$$;

revoke execute on function public.recommend_boosts(uuid,int) from anon;

-- Repostar UGC: cria task draft a partir de um ugc_asset
create or replace function public.repost_ugc(_ugc_id uuid, _project_id uuid, _channel social_channel)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ugc public.ugc_assets;
  v_tenant uuid;
  v_task_id uuid;
begin
  select * into v_ugc from public.ugc_assets where id = _ugc_id;
  if v_ugc.id is null then raise exception 'UGC não encontrado'; end if;
  v_tenant := v_ugc.tenant_id;
  if v_tenant not in (select user_tenant_ids()) then raise exception 'acesso negado'; end if;
  if not v_ugc.rights_ok then raise exception 'UGC sem direitos de uso confirmados'; end if;

  insert into public.tasks (tenant_id, project_id, title, social_channel, social_caption, publish_state, created_by)
  values (v_tenant, _project_id, 'Repost UGC: '||coalesce(v_ugc.caption, 'sem legenda'),
          _channel, coalesce(v_ugc.caption,''), 'drafting', auth.uid())
  returning id into v_task_id;

  if v_ugc.asset_id is not null then
    insert into public.task_assets (task_id, asset_id, position)
    values (v_task_id, v_ugc.asset_id, 0)
    on conflict do nothing;
  end if;

  update public.ugc_assets
     set status = 'reposted', reposted_task_id = v_task_id
   where id = _ugc_id;

  return v_task_id;
end;
$$;

revoke execute on function public.repost_ugc(uuid, uuid, social_channel) from anon;