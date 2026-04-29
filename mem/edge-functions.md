---
name: Edge Functions necessárias
description: 14+ Edge Functions Deno para o backend conforme PRD §4.7
type: feature
---

## Triggered por DB webhook
- notify-assignee — INSERT/UPDATE de tasks com mudança de assignee → email + notification + push
- process-demand-submission — após INSERT em demand_submissions → cria tarefa no projeto-alvo

## Triggered por pg_cron
- send-reminders (a cada 5min) — lê reminders pendentes
- expand-recurrences (a cada hora) — cria próxima ocorrência
- daily-digest (8h dia útil) — email com tarefas do dia
- weekly-leadership-digest (sex 17h) — relatório PDF para liderança
- embed-tasks (a cada 30s, fila pgmq) — gera embeddings
- ai-summarize-week (sex 16h) — resumo de produtividade
- refresh-oauth-tokens — refresh de tokens OAuth

## HTTP autenticado
- ai-chat (streaming)
- ai-generate-copy
- ai-categorize-task
- ai-breakdown
- ai-suggest-reallocation
- ai-efficiency-insight
- meta-publish (pós-MVP)
- linkedin-publish (pós-MVP)
- import-google-calendar

## HTTP público
- webhook-receiver (HMAC SHA256 obrigatório)

## Não confundir
- send-reminders/expand-recurrences/embed-tasks usam pg_cron + pg_net.http_post para invocar a Edge.
