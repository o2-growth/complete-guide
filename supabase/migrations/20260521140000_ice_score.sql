-- ICE Score (Impact × Confidence × Ease) para priorização de tarefas
-- Cada componente vai de 1 a 10. Score gerado = produto (1..1000).
-- Campos nulos significam "não pontuada" — não entra no ranking.

alter table public.tasks
  add column if not exists ice_impact smallint
    check (ice_impact is null or ice_impact between 1 and 10);

alter table public.tasks
  add column if not exists ice_confidence smallint
    check (ice_confidence is null or ice_confidence between 1 and 10);

alter table public.tasks
  add column if not exists ice_ease smallint
    check (ice_ease is null or ice_ease between 1 and 10);

alter table public.tasks
  add column if not exists ice_score smallint
    generated always as (
      case
        when ice_impact is not null
         and ice_confidence is not null
         and ice_ease is not null
        then ice_impact * ice_confidence * ice_ease
        else null
      end
    ) stored;

create index if not exists tasks_ice_score_idx
  on public.tasks (tenant_id, ice_score desc nulls last)
  where archived = false and ice_score is not null;
