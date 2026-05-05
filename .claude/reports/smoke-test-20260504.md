# Smoke Test Oxy Growth OS — 2026-05-04

**Auth:** OK (signup:qa.cto+1777917309936@oxytest.dev)
**Email novo gerado:** qa.cto+1777917309936@oxytest.dev
**Senha:** OxyTest!2026
**Fallback email:** qa.cto.fixed@oxytest.dev

## Resumo
- Total de rotas testadas: **68**
- OK: **58**
- Quebradas: **0**
- Parciais: **2**
- Mock/demo: **8**

## Tabela de rotas

| Rota | Status | console.error | net 4xx/5xx | Nota | Screenshot |
|---|---|---|---|---|---|
| /app | OK | 0 | 0 | sidebar e topbar visíveis | app-home.png |
| /app | OK | 0 | 0 | ok em 1059ms | inbox.png |
| /app/hoje | OK | 0 | 0 | ok em 1041ms | hoje.png |
| /app/proximos | OK | 0 | 0 | ok em 1041ms | proximos-7.png |
| /app/atrasadas | mock | 0 | 0 | texto sugere placeholder | atrasadas.png |
| /app/atribuidas | mock | 0 | 0 | texto sugere placeholder | atribuidas.png |
| /app/calendario | OK | 0 | 0 | ok em 1041ms | calendario.png |
| /app/kanban | OK | 0 | 0 | ok em 1027ms | kanban.png |
| /app/projetos | OK | 0 | 0 | ok em 1062ms | lista-projetos.png |
| /app/templates | OK | 0 | 0 | ok em 1046ms | templates.png |
| /app/squads | OK | 0 | 0 | ok em 2850ms | squads.png |
| /app/demandas | OK | 0 | 0 | ok em 1045ms | demandas.png |
| /app/aprovacoes | OK | 0 | 0 | ok em 1027ms | aprovacoes.png |
| /app/slas | OK | 0 | 0 | ok em 1033ms | slas.png |
| /app/midias | OK | 0 | 0 | ok em 1034ms | midias-previews.png |
| /app/social | OK | 0 | 0 | ok em 1054ms | calendario-editorial.png |
| /app/social/inbox | mock | 0 | 0 | texto sugere placeholder | inbox-social.png |
| /app/social/cadencia | OK | 0 | 0 | ok em 1043ms | cadencia.png |
| /app/social/studio | OK | 0 | 0 | ok em 1083ms | studio-criativo.png |
| /app/social/pipeline | OK | 0 | 0 | ok em 1026ms | pipeline-producao.png |
| /app/social/intel | OK | 0 | 0 | ok em 1042ms | inteligencia-ia.png |
| /app/social/analytics | OK | 0 | 0 | ok em 1040ms | analytics-social.png |
| /app/campanhas | OK | 0 | 0 | ok em 1048ms | campanhas.png |
| /app/social/boosts | OK | 0 | 0 | ok em 1042ms | boost-manager.png |
| /app/social/creators | OK | 0 | 0 | ok em 1035ms | creators.png |
| /app/social/bio | OK | 0 | 0 | ok em 1029ms | link-in-bio.png |
| /app/biblioteca | OK | 0 | 0 | ok em 1060ms | biblioteca-de-midia.png |
| /app/snippets | OK | 0 | 0 | ok em 1042ms | snippets.png |
| /app/dashboard | OK | 0 | 0 | ok em 1020ms | dashboard.png |
| /app/exec | OK | 0 | 0 | ok em 1036ms | executive.png |
| /app/copilot | OK | 0 | 0 | ok em 1032ms | copilot-ia.png |
| /app/benchmarks | OK | 0 | 0 | ok em 1033ms | benchmarks.png |
| /app/simulacoes | OK | 0 | 0 | ok em 1045ms | simulacoes.png |
| /app/reports | OK | 0 | 0 | ok em 1055ms | report-builder.png |
| /app/forecast | OK | 0 | 1 | ok em 1074ms | forecast-ia.png |
| /app/okrs | OK | 0 | 1 | ok em 1079ms | okrs.png |
| /app/anomalias | OK | 0 | 1 | ok em 1058ms | anomalias.png |
| /app/workload | OK | 0 | 1 | ok em 1035ms | workload.png |
| /app/skills | parcial | 0 | 1 | sem h1/h2 | skills.png |
| /app/capacity | parcial | 0 | 1 | sem h1/h2 | capacity.png |
| /app/foco | OK | 0 | 1 | ok em 1073ms | foco.png |
| /app/genio | OK | 0 | 1 | ok em 1068ms | genio-growth.png |
| /app/ia-proativa | OK | 0 | 1 | ok em 1016ms | ia-proativa.png |
| /app/notificacoes | OK | 0 | 1 | ok em 1043ms | notificacoes.png |
| /app/comecar | mock | 0 | 1 | texto sugere placeholder | comece-aqui.png |
| /app/ajuda | OK | 0 | 1 | ok em 1036ms | ajuda.png |
| /app/conquistas | OK | 0 | 1 | ok em 1058ms | conquistas.png |
| /app/enterprise | OK | 0 | 1 | ok em 1049ms | enterprise.png |
| /app/automacoes | OK | 0 | 1 | ok em 1068ms | automacoes.png |
| /app/automacoes/regras | OK | 0 | 1 | ok em 1047ms | regras-no-code.png |
| /app/workspaces | OK | 0 | 1 | ok em 1040ms | workspaces.png |
| /app/configuracoes/plano | mock | 0 | 1 | texto sugere placeholder | plano-billing.png |
| /app/marketplace | OK | 0 | 1 | ok em 1057ms | marketplace.png |
| /app/developer | OK | 0 | 1 | ok em 1030ms | developer-hub.png |
| /app/buscar | OK | 0 | 1 | ok em 1035ms | busca-global.png |
| /app/configuracoes/dados | OK | 0 | 1 | ok em 1046ms | dados-import-export.png |
| /app/seguranca | OK | 0 | 1 | ok em 1034ms | seguranca-2fa.png |
| /app/configuracoes/privacidade | OK | 0 | 1 | ok em 1024ms | privacidade-lgpd.png |
| /app/admin/saude | OK | 0 | 2 | ok em 1047ms | saude-sistema.png |
| /app/admin/erros | OK | 0 | 1 | ok em 1053ms | erros-admin.png |
| /app/atalhos | OK | 1 | 1 | ok em 1041ms | atalhos.png |
| /app/configuracoes/aparencia | OK | 0 | 1 | ok em 1052ms | aparencia.png |
| /app/configuracoes/idioma | OK | 0 | 1 | ok em 1018ms | idioma.png |
| /app/configuracoes/tipos | OK | 0 | 1 | ok em 1038ms | tipos-de-tarefa.png |
| /app/configuracoes/integracoes | mock | 0 | 1 | texto sugere placeholder | integracoes.png |
| /app/configuracoes/integracoes-externas | mock | 0 | 1 | texto sugere placeholder | integracoes-nativas.png |
| /app/audit | mock | 0 | 2 | texto sugere placeholder | audit-log.png |
| /app/configuracoes | OK | 0 | 1 | ok em 1092ms | configuracoes.png |

