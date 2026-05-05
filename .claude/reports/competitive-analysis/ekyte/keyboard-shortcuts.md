# Atalhos de teclado — Ekyte

> Status: **não confirmado nesta passada**. Tentamos `?` e `Shift+?` no contexto do dashboard pós-login; nenhum modal de help apareceu (screenshots `15-shortcuts-question.png` e `15-shortcuts-shiftQ.png` mostram o dashboard inalterado).

## Hipóteses para próxima sessão

- O Ekyte pode não publicar uma palette de atalhos visível ao usuário (não vimos botão "Atalhos" no top-nav nem rodapé).
- Pode requerer estar dentro de um contexto específico (por exemplo, com um card de tarefa aberto) — testar `?` com a sheet de tarefa em foco.
- Pode usar `Cmd+/` (padrão Slack/Notion) — testar.
- Pode ter painel de atalhos só na página `Ajuda` (top-nav). Vale carregar `https://app.ekyte.com/#/ajuda` ou similar e procurar.

## Atalhos especulados a partir do design

Nenhum atalho foi confirmado. Com base na convenção do mercado, sugiro testar:

| Tecla | Ação suspeita |
|---|---|
| `Cmd+K` / `Ctrl+K` | Command palette / busca global (ícone de lupa visível na top-nav) |
| `N` | Nova tarefa (corresponde ao botão `+`) |
| `T` | Iniciar timer (botão laranja na top-nav) |
| `G` depois `T` | Ir para Tarefas (padrão Linear/GitHub) |
| `Esc` | Fechar modal/sheet |

## Recomendação

Em vez de copiar atalhos hipotéticos, manter o investimento atual do Oxy (`/app/atalhos` já entregue na Fase de Onboarding) e oferecer **Cmd+K como command palette** — é gap real visto no Ekyte (eles têm busca via lupa, não palette com teclado).
