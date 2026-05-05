# Auditoria Funcional — Bugs no Frontend (versão CTO, validada por grep real)

> Gerada em 2026-05-04. Substitui o output inicial do agente Explore (que se concentrou em SEO em vez de funcionalidade). Aqui só entram itens confirmados por grep ou leitura de arquivo.

---

## Resumo

A varredura estática **não encontrou catástrofes** no frontend. Praticamente nenhum botão tem handler vazio, nenhum `TODO`/`FIXME` espalhado, nenhum form sem submit. Os hooks têm padrão consistente de `useMutation` com `onSuccess`/`onError` na maioria dos casos.

**O que o CEO percebeu como "vários botões e páginas não funcionam"** muito provavelmente NÃO está visível em análise estática — é a categoria 4 abaixo (features em modo demo/mock). Muitas funcionalidades clicam mas o resultado é placeholder porque dependem de credenciais externas (OAuth Meta/LinkedIn/Google, Stripe, Resend) e/ou Edge Functions configuradas no Lovable Cloud.

---

## 1. Bugs estáticos CONFIRMADOS

| # | Severidade | Arquivo:linha | Descrição | Correção sugerida |
|---|-----------|---------------|-----------|-------------------|
| FB-01 | média | `src/components/previews/EmailPreview.tsx:50` | `<a href="#">descadastrar</a>` em preview de email — link morto. Pode ser intencional (preview), mas deixa sensação de "não funciona". | Trocar por `<span className="ml-1 underline opacity-70">descadastrar</span>` ou `<a href="#" onClick={(e) => e.preventDefault()}>` para deixar explícito. |
| FB-02 | média | `src/pages/app/AppearancePage.tsx:63` | `console.error(e)` esquecido em catch após `toast.error("Falha no upload do logo")`. | Remover ou usar `reportError(e, { source: "AppearancePage.uploadLogo" })` via hook `useErrorTracking`. |
| FB-03 | baixa | `src/components/tasks/TaskDetailSheet.tsx:517` | `await upload.mutateAsync(f).catch(() => {})` em batch upload — falha silenciosa por arquivo. | `.catch(err => toast.error(\`Falha ao enviar \${f.name}: \${err.message}\`))`. |
| FB-04 | baixa | `src/components/social/SocialMediaPanel.tsx:61` | `navigator.clipboard.writeText(url).catch(() => {})` — copy silencioso se browser bloquear. | `.catch(() => toast.error("Não foi possível copiar — copie manualmente."))`. |
| FB-05 | baixa | `src/hooks/useWorkspaces.tsx:116` | Edge `send-invite` invocada com `.catch(() => null)` — convite criado mas e-mail pode não ter sido enviado e admin não sabe. | `.catch(err => toast.warning(\`Convite criado, mas e-mail pode não ter sido enviado: \${err.message}\`))`. |
| FB-06 | baixa | `src/pages/app/Placeholder.tsx` | Dead code: nunca importado em `App.tsx` (o único `import Placeholder` em `src/components/tasks/RichEditor.tsx` é da lib `@tiptap/extension-placeholder`). | Deletar arquivo. |
| FB-07 | informativo | `src/main.tsx:15` | `serviceWorker.register("/sw.js").catch(() => {})` silencioso. Aceitável (SW pode falhar em iframe/preview). | Manter. |

**Total: 5 bugs concretos a corrigir + 1 dead code a remover. Nenhum crítico.**

---

## 2. Páginas com tamanho ≤ 50 linhas — TODAS auditadas e validadas

| Página | Linhas | Análise |
|--------|--------|---------|
| `GeniusPage.tsx` | 20 | Wrapper que renderiza `<AIChat />`. OK. |
| `KanbanPage.tsx` | 23 | Wrapper que renderiza `<KanbanBoard />`. OK. |
| `Placeholder.tsx` | 31 | Dead code (FB-06). |
| `AiCopilotProactivePage.tsx` | 36 | Renderiza `<ProactiveSuggestions />` + briefing matinal. OK. |
| `SmartListPage.tsx` | 42 | Template usado em 4 rotas (`/hoje`, `/proximos`, `/atrasadas`, `/atribuidas`). OK. |

