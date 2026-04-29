---
name: Schema de dados Supabase
description: Lista completa das tabelas, extensões, triggers, buckets de storage e edge functions do PRD §4
type: feature
---

## Extensões obrigatórias
uuid-ossp, pgcrypto, vector, pg_net, pg_cron, pgmq, pg_trgm, moddatetime

## Tabelas (25+)
tenants, profiles, tenant_members, squads, squad_members, projects, project_members, task_statuses, task_types, tasks, assignment_matrix, tags, task_tags, comments, attachments, time_entries, pomodoros, habits, habit_checkins, recurrences, reminders, demand_forms, demand_submissions, activities, notifications, saved_filters, oauth_connections, task_embeddings, ai_interactions

## Constraints especiais
- uniq_active_timer_per_user: 1 timer ativo por usuário (UNIQUE parcial em time_entries WHERE ended_at IS NULL)
- uniq_active_pomo_per_user: 1 pomodoro ativo por usuário
- tasks: unique(project_id, number) com auto-numeração via trigger
- tasks parent_task_id: até 3 níveis (validar em código, não em DB)

## Triggers obrigatórios
- tg_set_updated_at (genérico em todas tabelas mutáveis)
- tg_set_task_number (auto MKT-123)
- tg_audit_task (insere em activities em insert/update/delete)
- tg_auto_assign_on_status_change (consulta assignment_matrix)
- handle_new_user (cria profile ao registrar em auth.users)

## RLS Helpers
- user_tenant_ids() returns setof uuid (security definer)
- user_role_in_tenant(uuid) returns text
- is_project_member(uuid) returns boolean

## Materialized View
mv_workload_by_user (refresh via pg_cron a cada 5min)

## Buckets de Storage
- attachments (privado, 25MB)
- creatives (privado, 50MB, versionado)
- avatars (read público, 2MB)
- tenant-assets (privado, 10MB)
- exports (privado signed URL, 100MB)

## Roles permitidos
admin, manager, specialist, requester (em tenant_members.role)
owner, editor, commenter, viewer (em project_members.role)
lead, specialist (em squad_members.role_in_squad)
