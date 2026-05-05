# Plano Fase 1 — Sweep funcional

> Autor: CTO. Data: 2026-05-04. Status: **aguardando aprovação do CEO**.
>
> **Foco**: corrigir bugs funcionais e zerar a sensação de "botões/páginas não funcionam". Segurança e RLS ficam para a fase final (e dependem do Lovable Cloud).

---

## Objetivo

Em 3-5 dias úteis, deixar o produto **percebido como funcional em todas as rotas autenticadas**. Itens dependentes do Lovable Cloud (Stripe, Resend, OAuth, Edge Functions com secrets) ganham sinalização visual padronizada (`<DemoBadge>`) em vez de ficarem escondidos com texto inconsistente.

## Critérios de saída (gate de aprovação)

- [ ] Todas as 67 rotas autenticadas percorridas no smoke test, com status registrado.
- [ ] 5 bugs estáticos do `audit-functional-bugs.md` §1 corrigidos e validados (`bunx tsc --noEmit` + `bun run lint` zero erros, `bun run test` verde).
- [ ] Dead code (`src/pages/app/Placeholder.tsx`) deletado.
- [ ] Componente `<DemoBadge>` criado e aplicado nas 7 páginas/áreas em modo mock (PlanPage, CheckoutPage, IntegrationsPage, ExternalIntegrationsPage, SocialInboxPage, useCommercial.tsx, useSocialIntel mocks).
- [ ] Bugs descobertos no smoke test, classificados por severidade e priorizados em `backlog.md`.
- [ ] Bugs críticos identificados pelo CEO no smoke test corrigidos OU registrados como `[lovable]` se forem backend.
- [ ] Build de produção compila (`bun run build`) sem erros.

---

## Tasks da fase

### Task A — Smoke test guiado pelo CEO (sequencial, primeira coisa a rodar)
- **Owner**: Atlas (analyst) prepara o checklist; **CEO Andrey** executa; CTO consolida.
- **Output**: `.claude/reports/smoke-test-20260504.md` — uma linha por rota com status `OK | quebrado | parcial | mock` e nota.
- **Por que primeiro**: CTO precisa da lista REAL de bugs antes de delegar correções. Análise estática mostra que o código está bem; o que o CEO vê precisa ser capturado.
- **Como funciona**: checklist com cada rota de `/app/*` (visões, trabalho, mídias sociais, insights, IA, sistema, configurações), com 4 perguntas para cada:
  1. Carrega sem erro?
  2. Tem dados (não vazia)?
  3. Botões principais funcionam?
  4. Forms submetem com feedback?

### Task B — Correções estáticas óbvias (paralelo, pode rodar enquanto smoke test acontece)
- **Owner**: Dex.
- **Tasks**:
  - FB-01 a FB-05 conforme `audit-functional-bugs.md` §1.
  - FB-06: deletar `src/pages/app/Placeholder.tsx`.
- **Critério**: cada um vira um commit pequeno com mensagem `fix(<área>): <correção>`. Sem refactor lateral.

### Task C — Componente `<DemoBadge>` para modo demo (paralelo com B)
- **Owner**: Uma (UX) desenha + Dex implementa.
- **Output**:
  - Novo componente em `src/components/feedback/DemoBadge.tsx` — props: `feature` (string), `description` (string opcional), `lovableHint` (string opcional explicando o que configurar).
  - Aplicação em 7 lugares (lista no critério de saída).
  - Remover textos espalhados como *"modo simulação"*, *"Stripe real ainda não conectado"* e substituir pelo `<DemoBadge>`.
- **Critério**: visual consistente, único padrão para "isso aqui é demo".

### Task D — Correção dos bugs descobertos no smoke test (sequencial, depende de A)
- **Owner**: Dex (frontend) + CTO classifica.
- **Critério**: cada bug crítico ou alto detectado por A vira um commit isolado. Bugs que dependem de Lovable Cloud (Edge functions, RLS, secrets) entram no `backlog.md` com tag `[lovable]` e ficam para a fase final.

### Task E — Validação final (sequencial, último passo)
- **Owner**: Quinn (QA) + CTO.
- **Critério**: rerun do smoke test pelo CEO confirmando que todos os bugs marcados como críticos/altos foram resolvidos.

---

## Paralelismo

```
Início
  ├─ A (smoke test guiado pelo CEO) ─────────────┐
  ├─ B (5 bugs estáticos) ──┐                    │
  └─ C (<DemoBadge> + 7 aplicações) ──┐          │
                                      │          │
                          B + C done  │          │
                                      │          │
                                       │ A done  │
                                       ▼         ▼
                              D (correções dos achados)
                                      │
                                      ▼
                                  E (validação final)
                                      │
                                      ▼
                              Gate CTO (aprovação)
                                      │
                                      ▼
                              Aprovação CEO → Fase 2
```

## Estimativa

- A: 1 a 2 horas do CEO percorrendo + 30 min do CTO consolidando.
- B: 1 a 2 horas Dex.
- C: 2 a 3 horas Uma + Dex.
- D: variável conforme volume real (estimar após A).
- E: 30 min Quinn + 30 min CEO revalidando.

**Total mínimo**: ~6 h trabalho técnico + 1-2 h do CEO no smoke test.

---

## O que NÃO entra na Fase 1

- Migrations (qualquer mudança em `supabase/migrations/`) — fica para o Lovable.
- Edge Functions (`supabase/functions/`) — fica para o Lovable.
- RLS, `set search_path`, isolamento de tenant — Fase Final (segurança).
- Refactor de páginas grandes (>250L) — Fase 3 (qualidade).
- Cobertura de testes — Fase 3 (qualidade).
- Acessibilidade WCAG — Fase 3 (qualidade).
- Otimização de queries / caching — Fase 2 (performance).

---

## Próxima ação imediata

Aguardando **aprovação do CEO** para:
1. Disparar Atlas para gerar `smoke-test-20260504.md` (checklist das 67 rotas).
2. Em paralelo, disparar Dex para Tasks B + C.
