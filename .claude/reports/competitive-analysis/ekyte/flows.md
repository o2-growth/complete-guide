# Fluxos críticos — Ekyte

> Status de captura: maior parte dos fluxos abaixo é **inferida** a partir das telas que conseguimos abrir (dashboard inicial, configurações completa, sub-tela `Equipes e Profissionais`, sidebar lateral de configurações, mobile home). Para fluxos não-confirmados, marcamos `(inferido)` e deixamos os passos previstos para validação na próxima sessão de tour.

URL-base: `https://app.ekyte.com` (SPA com hash routing — todas as rotas internas vivem em `#/...`).

---

## Fluxo 1 — Criar workspace → primeiro projeto → primeira tarefa  *(inferido)*

1. Pós-login cair em `#/home` (dashboard com cards `Meu painel`, `Produtividade`, `Tickets comigo`, `Tarefas comigo`, `Meus apontamentos`, `Notificações`).
2. Clicar na **engrenagem** (segundo ícone da top-nav) → `#/admin` (página de Configurações em cards).
3. Em **Produtividade e Colaboração**, clicar em **Workspaces** → criar novo workspace (nome, squad responsável, tags).
4. Voltar e abrir **Squads** → adicionar squad e atribuir profissionais (vinculados via `Equipes e Profissionais`).
5. Top-nav → **Projetos** → botão `+` → escolher workspace + nome + squad → criar.
6. Dentro do projeto, botão `+` central da top-nav (criação rápida) → escolher **Tipo de Tarefa** (configurável em Configurações → Tipos de Tarefa) → preencher título → atribuir profissional → salvar.
7. A tarefa aparece em **Tarefas** (lista geral) com filtros globais Workspace/Squad/Tags ativados.

**Validar na próxima passada:** se o Workspace exige licenciamento separado, se há limite de profissionais por squad, se "Padrão (padrão)" em workspaces é singleton ou pode ser duplicado.

---

## Fluxo 2 — Criar e publicar post social com aprovação  *(inferido)*

1. Top-nav → **Publicações** (rota provável `#/publications` ou `#/social`).
2. Botão `+` → criação de publicação. Esperado: editor com canais (Instagram, Facebook, LinkedIn, X, etc.), campos de copy, mídia, agendamento, persona-alvo, público-alvo.
3. Persona/Público vêm da seção **Marketing** das Configurações — provavelmente dropdown vinculado.
4. Submeter para **aprovação** — provavelmente dispara fluxo configurado em `Fluxo de Trabalho` (Configurações → Fluxo de Trabalho), atribuindo revisor por papel ("aprovador de Marketing").
5. Aprovador recebe notificação na cabeça do sino, abre a publicação, comenta/aprova/rejeita. Se aprovada, vai para fila de publicação (cron interno do Ekyte).
6. Histórico fica em **Conhecimento** (?) ou em log da própria publicação — não confirmado.

**Validar:** existência de aprovação por link público (paridade com o `/aprovar/:token` do Oxy), preview por canal, tracking UTM automático.

---

## Fluxo 3 — Configurar SLA e ver alerta  *(inferido)*

1. Configurações → **Fluxo de Trabalho**.
2. Tab `FLUXOS DE TRABALHO`. Selecionar fluxo (ex.: fluxo de **Atendimento**).
3. Para cada etapa do fluxo definir **tempo máximo de permanência** (SLA) — provavelmente em horas/dias úteis.
4. Quando uma tarefa/ticket entra na etapa, contador começa. Após estouro, a tarefa ganha badge vermelha + dispara notificação para responsável e líder do squad.
5. Visualizar fila de SLA estourado em **Atendimento** ou em **Data-Driven** (relatórios).

**Não confirmado:** se há política diferente por workspace/squad, se SLA conta horário comercial.

---

## Fluxo 4 — Importar lista de tarefas  *(inferido)*

1. Configurações → **Tipos de Tarefa** (definir se vai usar template existente ou criar tipo novo).
2. Top-nav → **Tarefas** → botão de overflow `...` → "Importar" (provável CSV ou XLSX).
3. Mapear colunas do arquivo para campos Ekyte (título, descrição, responsável, prazo, prioridade, tags, workspace, squad, projeto).
4. Pré-visualizar 5-10 linhas + tratar erros de parsing.
5. Confirmar — Ekyte cria as tarefas em background e abre toast "X tarefas criadas".

**Não confirmado:** formato do CSV de entrada, se aceita anexos via URL, se conserva sub-tarefas.

---

## Fluxo 5 — Compartilhar painel externamente  *(inferido)*

1. Top-nav → **Data-Driven**.
2. Abrir um painel/relatório.
3. Botão "Compartilhar" → opções: link público, exportar PDF, agendar email.
4. Link público gera URL com token (provavelmente `https://app.ekyte.com/share/<token>`) com expiração configurável.
5. Receptor (cliente externo) abre URL, vê dashboard read-only com branding do workspace.

**Não confirmado:** se aceita whitelisting por domínio, se tem watermark anti-prtsc, se mostra dados em tempo real ou snapshot.

---

## Fluxos confirmados nesta passada

### Fluxo confirmado A — Login
1. Acessar `https://app.ekyte.com` → SPA mostra "Carregando..." brevemente → renderiza `#/login`.
2. Card central com logo, título "Bem-vindo ao eKyte", inputs `E-mail profissional` (placeholder "Insira seu e-mail de trabalho") + `Senha` (placeholder "Insira sua senha", com toggle de visibilidade).
3. Link "Esqueci a senha". Botão primário azul "Entrar". Separador "OU". Botão outline azul "Entrar com SSO" (paridade enterprise).
4. Rodapé: "Não tem uma conta? Comece já" + "ekyte.com • Suporte • Termos de uso".
5. Após submit válido, redirect para `#/home` (dashboard).

### Fluxo confirmado B — Configurações
1. Top-nav → ícone de engrenagem → página `#/admin/...` carrega card-grid com 4 seções.
2. Lateral esquerda exibe submenu vertical das mesmas seções para navegação rápida.
3. Subpáginas (ex.: Equipes e Profissionais) abrem com tabs (`FLUXOS DE TRABALHO`, `TIPOS DE TAREFA`, `EQUIPES E PROFISSIONAIS`) compartilhando filtros globais (`Workspace`, `Squad`, `Tags da workspace`, checkbox "Exibir etapas inativas", busca textual).

### Fluxo confirmado C — Mobile
1. Acessar `app.ekyte.com` em viewport 375×812 → mostra tela "Carregando..." com header reduzido (logo + hambúrguer).
2. Não foi possível esperar a hidratação completa nesta passada (timeout curto). Para próxima sessão, aumentar `waitForTimeout` ou usar `page.waitForSelector('main')`.

---

## Próximos passos para fechar os fluxos

- Capturar **abertura do modal de criação rápida** clicando direto no `+` da top-nav por coordenada (`page.mouse.click(802, 24)`).
- Entrar em **Tarefas** (top-nav, span "Tarefas") e capturar lista, kanban, calendário e seletores de view.
- Entrar em **Publicações** e mapear o editor de post social + fluxo de aprovação.
- Entrar em **Data-Driven** para mapear relatórios e exports.
- Entrar em **Atendimento** para mapear tickets, SLA, fila por status.
- Mapear **Conhecimento** (top-nav primeiro item) — pode ser a wiki que o Oxy não tem.
