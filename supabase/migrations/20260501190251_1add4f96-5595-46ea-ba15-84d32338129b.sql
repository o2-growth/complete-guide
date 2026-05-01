create or replace function public.seed_sample_data(_persona text default 'agencia')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _user uuid := auth.uid();
  _tenant uuid;
  _project uuid;
  _now timestamptz := now();
  _titles text[];
  _t text;
  _i int := 0;
begin
  if _user is null then raise exception 'auth required'; end if;

  select (preferences->>'tenant_id')::uuid into _tenant
  from public.profiles where id = _user;
  if _tenant is null then raise exception 'no tenant'; end if;

  insert into public.projects (tenant_id, name, description, archived)
  values (_tenant, '✨ Projeto exemplo (' || _persona || ')', 'Criado pelo onboarding guiado. Pode arquivar a qualquer momento.', false)
  returning id into _project;

  if _persona = 'agencia' then
    _titles := array[
      'Briefing kickoff cliente',
      'Calendário editorial mensal',
      'Carrossel Instagram — lançamento',
      'Roteiro Reel 30s',
      'Aprovação cliente — campanha Q3',
      'Relatório mensal de performance'
    ];
  elsif _persona = 'freelancer' then
    _titles := array[
      'Proposta comercial — novo cliente',
      'Faturamento do mês',
      'Post de portfólio',
      'Acompanhar pagamentos pendentes'
    ];
  else
    _titles := array[
      'Planejamento sprint',
      'Revisar landing page',
      'Reunião de alinhamento',
      'Atualizar roadmap interno',
      'OKR Q3 — definir KRs'
    ];
  end if;

  foreach _t in array _titles loop
    _i := _i + 1;
    insert into public.tasks (tenant_id, project_id, title, priority, due_at, created_by, reporter_id)
    values (
      _tenant, _project, _t,
      case when _i % 4 = 0 then 'high'::task_priority
           when _i % 3 = 0 then 'medium'::task_priority
           else 'low'::task_priority end,
      _now + (interval '1 day' * _i),
      _user, _user
    );
  end loop;

  return _project;
end;
$$;

grant execute on function public.seed_sample_data(text) to authenticated;

comment on function public.seed_sample_data(text) is
  'Cria projeto exemplo + tarefas de demonstração no tenant atual do usuário (onboarding guiado).';