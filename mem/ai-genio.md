---
name: IA Gênio Growth
description: Features de IA embarcada, Edge Functions e prompts-mestre em pt-BR
type: feature
---

IMPORTANTE: usar Lovable AI Gateway (modelos google/gemini-* e openai/gpt-*) em vez de OpenAI direto quando possível — o PRD diz OpenAI mas Lovable AI já cobre. Default: google/gemini-2.5-flash (barato/rápido), google/gemini-2.5-pro (pesado).

## Features (8)
- ai-generate-copy: copy de post (LinkedIn/IG/E-mail) — modelo pro
- ai-categorize-task: sugere tipo, prioridade, tags, estimativa — flash
- ai-summarize-week: resumo semanal sex 16h via pg_cron — flash
- ai-breakdown: quebrar em subtarefas — flash
- match_tasks (RPC): busca semântica via embeddings (halfvec 1536, hnsw cosine)
- ai-chat: chat streaming com contexto da tarefa — pro
- ai-suggest-reallocation: sugestões de realocação de workload — flash
- ai-efficiency-insight: análise estimado vs realizado — flash

## Governança
- Rate limit: 50 chamadas/usuário/hora (contagem em ai_interactions)
- Toda interação registrada em ai_interactions (tokens_in, tokens_out, model)
- /admin/ai mostra custo e ranking
- Tom: pt-BR, "você" (não "tu" nem "vós"), nunca usar "consultoria"
