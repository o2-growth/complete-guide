# Decision Log — Oxy Growth OS

Registro cronológico de decisões arquiteturais e de processo. Uma entrada por decisão. Nunca remova entradas — se uma decisão for revertida, adicione nova entrada citando a anterior.

## Formato

```
## YYYY-MM-DD — <título curto>
**Contexto**: <o que estava em jogo>
**Decisão**: <o que foi decidido>
**Alternativas consideradas**: <o que foi descartado e por quê>
**Impacto**: <o que muda no código / processo>
**Decisor**: <CEO | CTO | agente + nome>
```

---

## 2026-05-04 — Bootstrap da estrutura de orquestração CTO

**Contexto**: Repositório recém-clonado pelo Andrey (CEO), produto com roadmap 43/43 entregue. Necessidade de uma camada de governança técnica para conduzir o polimento até virar best-in-class.

**Decisão**:
- Adotado modelo CEO (Orion) → CTO (skill local) → Squad executor.
- CTO é o único orquestrador deste repo. Todo trabalho de código passa por ele.
- CTO não executa código de produto — apenas verifica e cria tasks de correção.
- Plano só anda com aprovação do CEO/usuário a cada fase.
- Criados: `CLAUDE.md` raiz (guia para Claudes futuras) + `.claude/skills/cto/SKILL.md` (persona CTO) + `.claude/reports/` (diário de bordo).

**Alternativas consideradas**:
- Usar diretamente os agentes globais (Dex, Quinn etc.) sem camada CTO → descartado: faltaria controle de qualidade entre entregas e o squad ficaria sem ponto único de coordenação.
- Colocar persona do CTO num agente global em `~/.claude/agents/` → descartado: a missão é específica deste produto; faz sentido ser skill local.

**Impacto**: Daqui para frente, qualquer Claude Code aberto neste repo carrega o `CLAUDE.md` automaticamente e sabe que existe o CTO. CEO delega missão → CTO planeja e executa o ciclo.

**Decisor**: Andrey (usuário/CEO real) + Orion (CEO agente) na sessão de bootstrap.

---

## 2026-05-04 — Foco da Fase 1: bugs funcionais primeiro, segurança por último

**Contexto**: Andrey (CEO) reportou ao testar a plataforma que há **vários botões e páginas que não funcionam**. Ao mesmo tempo, lembrou que o backend é **Lovable Cloud** — `supabase/migrations/` e `supabase/functions/` são editadas no editor do Lovable, não neste repo.

**Decisão**:
- A Fase 1 do CTO **não** será mais "Segurança emergencial". Vira **Sweep funcional**: mapear e corrigir todos os botões mortos, formulários sem submit, mutations sem feedback, navegações quebradas, páginas placeholder e handlers vazios no frontend.
- Itens de segurança (RLS, Realtime via Broadcast, `set search_path`, RLS) ficam para a **última fase** e serão tratados via Lovable Cloud (não via edição direta no repo).
- Edge functions e migrations: **nenhuma edição direta neste repo**. Itens que dependem deles entram no `backlog.md` com tag `[lovable]` para serem aplicados depois pelo Andrey no Lovable.

**Alternativas consideradas**:
- Manter ordem original (segurança primeiro) — descartado: o CEO precisa do produto **funcional** antes de polir segurança, e mudanças de RLS dependem do Lovable.
- Misturar bugs e segurança na Fase 1 — descartado: agentes ficam confusos com escopo misto; melhor uma fase por foco.

**Impacto**: SKILL CTO segue o mesmo protocolo, só muda a priorização. Próximo plano (`plan-20260504-fase1-bugs-funcionais.md`) é todo frontend.

**Decisor**: Andrey (CEO real) → Orion → CTO.
