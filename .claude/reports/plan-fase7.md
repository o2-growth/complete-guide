# Plano Fase 7 — Coerência interna + Notion + ClickUp parity

> Autor: CTO. Data: 2026-05-05. Status: **execução autônoma autorizada**.
>
> Base: `coerencia-sistemica.md` (13 gaps internos) + `competitive-analysis/notion-clickup/` (10 features matadoras).

## Sub-fases

| # | Foco | Tempo | Onde | Prioridade |
|---|------|------:|------|-----------:|
| 7A | Fechar 5 gaps críticos de coerência (workload picker + assignee select + estimate default + notif task_assigned) | 1-2d | FE + 1 trigger Lovable | **P0** |
| 7B | Custom Fields em tasks (schema dinâmico) | 3-5d | FE + schema Lovable | **P0** |
| 7C | Time Tracking nativo embutido em task | 2-3d | FE + 1 col billable Lovable | P1 |
| 7D | Workload view + Goals upgrade (Targets tipados) | 2-3d | FE | P1 |
| 7E | Whiteboard com tldraw | 2-3d | FE + schema Lovable | P1 |
| 7F | Dashboards customizáveis (canvas widgets) | 2-3d | FE + schema Lovable | P2 |
| 7G | Smart Lists v2 com `react-querybuilder` | 1-2d | FE | P2 |
| 7H | Inline databases em wiki + Gallery view + Chart view | 3-4d | FE (depende de 7B) | P2 |
| 7I | Automations engine visual | 3-5d | FE + schema Lovable | P2 |
| 7J | Spaces (decidir se squad já cobre) | 1d analysis | — | P3 |

## Ordem de execução

1. **7A** (fix gaps críticos — base do produto)
2. **7B + 7C + 7E** em paralelo (independentes)
3. **7D** após 7A pronto
4. **7G** independente
5. **7H** após 7B
6. **7F + 7I** depois (alto valor mas não bloqueante)
7. **7J** análise (provavelmente skip se squad cobrir)

## Critérios de saída global

- Todos os 5 gaps P0 da auditoria fechados
- Custom Fields, Whiteboard, Time Tracking, Workload, Smart Lists v2 entregues
- Bundle ≤ +400 KB gzip total vs estado pós-Fase 6
- Cobertura testes ≥ 50% nos hooks novos
- Smoke E2E continua 0 quebradas
