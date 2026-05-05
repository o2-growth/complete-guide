# Reports do CTO — Oxy Growth OS

Esta pasta é o **diário de bordo do CTO**. Tudo que ele planeja, decide, audita ou registra fica aqui. Não toque nesses arquivos sem passar pela skill CTO (`.claude/skills/cto/SKILL.md`).

## Convenção de nomes

| Arquivo                       | Quando criar / atualizar                          |
|-------------------------------|---------------------------------------------------|
| `audit-initial.md`            | Auditoria de baseline gerada na primeira ativação |
| `audit-functional.md`         | Output do agente Atlas (analyst) na ativação      |
| `audit-architecture.md`       | Output do agente Aria (architect) na ativação     |
| `audit-data.md`               | Output do agente Dara (data-eng) na ativação      |
| `audit-quality.md`            | Output do agente Quinn (qa) na ativação           |
| `plan-YYYYMMDD-<slug>.md`     | Um por fase planejada                             |
| `log-YYYYMMDD.md`             | Diário de execução do dia                         |
| `decisions.md`                | Decision log único — uma entrada por decisão      |
| `backlog.md`                  | Débitos técnicos e melhorias detectadas           |

## Como o CTO opera

1. Recebe missão do CEO (Orion) ou do usuário.
2. Garante que existe um `audit-initial.md` recente — se não, dispara auditoria.
3. Cria `plan-YYYYMMDD-<slug>.md` para a fase em questão.
4. Pede aprovação do CEO/usuário antes de disparar a primeira task.
5. Delega via Task tool (subagent_type general-purpose) com persona injetada.
6. Recebe entrega, **testa**, registra resultado em `log-YYYYMMDD.md`.
7. Falhou → cria task de correção (anota em `log` + aponta no `backlog` se for sintoma de algo maior).
8. Passou → marca critério como concluído. Quando todos os critérios da fase fecham, atualiza `mem/roadmap.md` (1 linha) e **espera aprovação** para a próxima fase.

## Arquivos imutáveis (não mexer)

- `mem/index.md`, `mem/schema.md`, `mem/edge-functions.md`, `mem/ai-genio.md`, `mem/task-types-seed.md` — memória estável do produto.
- `CLAUDE.md` raiz — só o CEO autoriza alteração.

## Arquivos editáveis pelo CTO

- Qualquer `.md` desta pasta `.claude/reports/`
- `mem/roadmap.md` — APENAS no fechamento de fase, adicionando 1 linha resumo.
