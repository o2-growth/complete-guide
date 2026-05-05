# Diagnóstico — 3 fluxos críticos

> Investigação do CTO → Aria a partir do smoke test `smoke-test-20260504.md`. Sem alterações de código. Todas as referências em paths absolutos e linhas conforme HEAD em 2026-05-04.

Contexto do seletor de smoke test (relevante para BUG-A e BUG-B):
- Modal "Nome": o test usa `page.locator('input[name="name"], input[placeholder*="ome"]').first()` (`e2e/smoke.spec.ts:475` e `:507`).
- Modal QuickAdd: `input[placeholder*="Adicione"], input[placeholder*="tarefa"]…` (`e2e/smoke.spec.ts:419`).

---

## BUG-A Squads

### Causa raiz
O `<Input>` do nome no modal "Criar squad" não tem atributo `name` nem placeholder com a substring `"ome"`. Em `src/pages/app/SquadsPage.tsx:53` o input é apenas `<Input value={name} onChange={...} placeholder="Ex: Squad Performance" />` — sem `name="name"`. O placeholder também não casa com `*="ome"` (case-sensitive em CSS Selector). Como nenhum outro input visível na página `/app/squads` casa com o seletor, `nameInput.isVisible()` retorna `false` e o smoke registra **"Novo squad: campo nome não encontrado"**. Não é regressão funcional — o usuário humano consegue digitar; o defeito é só de testabilidade/semântica.

### Arquivos relevantes
- `/Users/andreylopes/complete-guide/src/pages/app/SquadsPage.tsx:36-87` (componente `CreateSquadDialog`)
- `/Users/andreylopes/complete-guide/src/pages/app/SquadsPage.tsx:53` (Input do nome — sem `name`)
- `/Users/andreylopes/complete-guide/src/hooks/useSquads.tsx:118-141` (`useCreateSquad` — insert OK, invalida `["squads", tenantId]`, sem problema de cache)

### Fix proposto (1 parágrafo)
Adicionar `name="name"` (e idealmente `id="squad-name"` linkado ao `<Label htmlFor>`) no `<Input>` da linha 53 de `SquadsPage.tsx`. Trivial. Nenhuma mudança em hook ou backend é necessária — o fluxo de criação em si (mutation, RLS, invalidate) está correto. Aplicar o mesmo padrão nos outros campos do modal (`name="kind"`, `name="description"`) para futuros smoke tests não regredirem.

---

## BUG-B Projetos

### Causa raiz
**Não é cache nem RLS** — é o mesmo padrão do BUG-A combinado com um falso positivo de seletor. O modal "Criar projeto" em `src/pages/app/ProjectsPage.tsx:18-81` também não tem `name="name"` no input (linha 38). Porém, fora do modal, na própria página, existe um input de busca (`ProjectsPage.tsx:185`) com placeholder `"Buscar por nome ou sigla..."` — substring `"ome"` casa. Com o modal aberto e ambos os inputs visíveis no DOM, `page.locator(...).first()` pega o **input de busca da listagem** (que vem antes na árvore DOM), preenche `"QA Project …"` ali, e em seguida clica no botão "Criar" do modal. Como o input de Nome do modal continua vazio, o botão Criar está com `disabled={!name || !key || create.isPending}` (`ProjectsPage.tsx:67`), o `.click()` falha silenciosamente (smoke usa `.catch(() => {})`), e a página de listagem nem recebe o submit. O smoke então não acha `"QA Project …"` na grade → registra **"submit não confirmou criação"**. O hook `useCreateProject` em si está saudável: `tenant_id` é passado no insert (`useProjects.tsx:108`), `onSuccess` invalida `["projects-list", tenantId]` (linha 119), e o `useQuery` em `useProjects` usa exatamente o mesmo queryKey (linha 33). Cache, RLS e invalidação estão íntegros.

### Arquivos relevantes
- `/Users/andreylopes/complete-guide/src/pages/app/ProjectsPage.tsx:38-46` (Inputs Nome+Sigla sem `name=""`)
- `/Users/andreylopes/complete-guide/src/pages/app/ProjectsPage.tsx:67` (botão Criar com `disabled={!name||!key||...}`)
- `/Users/andreylopes/complete-guide/src/pages/app/ProjectsPage.tsx:185` (input de busca que rouba o seletor `.first()`)
- `/Users/andreylopes/complete-guide/src/hooks/useProjects.tsx:30-69` (queryKey `projects-list`)
- `/Users/andreylopes/complete-guide/src/hooks/useProjects.tsx:100-124` (`useCreateProject` — insert + invalidate corretos)

