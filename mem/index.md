# Project Memory — Oxy Growth OS

## Core
Produto: Oxy Growth OS — ferramenta interna O2 Inc. (TickTick + Ekyte adaptado para time de Growth).
Idioma único: pt-BR em UI, copy, mensagens de erro, seed e comentários.
PROIBIDO usar a palavra "consultoria" em qualquer lugar (UI, schema, copy, comentários). Usar "assessoria", "atendimento", "serviço" ou "acompanhamento".
Hierarquia: Tenant (O2 Inc.) > Squad (IA & Automação / Marketing / Expansão) > Projeto > Tarefa. Multi-tenant via tenant_id em toda tabela; RLS sempre habilitado.
Stack fixa: React 18 + Vite + TS + Tailwind + shadcn/ui + Radix + lucide-react + sonner + react-hook-form + zod + @tanstack/react-query v5 + react-router-dom v6 + @dnd-kit + recharts + @tiptap/react + date-fns + react-hotkeys-hook + cmdk. Backend: Lovable Cloud apenas.
Cores marca O2: azul Oxy #0EA5E9 (primary), dourado #FCD34D (accent). Squads: IA #7c3aed, Marketing #ef4444, Expansão #10b981.
Realtime via Broadcast com triggers (NÃO Postgres Changes) — canal tenant:{id}.
Postgres: toda função usa set search_path = public; security definer só quando necessário; usar (select auth.uid()) em policies.
Mobile-first: Sheet no mobile, Dialog no desktop. PWA (sem app nativo).
Papéis: admin, manager, specialist, requester (sem licença, só /solicitar e /aprovar).
Terminar cada resposta perguntando se o usuário quer ajustar algo antes de prosseguir.

## Memories
- [Roadmap de fases](mem://roadmap) — 16 passos sequenciais conforme PRD §14, executar um por vez
- [Schema de dados](mem://schema) — 25+ tabelas, extensões, triggers, RLS, mv_workload, buckets
- [Tipos de tarefa seed](mem://task-types-seed) — 9 tipos obrigatórios
- [IA Gênio Growth](mem://ai-genio) — features, modelos, prompts-mestre em pt-BR
- [Edge Functions](mem://edge-functions) — 14 funções planejadas