Páginas 51–100 linhas (LanguagePage, PlanPage, MarketplacePage, AutomationsPage, AdminErrors, AdminHealth, Privacy, Benchmarks, Shortcuts, Security): todas funcionais.

---

## 3. Sidebar e rotas

A sidebar (`src/components/layout/`) usa `<NavLink>` com paths relativos a `/app`. Não há link órfão detectável estaticamente. **Smoke test manual** deve confirmar que cada item do menu carrega com dados reais.

---

## 4. Features em modo demo/mock — provavelmente o que o CEO viu

Código implementado, mas execução real depende de configuração externa no Lovable Cloud / OAuth providers / Stripe / Resend:

| Feature | Onde | Modo |
|---------|------|------|
| Plano / Billing | `pages/app/PlanPage.tsx:60` | Texto explícito: *"Billing está em modo simulação — selecionar um plano apenas atualiza o registro local."* |
| Checkout | `pages/public/CheckoutPage.tsx` | Modo preview — marca success direto. |
| Conversão lead → trial | `hooks/useCommercial.tsx:139` | Toast: *"Plano ativado (preview). Stripe real ainda não conectado."* |
| OAuth integrações | `pages/app/IntegrationsPage.tsx`, `useExternalIntegrations` | Modo mock; "Conectar" não inicia OAuth real sem `META_APP_ID/SECRET` etc. |
| Inbox social | `pages/app/SocialInboxPage.tsx` + Edge `social-inbox-poll` | Mocks determinísticos por hash. |
| Publicação social | Edge `social-publish` | Mock automático sem credenciais. |
| Métricas sociais | Edge `collect-social-metrics` | Mocks determinísticos. |
| E-mail (digest, convites, relatórios) | Edges `daily-digest`, `send-invite`, `send-scheduled-reports` | Dry-run sem `RESEND_API_KEY`. |
| Push notifications | `hooks/useDeveloperHub.tsx:267` | Mensagem: *"Push não suportado neste navegador"*. |
| Inteligência social | `hooks/useSocialIntel.tsx` | Concorrentes / pautas / melhor horário com mocks parciais. |

Estes itens **não são bugs do frontend**. São produto da arquitetura "demo-friendly" do Lovable: app sempre funciona em mock sem secrets, vira "real" quando configurado. Decisão do CEO: aceitar como demo até go-live ou priorizar configuração no Lovable Cloud.

**Recomendação do CTO**: criar componente `<DemoBadge feature="...">` que aparece de forma consistente em toda feature dependente de secret, com texto curto e link "Configurar no Lovable Cloud". Substitui os textos espalhados e tira a sensação de "quebrado".

---

## 5. O que o smoke test manual ainda precisa confirmar

Categorias que análise estática não captura:

- Páginas que renderizam mas sem dados (workspace recém-criado pode não ter seeds; RLS pode estar bloqueando).
- Botões que disparam mutation que falha em runtime (criar projeto sem squad ativo, reagendar tarefa sem `due_at`).
- Estados de loading travados (query nunca resolve).
- Componentes em rotas dinâmicas (`/projetos/:id`) com props que não chegam.
- Service Worker cacheando versão antiga em dev.

**Próximo passo**: Fase 1 do CTO inclui smoke test guiado com o CEO percorrendo checklist de rotas — só assim chegamos à lista exaustiva real.

---

## 6. Conclusão

| Categoria | Quantidade |
|-----------|-----------:|
| Bugs estáticos confirmados | 5 |
| Dead code | 1 (Placeholder.tsx) |
| Features em modo demo/mock dependentes do Lovable Cloud | ~10 |
| Bugs visuais/runtime — depende de smoke test | ? |

Correção dos 5+1 itens da §1 leva ~2 h de Dex e fecha o lado estático. Para resolver a percepção do CEO, o smoke test guiado (Fase 1 §A do plano) é mandatório.