### Fix proposto (1 parágrafo)
Adicionar `name="name"` no input Nome (`ProjectsPage.tsx:38`) e `name="key"` na sigla (`:45`); opcionalmente trocar o placeholder do input de busca de `"Buscar por nome ou sigla..."` para `"Buscar por nome ou sigla"` ainda não resolve (substring `"ome"` continua), então a correção real é dar o `name=""` certo no campo do modal — uma vez presente, `input[name="name"]` casa primeiro no `,`-separated selector e o smoke encontra o input correto. Trivial e idêntico ao BUG-A. Não tocar em hook nem em RLS — não tem bug ali.

---

## BUG-C QuickAdd

### Causa raiz
**A tarefa É criada com sucesso** — o problema é que ela não cai dentro do filtro de `/app/hoje`. O smoke envia `"Reunião amanhã 14h #marketing"`. O parser `parseQuickAdd` em `src/lib/quick-add-parser.ts:74` chama `chrono.pt.parse(text, refDate, { forwardDate: true })` que reconhece `"amanhã 14h"` como **D+1 14:00** e devolve `dueAt = amanhã 14:00`. A mutation `useQuickAdd` (`src/hooks/useTasks.tsx:102-145`) insere a task no `inboxProjectId` com `tenant_id`, `assignee_id=user.id`, `due_at=amanhã 14:00` — payload completo, com `.select().single()` retornando a row, e `onSuccess` invalida `["tasks"]` em geral (`useTasks.tsx:141`). Tudo certo no caminho do banco. Porém, a smart list `today` em `useTasks.tsx:68-69` filtra `due_at >= startOfToday && due_at <= endOfToday`. Como `due_at` está em **amanhã**, a task não aparece em `/app/hoje` — apareceria em `/app/proximos` (`next7`) ou no Kanban. O smoke verifica `getByText("Reunião amanhã 14h")` em `/hoje` e não encontra → registra falsamente como "tarefa não foi visível". Resumindo: a tarefa existe, o cache invalida, só está em outra smart list por causa da semântica do parser.

### Arquivos relevantes
- `/Users/andreylopes/complete-guide/src/components/tasks/QuickAdd.tsx:24-29` (submit chama `useQuickAdd().mutate`)
- `/Users/andreylopes/complete-guide/src/hooks/useTasks.tsx:102-145` (`useQuickAdd` — insert + invalidate íntegros)
- `/Users/andreylopes/complete-guide/src/hooks/useTasks.tsx:68-69` (filtro `today` por `due_at` no dia)
- `/Users/andreylopes/complete-guide/src/lib/quick-add-parser.ts:74-83` (chrono `forwardDate: true` empurra "amanhã" para D+1)
- `/Users/andreylopes/complete-guide/e2e/smoke.spec.ts:413-439` (asserção do smoke verifica a tarefa só em `/hoje`)

### Fix proposto (1 parágrafo)
Não há bug funcional para corrigir na criação de tarefa. A correção é decidir UX: (a) opção mais conservadora — ajustar o smoke test para verificar a tarefa em `/app/proximos` ou em `/app/inbox` quando a query contém "amanhã"; (b) opção UX — mudar o feedback do `useQuickAdd` para mostrar toast com link "Ver em Próximos 7" quando `due_at` cai fora de hoje, evitando confusão semelhante por usuários reais; (c) se o produto preferir que tudo agendado apareça em "Hoje" até a hora chegar, mudar a smart list `today` para incluir `due_at <= endOfToday` sem floor (mas isso confunde mais ainda). Recomendação: (a) + (b). Nenhuma mudança em insert/RLS/cache.

---

## Resumo executivo

Os três "bugs" são **trivialmente corrigíveis (≤1h no total)** e nenhum exige mudança de schema, RLS ou camada de dados.

- BUG-A e BUG-B são **defeitos de semântica HTML** (faltam atributos `name=""` nos inputs dos modais) — fixes de uma linha cada. BUG-B amplificado por um input de busca homônimo na mesma página.
- BUG-C **não é bug**: a tarefa é criada corretamente, mas vai pra `next7` por conta do `forwardDate: true` do chrono — defeito é da expectativa do smoke test, não do produto. Ajustar o smoke (e opcionalmente um toast informativo).

Total estimado: 30-45 min para fix + commit + re-smoke. Recomendo agrupar A+B em um único PR de "a11y/testabilidade dos modais" e tratar C como ajuste de smoke test em PR separado.