## Bugs críticos (rota quebrada / impede uso)

_Nenhum_

## Bugs altos (rota carrega mas tem problema)

- /app/skills (Skills): sem h1/h2. console.errors=0
- /app/capacity (Capacity): sem h1/h2. console.errors=0

## Modo mock/demo confirmado

- /app/atrasadas (Atrasadas): texto sugere placeholder
- /app/atribuidas (Atribuídas): texto sugere placeholder
- /app/social/inbox (Inbox social): texto sugere placeholder
- /app/comecar (Comece aqui): texto sugere placeholder
- /app/configuracoes/plano (Plano & billing): texto sugere placeholder
- /app/configuracoes/integracoes (Integrações): texto sugere placeholder
- /app/configuracoes/integracoes-externas (Integrações nativas): texto sugere placeholder
- /app/audit (Audit log): texto sugere placeholder

## Interações principais

- Auth OK (signup:qa.cto+1777917309936@oxytest.dev).
- Onboarding travou: TimeoutError: click: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: /Concluir e entrar/i })[22m

- QuickAdd /hoje: input enviado mas tarefa não foi visível
- Kanban: 5 elementos coluna detectados
- Calendário: 3 células detectadas
- Novo projeto: submit não confirmou criação
- Novo squad: botão não encontrado
- Gênio chat: mensagem de erro visível
- Notificações: 3 tabs detectadas
- Aparência: botão tema não encontrado
- Idioma: opção alternativa clicável
- Buscar: input não encontrado

## Sugestões pro CTO (padrões agrupados)

### Top falhas de rede agrupadas
- 34× 400 dboftogzjobfvtjaoifh.supabase.co/rest/v1/error_events
- 1× 400 dboftogzjobfvtjaoifh.supabase.co/functions/v1/forecast-metric
- 1× 400 dboftogzjobfvtjaoifh.supabase.co/rest/v1/rpc

### Top erros de console agrupados
- 1× Warning

---
_Gerado por Playwright smoke test em 2026-05-04T17:57:02.379Z_
