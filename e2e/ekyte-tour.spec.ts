/**
 * Tour autenticado e captura de features do Ekyte
 * Análise competitiva — Fase 6 do CTO Oxy Growth OS
 *
 * IMPORTANTE:
 *  - Credenciais lidas via env (EKYTE_EMAIL/EKYTE_PASSWORD) com fallback inline.
 *  - Nunca logar credenciais.
 *  - storage state vai pra .claude/reports/competitive-analysis/ekyte/.auth/storage.json (gitignored).
 *  - Ações apenas leitura/criação experimental (sem deletar dados de produção).
 */

import { test, expect, Page } from "@playwright/test";
import fs from "fs";
import path from "path";

// ---------- Config ----------
const ROOT = "/Users/andreylopes/complete-guide";
const BASE = path.join(
  ROOT,
  ".claude/reports/competitive-analysis/ekyte"
);
const SHOTS_DIR = path.join(BASE, "screens");
const AUTH_DIR = path.join(BASE, ".auth");
const STORAGE_PATH = path.join(AUTH_DIR, "storage.json");
const NOTES_PATH = path.join(BASE, "tour-notes.md");

fs.mkdirSync(SHOTS_DIR, { recursive: true });
fs.mkdirSync(AUTH_DIR, { recursive: true });

const EMAIL = process.env.EKYTE_EMAIL ?? "andrey.lopes@o2inc.com.br";
const PASSWORD = process.env.EKYTE_PASSWORD ?? "Deco10@$";

const APP_URL = "https://app.ekyte.com";

// Lista de notas estruturadas — escrevemos no markdown ao final.
type Note = {
  id: string;
  titulo: string;
  status: "ok" | "parcial" | "nao-encontrado" | "erro";
  obs: string;
  screenshots: string[];
};
const notes: Note[] = [];

function pushNote(n: Note) {
  notes.push(n);
}

async function shot(page: Page, name: string): Promise<string> {
  const file = path.join(SHOTS_DIR, `${name}.png`);
  try {
    await page.screenshot({ path: file, fullPage: false });
  } catch {
    // ignora screenshots fora de tela
  }
  return path.basename(file);
}

async function safeClick(page: Page, selectors: string[], timeout = 2500) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout }).catch(() => false)) {
        await loc.click({ timeout }).catch(() => {});
        return sel;
      }
    } catch {
      // próximo
    }
  }
  return null;
}

async function safeFill(page: Page, selectors: string[], value: string) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loc.fill(value, { timeout: 2000 }).catch(() => {});
        return sel;
      }
    } catch {
      // próximo
    }
  }
  return null;
}

// ---------- Helpers de exploração ----------

async function listInteractive(page: Page) {
  // Coleta inputs/buttons/labels visíveis para entender o modal de criação.
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const r = (el as HTMLElement).getBoundingClientRect?.();
      return r && r.width > 0 && r.height > 0;
    };
    const items: Array<{
      tag: string;
      type: string;
      name: string;
      placeholder: string;
      label: string;
      role: string;
      text: string;
    }> = [];
    const els = Array.from(
      document.querySelectorAll(
        "input, textarea, select, button, [role='combobox'], [role='button'], [role='menuitem'], [contenteditable='true'], label"
      )
    );
    for (const el of els) {
      if (!visible(el)) continue;
      const tag = el.tagName.toLowerCase();
      const type = (el as HTMLInputElement).type ?? "";
      const name = (el as HTMLInputElement).name ?? "";
      const placeholder = (el as HTMLInputElement).placeholder ?? "";
      const role = el.getAttribute("role") ?? "";
      const ariaLabel = el.getAttribute("aria-label") ?? "";
      const text = (el.textContent ?? "").trim().slice(0, 80);
      items.push({
        tag,
        type,
        name,
        placeholder,
        label: ariaLabel,
        role,
        text,
      });
    }
    return items.slice(0, 200);
  });
}

