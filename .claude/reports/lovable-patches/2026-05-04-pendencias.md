# Pendências para o Editor do Lovable Cloud

> Lista mínima de itens que **precisam ser ajustados dentro do Lovable** porque envolvem secrets, Edge Functions ou schema do banco. Cada item: sintoma + diagnóstico + ação no Lovable + como validar.

## Origem

Smoke test E2E executado em 2026-05-04 (relatório `smoke-test-20260504.md`). Apenas LV-03 ficou pendente — LV-01 e LV-02 foram resolvidos no frontend e estão fechados.

---

## LV-03 — `/app/genio` falha ao enviar prompt no chat IA

### Sintoma
No smoke test, ao enviar mensagem no Gênio (`/app/genio`), aparece mensagem de erro visível na UI. A Edge Function `ai-chat` é chamada via `${VITE_SUPABASE_URL}/functions/v1/ai-chat` (`src/hooks/useAIChat.tsx:14`) e retorna falha.

### Diagnóstico provável

A Edge Function `supabase/functions/ai-chat/index.ts` está deployada (visível no espelho do repo). A causa quase certa é uma destas:

1. **Secret do Lovable AI Gateway não configurado** — falta `LOVABLE_API_KEY` (ou variável equivalente que a função lê) em **Lovable Cloud → Project → Edge Function Secrets**.
2. **Rate limit estourado** no AI Gateway (improvável neste momento — workspace recém-criado).
3. **Modelo solicitado indisponível** — a função pode estar pedindo `google/gemini-2.5-flash` ou `google/gemini-2.5-pro` e o Gateway não estar habilitando esse modelo neste projeto.

### Ação no Lovable

1. Abrir o projeto Lovable do Oxy Growth OS.
2. Ir em **Edge Functions → `ai-chat`** e clicar em **Logs** (ou no painel de observabilidade do Supabase, em **Functions → Logs**).
3. Filtrar pelos últimos 30 minutos e procurar a chamada do smoke (timestamp aproximado: 13h00 BRT de 2026-05-04). Anotar a mensagem de erro real (401? 429? 500?).
4. Confirmar que existe o secret `LOVABLE_API_KEY` (ou o nome que a função usa — abrir o `index.ts` da função no editor do Lovable e ver `Deno.env.get("...")`):
   - Lovable Cloud → **Settings → Edge Function Secrets**.
   - Se faltar, **Add secret** com a chave do Lovable AI Gateway.
5. Salvar e redeployar a função (botão **Deploy** dentro da Edge Function).
6. (Opcional) Repetir o mesmo check para `ai-categorize-task`, `ai-breakdown`, `ai-generate-copy`, `ai-content-brief`, `ai-generate-image`, `copilot-chat`, `daily-summary`, `exec-briefing`, `forecast-metric`, `scorecard-monthly`, `what-if-simulate`, `detect-anomalies` — todas dependem do mesmo gateway.

### Como validar

Após o ajuste:
1. Abrir `/app/genio` na app de produção (Lovable preview ou domínio).
2. Enviar prompt curto: `"Liste 3 ideias de posts para LinkedIn sobre produtividade."`.
3. Esperar até 10 s. Streaming deve começar token-a-token.
4. Conferir registro em `ai_interactions` (deve haver linha nova com `model`, `tokens_in`, `tokens_out`).

### Status no backlog
`LV-03` → `aberto (lovable)`. Promover para `resolvido` após o teste acima passar.

---

## LV-01 e LV-02 — RESOLVIDOS NO FRONTEND (2026-05-04)

Originalmente classificados como `[lovable]`, mas após análise foram corrigidos no frontend:

| ID | Era | Resolução real |
|----|-----|----------------|
| **LV-01** `health_snapshot` 400 | Suspeita de função não deployada | Era `RAISE EXCEPTION 'forbidden'` quando user não é admin/manager. `useHealthSnapshot` agora retorna `{ forbidden: true }` em vez de propagar erro; `AdminHealthPage` mostra empty state amigável. Função SQL está **correta** no Lovable (verificado em migration `20260501153621_*.sql:64`). Nenhuma ação no Lovable. |
| **LV-02** Relacionamento `tenant_members → profiles` 400 | Suspeita de FK não declarada | A query `tenant_members?select=user_id,profiles:user_id(...)` falhava porque PostgREST não infere relacionamento entre `tenant_members.user_id` e `profiles.id`. `useAuditActors` agora faz 2 queries separadas (mesmo padrão usado em `useAuditLog`). Sem mudança de schema. |

> Se quiser, no Lovable, declarar a FK `tenant_members.user_id → profiles.id` resolve o problema "para sempre" e permite usar joins relacionais em outras queries futuras. **Opcional** — o frontend já está OK sem isso.

```sql
-- Patch OPCIONAL no Lovable, só se quiser permitir joins relacionais:
ALTER TABLE public.tenant_members
  DROP CONSTRAINT IF EXISTS tenant_members_user_id_profiles_fkey;
ALTER TABLE public.tenant_members
  ADD CONSTRAINT tenant_members_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

> Atenção: só rode esse patch se `profiles.id` for PK (verificar primeiro com `\d profiles` no SQL editor do Lovable). Se a PK for outra coluna, ajuste o REFERENCES.

---

## Resumo

| ID | Status | Onde |
|----|--------|------|
| LV-01 | resolvido (frontend) | `useAdminObservability.tsx`, `AdminHealthPage.tsx` |
| LV-02 | resolvido (frontend) | `useAuditLog.tsx` |
| LV-03 | aberto (lovable) | configurar secret `LOVABLE_API_KEY` em Edge Function Secrets |

Patch opcional disponível para LV-02 caso queira FK explícita.
