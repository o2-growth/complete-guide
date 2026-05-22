-- Re-emite a função seed_clickup_spaces (a versão anterior em 20260521180000_
-- não foi aplicada por algum motivo no Lovable e ficou pendente no PGRST schema cache).
-- Esta migration é idempotente e segura de rodar várias vezes.

set search_path = public;

create or replace function public.seed_clickup_spaces(_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _banco uuid;
  _ia uuid;
  _exp uuid;
begin
  if _tenant_id is null then return; end if;

  -- Squads padrão (Banco / IA / Expansão)
  if not exists (select 1 from public.squads where tenant_id = _tenant_id and name = 'Banco de Projetos') then
    insert into public.squads (tenant_id, name, kind, color, description, sort_order)
    values (_tenant_id, 'Banco de Projetos', 'custom', '#0ea5e9', 'Cards do Pipefy e portfólio de projetos', 0);
  end if;
  if not exists (select 1 from public.squads where tenant_id = _tenant_id and kind = 'ia') then
    insert into public.squads (tenant_id, name, kind, color, description, sort_order)
    values (_tenant_id, 'Team IA & Automação', 'ia', '#7c3aed', 'Espaço do time de IA', 1);
  end if;
  if not exists (select 1 from public.squads where tenant_id = _tenant_id and kind = 'expansao') then
    insert into public.squads (tenant_id, name, kind, color, description, sort_order)
    values (_tenant_id, 'Team Expansão', 'expansao', '#10b981', 'Espaço do time de Expansão', 2);
  end if;

  select id into _banco from public.squads
  where tenant_id = _tenant_id and name = 'Banco de Projetos' limit 1;
  select id into _ia from public.squads
  where tenant_id = _tenant_id and kind = 'ia' limit 1;
  select id into _exp from public.squads
  where tenant_id = _tenant_id and kind = 'expansao' limit 1;

  if _banco is null or _ia is null or _exp is null then return; end if;

  -- Espaços root (kind space_root) — keys BANCO/IA/EXP
  insert into public.projects (tenant_id, squad_id, name, key, kind, sort_order, color)
  select _tenant_id, _banco, 'Banco de Projetos', 'BANCO', 'space_root', 0, '#0ea5e9'
  where not exists (
    select 1 from public.projects
    where tenant_id = _tenant_id and squad_id = _banco and kind = 'space_root'
  );

  insert into public.projects (tenant_id, squad_id, name, key, kind, sort_order, color)
  select _tenant_id, _ia, 'Team IA & Automação', 'IA', 'space_root', 0, '#7c3aed'
  where not exists (
    select 1 from public.projects
    where tenant_id = _tenant_id and squad_id = _ia and kind = 'space_root'
  );

  insert into public.projects (tenant_id, squad_id, name, key, kind, sort_order, color)
  select _tenant_id, _exp, 'Team Expansão', 'EXP', 'space_root', 0, '#10b981'
  where not exists (
    select 1 from public.projects
    where tenant_id = _tenant_id and squad_id = _exp and kind = 'space_root'
  );

  -- Pipefy cards órfãos → Banco de Projetos
  update public.projects
  set squad_id = _banco, updated_at = now()
  where tenant_id = _tenant_id
    and pipefy_card_id is not null
    and (squad_id is null or squad_id <> _banco);

  -- Renomeia squad padrão IA antigo ("IA & Automação") pra "Team IA & Automação"
  -- pra bater com a referência do print 5 do usuário. Idempotente — só renomeia
  -- se o nome atual não tem "Team" prefix.
  update public.squads
  set name = 'Team IA & Automação', updated_at = now()
  where tenant_id = _tenant_id
    and kind = 'ia'
    and name = 'IA & Automação';

  update public.squads
  set name = 'Team Expansão', updated_at = now()
  where tenant_id = _tenant_id
    and kind = 'expansao'
    and name = 'Expansão';
end;
$$;

revoke all on function public.seed_clickup_spaces(uuid) from public;
grant execute on function public.seed_clickup_spaces(uuid) to authenticated;

-- Aplica pra TODOS os tenants existentes uma vez.
do $$
declare
  t record;
begin
  for t in select id from public.tenants loop
    perform public.seed_clickup_spaces(t.id);
  end loop;
end $$;