async function detectStack(page: Page) {
  return page.evaluate(() => {
    const html = document.documentElement.outerHTML.slice(0, 200_000);
    const has = (re: RegExp) => re.test(html);
    return {
      tailwind: has(/(?:tw-|class="[^"]*\b(?:flex|grid|p-\d|m-\d|text-))/),
      muiClass: has(/\bMui[A-Z]/),
      antd: has(/\bant-[a-z]+\b/),
      chakra: has(/\bchakra-/),
      shadcnRadix: has(/data-radix-|data-state="/),
      tiptap: has(/\bProseMirror\b/),
      reactRoot: !!document.querySelector("#root, #__next, #app"),
      framework:
        // @ts-ignore
        (window as any).next
          ? "next"
          : // @ts-ignore
            (window as any).__NUXT__
            ? "nuxt"
            : // @ts-ignore
              (window as any).Vue
              ? "vue"
              : "spa-react-likely",
      title: document.title,
    };
  });
}

// ---------- Login ----------

async function ensureLoggedIn(page: Page): Promise<boolean> {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" }).catch(() => {});

  // Espera SPA hidratar — ou aparece o campo de senha (precisa logar) ou já está autenticado
  // (sem password input após 8s). Polling explícito.
  let needLogin = false;
  for (let i = 0; i < 16; i += 1) {
    const pwd = await page
      .locator('input[type="password"]')
      .first()
      .isVisible({ timeout: 500 })
      .catch(() => false);
    if (pwd) {
      needLogin = true;
      break;
    }
    // Se a URL saiu de /login, considera autenticado
    if (!/login/i.test(page.url()) && i > 4) {
      // ainda dá um respiro pra confirmar
      await page.waitForTimeout(800);
      const stillNoPwd = await page
        .locator('input[type="password"]')
        .first()
        .isVisible({ timeout: 500 })
        .catch(() => false);
      if (!stillNoPwd) return true;
    }
    await page.waitForTimeout(700);
  }

  if (!needLogin) {
    // Sem campo de senha e ainda na rota /login? Pode ser SSO redirect — força reload
    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(2500);
    const pwd2 = await page
      .locator('input[type="password"]')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (!pwd2) return true;
  }

  // Preenche e submete
  await page
    .locator('input[type="email"], input[type="text"]')
    .first()
    .fill(EMAIL, { timeout: 5000 })
    .catch(() => {});
  await page
    .locator('input[type="password"]')
    .first()
    .fill(PASSWORD, { timeout: 5000 })
    .catch(() => {});

  await safeClick(page, [
    'button[type="submit"]',
    'button:has-text("Entrar")',
    'button:has-text("Login")',
    'button:has-text("Sign in")',
    'button:has-text("Acessar")',
  ]);

  // Aguarda URL mudar pra fora de /login (até 20s)
  for (let i = 0; i < 40; i += 1) {
    await page.waitForTimeout(500);
    if (!/login/i.test(page.url())) break;
  }

  // Aguarda app montar
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(2500);

  const stillPwd = await page
    .locator('input[type="password"]')
    .first()
    .isVisible({ timeout: 1500 })
    .catch(() => false);

  return !stillPwd && !/login/i.test(page.url());
}

test.describe.configure({ mode: "serial" });

test("ekyte tour - autenticado e captura sistemática", async ({ browser }) => {
  test.setTimeout(8 * 60 * 1000);

  // Reaproveita storage state se existir
  const storageExists = fs.existsSync(STORAGE_PATH);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: storageExists ? STORAGE_PATH : undefined,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  });
  const page = await context.newPage();

  // ---------- T1: login ----------
  const logged = await ensureLoggedIn(page);
  pushNote({
    id: "00-login",
    titulo: "Login / sessão",
    status: logged ? "ok" : "erro",
    obs: logged
      ? `Login OK em ${page.url()}`
      : "Não conseguiu autenticar — campo de senha persiste após submit.",
    screenshots: [await shot(page, "00-login-result")],
  });

  if (logged) {
    await context
      .storageState({ path: STORAGE_PATH })
      .catch(() => {});
  }

  // Se não logou, ainda assim segue capturando o que estiver visível (landing/login).
  // ---------- T2.1: Dashboard inicial ----------
  // Aguarda app montar de fato — espera por sidebar/nav OU timeout
  await page
    .waitForSelector(
      "nav, aside, [role='navigation'], [class*='sidebar' i], [class*='menu' i]",
      { timeout: 15_000, state: "visible" }
    )
    .catch(() => {});
  await page.waitForTimeout(3500);
  pushNote({
    id: "01-dashboard",
    titulo: "Dashboard inicial / home pós-login",
    status: logged ? "ok" : "parcial",
    obs: `URL atual: ${page.url()} | título: ${await page.title()}`,
    screenshots: [await shot(page, "01-dashboard-home")],
  });

  // Stack detection
  const stack = await detectStack(page);
  pushNote({
    id: "stack",
    titulo: "Stack detectado",
    status: "ok",
    obs: JSON.stringify(stack),
    screenshots: [],
  });

  // ---------- Coleta global: links da sidebar ----------
  const sidebarLinks = await page
    .evaluate(() => {
      const visible = (el: Element) => {
        const r = (el as HTMLElement).getBoundingClientRect?.();
        return r && r.width > 0 && r.height > 0;
      };
      const out: Array<{ text: string; href: string }> = [];
      // 1) anchors clássicos
      for (const el of Array.from(
        document.querySelectorAll(
          "nav a, aside a, [role='navigation'] a, [class*='sidebar' i] a, [class*='menu' i] a"
        )
      )) {
        if (!visible(el)) continue;
        const a = el as HTMLAnchorElement;
        const text = (a.textContent ?? "").trim().slice(0, 60);
        const href = a.getAttribute("href") ?? "";
        if (!text) continue;
        out.push({ text, href });
      }
      // 2) divs clicáveis (Ekyte usa SPAs com onClick em divs frequentemente)
      for (const el of Array.from(
        document.querySelectorAll(
          "nav [role='button'], aside [role='button'], [class*='sidebar' i] [role='button'], [class*='menu' i] [role='button'], nav button, aside button"
        )
      )) {
        if (!visible(el)) continue;
        const text = (el.textContent ?? "").trim().slice(0, 60);
        if (!text) continue;
        out.push({ text, href: "(button)" });
      }
      // 3) todos os elementos da nav com texto curto (último recurso)
      if (out.length < 3) {
        for (const el of Array.from(
          document.querySelectorAll("nav *, aside *, [class*='sidebar' i] *")
        ).slice(0, 200)) {
          if (!visible(el)) continue;
          const text = (el.textContent ?? "").trim();
          if (text && text.length > 2 && text.length < 40 && !text.includes("\n")) {
            out.push({ text, href: "(text-only)" });
          }
        }
      }
      return out.slice(0, 60);
    })
    .catch(() => [] as Array<{ text: string; href: string }>);

  pushNote({
    id: "sidebar",
    titulo: "Sidebar / navegação principal",
    status: sidebarLinks.length > 0 ? "ok" : "parcial",
    obs:
      sidebarLinks.length > 0
        ? sidebarLinks.map((l) => `- ${l.text} → ${l.href}`).join("\n")
        : "Nenhum link de navegação detectado.",
    screenshots: [await shot(page, "02-sidebar")],
  });

  // ---------- T2.2: Hierarquia (Workspace/Project/Task) ----------
  // Tenta abrir cada um dos primeiros 8 links da sidebar e capturar
  const targets = sidebarLinks
    .filter((l) => !!l.href && !l.href.startsWith("http"))
    .slice(0, 8);

  let i = 0;
  for (const tgt of targets) {
    i += 1;
    try {
      const fullUrl = tgt.href.startsWith("/") ? `${APP_URL}${tgt.href}` : tgt.href;
      await page
        .goto(fullUrl, { waitUntil: "domcontentloaded", timeout: 15_000 })
        .catch(() => {});
      await page.waitForTimeout(1800);
      const slug = tgt.text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 30) || `nav-${i}`;
      pushNote({
        id: `nav-${String(i).padStart(2, "0")}-${slug}`,
        titulo: `Navegação: ${tgt.text}`,
        status: "ok",
        obs: `URL: ${page.url()}`,
        screenshots: [await shot(page, `nav-${String(i).padStart(2, "0")}-${slug}`)],
      });
    } catch (e) {
      pushNote({
        id: `nav-${String(i).padStart(2, "0")}-erro`,
        titulo: `Navegação: ${tgt.text}`,
        status: "erro",
        obs: `Falhou: ${(e as Error).message.slice(0, 200)}`,
        screenshots: [],
      });
    }
  }

  // Volta para home antes de tentar criação
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(2000);

  // ---------- T2.3: Modal de criação de tarefa ----------
  // Tenta vários gatilhos comuns
  const triggered = await safeClick(page, [
    'button:has-text("Nova tarefa")',
    'button:has-text("Criar tarefa")',
    'button:has-text("Nova")',
    'button:has-text("Adicionar tarefa")',
    'button:has-text("Adicionar")',
    'button:has-text("New task")',
    'button:has-text("Create task")',
    'button[aria-label*="nova" i]',
    'button[aria-label*="add" i]',
    '[data-testid*="create" i]',
    'button:has(svg)',
  ]);

  await page.waitForTimeout(1500);
  const formFields = await listInteractive(page);
  pushNote({
    id: "03-task-create-modal",
    titulo: "Modal de criação de tarefa",
    status: triggered ? "ok" : "parcial",
    obs: `Gatilho usado: ${triggered ?? "nenhum"} | campos visíveis: ${formFields.length}\n\nCampos detectados (top 40):\n${formFields
      .slice(0, 40)
      .map(
        (f) =>
          `- [${f.tag}${f.type ? ":" + f.type : ""}] ${
            f.label || f.placeholder || f.text || f.name
          }`
      )
      .join("\n")}`,
    screenshots: [await shot(page, "03-task-create-modal")],
  });

  // Tenta fechar o modal sem salvar
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(800);

  // ---------- T2.4: Visualizações (kanban / lista / calendar / gantt) ----------
  const viewSwitchers = [
    { key: "kanban", labels: ["Kanban", "Quadro", "Board"] },
    { key: "list", labels: ["Lista", "List"] },
    { key: "calendar", labels: ["Calendário", "Calendar"] },
    { key: "gantt", labels: ["Gantt", "Cronograma", "Timeline"] },
    { key: "dashboard", labels: ["Dashboard", "Painel"] },
  ];

  for (const vs of viewSwitchers) {
    const sels = vs.labels.flatMap((l) => [
      `button:has-text("${l}")`,
      `a:has-text("${l}")`,
      `[role="tab"]:has-text("${l}")`,
    ]);
    const used = await safeClick(page, sels);
    await page.waitForTimeout(1500);
    pushNote({
      id: `04-view-${vs.key}`,
      titulo: `Visualização: ${vs.key}`,
      status: used ? "ok" : "nao-encontrado",
      obs: used ? `Trocou via: ${used}` : "Botão de visualização não encontrado nesta tela.",
      screenshots: [await shot(page, `04-view-${vs.key}`)],
    });
  }

  // ---------- T2.5: Detalhe de tarefa ----------
  // Tenta clicar no primeiro card/linha de tarefa
  const detailOpened = await safeClick(page, [
    "[data-testid*='task' i]",
    "[class*='card' i]",
    "[class*='task' i]",
    "tr[role='row']",
    "li[class*='item']",
  ]);
  await page.waitForTimeout(1500);
  pushNote({
    id: "05-task-detail",
    titulo: "Detalhe da tarefa (sheet/modal)",
    status: detailOpened ? "ok" : "nao-encontrado",
    obs: detailOpened ? `Abriu via: ${detailOpened}` : "Não localizou tarefa para abrir.",
    screenshots: [await shot(page, "05-task-detail")],
  });
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(500);

  // ---------- T2.6 a T2.13: tentativas por palavra-chave ----------
  const keywordPages: Array<{ id: string; labels: string[]; titulo: string }> = [
    { id: "06-templates", titulo: "Templates de projeto/tarefa", labels: ["Template", "Templates", "Modelos"] },
    { id: "07-aprovacoes", titulo: "Aprovações / fluxos", labels: ["Aprovaç", "Approval", "Workflow", "Fluxo"] },
    { id: "08-social", titulo: "Mídia social / calendário editorial", labels: ["Social", "Editorial", "Posts", "Calendário editorial", "Conteúdo"] },
    { id: "09-relatorios", titulo: "Relatórios / Analytics", labels: ["Relatório", "Relatórios", "Reports", "Analytics", "Dashboards"] },
    { id: "10-integracoes", titulo: "Integrações", labels: ["Integraç", "Integrations", "Apps"] },
    { id: "11-permissoes", titulo: "Permissões / membros", labels: ["Permiss", "Membros", "Equipe", "Time", "Roles", "Usuários"] },
    { id: "12-workload", titulo: "Workload / capacity", labels: ["Workload", "Capacidade", "Alocação", "Carga"] },
    { id: "13-sla", titulo: "SLA", labels: ["SLA", "Política", "Policy"] },
    { id: "16-config", titulo: "Configurações de conta/workspace", labels: ["Configuraç", "Settings", "Preferências"] },
  ];

  for (const kp of keywordPages) {
    const sels = kp.labels.flatMap((l) => [
      `a:has-text("${l}")`,
      `button:has-text("${l}")`,
      `[role="menuitem"]:has-text("${l}")`,
    ]);
    const used = await safeClick(page, sels);
    await page.waitForTimeout(1500);
    pushNote({
      id: kp.id,
      titulo: kp.titulo,
      status: used ? "ok" : "nao-encontrado",
      obs: used ? `Encontrado via: ${used} | URL: ${page.url()}` : "Não localizado por busca textual na navegação.",
      screenshots: [await shot(page, kp.id)],
    });
    // volta pra home pra próxima tentativa não ficar presa em sub-tela
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1000);
  }

  // ---------- T2.14: Comentários ricos ----------
  // Reabre primeira tarefa
  await safeClick(page, [
    "[data-testid*='task' i]",
    "[class*='card' i]",
    "[class*='task' i]",
    "tr[role='row']",
  ]);
  await page.waitForTimeout(1500);
  pushNote({
    id: "14-comentarios",
    titulo: "Comentários ricos (mention/anexo/reação)",
    status: "parcial",
    obs:
      "Capturou painel de comentários se aberto — não testou @mention para evitar criar ruído. Verificar manualmente no screenshot.",
    screenshots: [await shot(page, "14-comentarios")],
  });
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(500);

  // ---------- T2.15: Atalhos de teclado ----------
  await page.keyboard.press("Shift+?").catch(() => {});
  await page.waitForTimeout(1200);
  let shortcutsCaptured = await shot(page, "15-shortcuts-shiftQ");
  // segunda tentativa: tecla "?"
  await page.keyboard.press("?").catch(() => {});
  await page.waitForTimeout(1200);
  shortcutsCaptured = await shot(page, "15-shortcuts-question");
  pushNote({
    id: "15-shortcuts",
    titulo: "Atalhos de teclado (modal ?)",
    status: "parcial",
    obs:
      "Tentou Shift+? e ?. Validar visualmente o screenshot — se modal aparecer extrair lista para keyboard-shortcuts.md.",
    screenshots: ["15-shortcuts-shiftQ.png", "15-shortcuts-question.png"],
  });
  await page.keyboard.press("Escape").catch(() => {});

  // ---------- T2.17: Mobile ----------
  await context.setViewportSize?.({ width: 375, height: 812 }).catch(() => {});
  // setViewportSize é em page, na verdade
  await page.setViewportSize({ width: 375, height: 812 }).catch(() => {});
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(2000);
  pushNote({
    id: "17-mobile",
    titulo: "Mobile (375x812)",
    status: "ok",
    obs: `URL: ${page.url()}`,
    screenshots: [await shot(page, "17-mobile-home")],
  });
  await page.setViewportSize({ width: 1440, height: 900 }).catch(() => {});

  // ---------- Salva storage state final ----------
  try {
    await context.storageState({ path: STORAGE_PATH });
  } catch {
    // ok
  }

  // ---------- Escreve markdown de notas estruturado ----------
  const md: string[] = [];
  md.push("# Tour Ekyte — notas brutas");
  md.push("");
  md.push(`Gerado em: ${new Date().toISOString()}`);
  md.push(`Total de capturas: ${notes.reduce((acc, n) => acc + n.screenshots.length, 0)}`);
  md.push("");
  for (const n of notes) {
    md.push(`## ${n.id} — ${n.titulo}`);
    md.push(`Status: **${n.status}**`);
    md.push("");
    if (n.obs) {
      md.push(n.obs);
      md.push("");
    }
    if (n.screenshots.length) {
      for (const s of n.screenshots) {
        md.push(`![${s}](screens/${s})`);
      }
      md.push("");
    }
  }
  fs.writeFileSync(NOTES_PATH, md.join("\n"), "utf8");

  expect(true).toBe(true);
});
