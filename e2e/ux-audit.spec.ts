import { test, expect, Page, BrowserContext } from "@playwright/test";
import fs from "fs";
import path from "path";

const SHOTS_DIR =
  "/Users/andreylopes/complete-guide/.claude/reports/ux-audit/screens";
const AUTH_DIR =
  "/Users/andreylopes/complete-guide/.claude/reports/competitive-analysis/.auth";
const STORAGE = path.join(AUTH_DIR, "storage.json");

fs.mkdirSync(SHOTS_DIR, { recursive: true });
fs.mkdirSync(AUTH_DIR, { recursive: true });

const TS = Date.now();
const NEW_EMAIL = `qa.cto+ux${TS}@oxytest.dev`;
const FALLBACK_EMAIL = "qa.cto.fixed@oxytest.dev";
const PASSWORD = "OxyTest!2026";

async function shot(page: Page, name: string) {
  const file = path.join(SHOTS_DIR, name);
  await page.screenshot({ path: file, fullPage: false });
}

async function shotFull(page: Page, name: string) {
  const file = path.join(SHOTS_DIR, name);
  await page.screenshot({ path: file, fullPage: true });
}

async function tryLogin(page: Page) {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Aba "Entrar"
  const entrarTab = page.getByRole("tab", { name: /entrar/i }).first();
  if (await entrarTab.isVisible().catch(() => false)) {
    await entrarTab.click().catch(() => {});
    await page.waitForTimeout(400);
  }

  await page
    .locator('input[type="email"], input[name="email"]')
    .first()
    .fill(FALLBACK_EMAIL)
    .catch(() => {});
  await page
    .locator('input[type="password"], input[name="password"]')
    .first()
    .fill(PASSWORD)
    .catch(() => {});

  await page
    .getByRole("button", { name: /^entrar$|fazer login|acessar/i })
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(3000);

  if (page.url().includes("/app") || page.url().includes("/onboarding"))
    return true;

  // signup
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const signupTab = page
    .getByRole("tab", { name: /criar conta|cadastrar|sign\s?up/i })
    .first();
  if (await signupTab.isVisible().catch(() => false)) {
    await signupTab.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  // tenta nome
  const nameInput = page
    .locator(
      'input[name="name"], input[name="fullName"], input[placeholder*="nome" i]'
    )
    .first();
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill("QA UX Audit").catch(() => {});
  }
  await page
    .locator('input[type="email"], input[name="email"]')
    .first()
    .fill(NEW_EMAIL)
    .catch(() => {});
  await page
    .locator('input[type="password"], input[name="password"]')
    .first()
    .fill(PASSWORD)
    .catch(() => {});

  await page
    .getByRole("button", { name: /criar conta|cadastrar|registrar/i })
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(4500);

  // pode ter ido pro onboarding — tenta pular/seguir até /app
  if (page.url().includes("/onboarding")) {
    // tenta clicar em pular/continuar várias vezes
    for (let i = 0; i < 8; i++) {
      const skip = page
        .getByRole("button", {
          name: /pular|continuar|próximo|começar|finalizar|avançar/i,
        })
        .first();
      if (await skip.isVisible().catch(() => false)) {
        await skip.click().catch(() => {});
        await page.waitForTimeout(900);
      } else {
        break;
      }
    }
    await page.goto("/app", { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1500);
  }

  return page.url().includes("/app");
}

const DESKTOP_ROUTES: Array<[string, string]> = [
  ["01-app-home.png", "/app"],
  ["02-hoje.png", "/app/hoje"],
  ["03-kanban.png", "/app/kanban"],
  ["04-calendario.png", "/app/calendario"],
  ["05-projetos.png", "/app/projetos"],
  ["06-squads.png", "/app/squads"],
  ["07-dashboard-view.png", "/app/dashboard"],
  // 08 dashboard edit — clica botão depois
  ["09-eisenhower.png", "/app/eisenhower"],
  ["10-atendimento.png", "/app/atendimento"],
  ["11-conhecimento.png", "/app/conhecimento"],
  ["12-genio.png", "/app/genio"],
  ["13-config-aparencia.png", "/app/configuracoes/aparencia"],
  ["14-config-hub.png", "/app/configuracoes"],
  ["15-notificacoes.png", "/app/notificacoes"],
  ["16-automacoes-regras.png", "/app/automacoes/regras"],
];

test("UX audit — captura completa", async ({ browser }) => {
  test.setTimeout(900_000);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  page.on("console", () => {});
  page.on("pageerror", () => {});

  // login
  const ok = await tryLogin(page);
  if (!ok) {
    console.log("[UX-AUDIT] login falhou — capturando estado de auth");
    await shot(page, "00-auth-fail.png");
  } else {
    await context.storageState({ path: STORAGE });
    console.log("[UX-AUDIT] storage state salvo em", STORAGE);
  }

  // === DESKTOP ===
  for (const [name, route] of DESKTOP_ROUTES) {
    try {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(1800);
      await shotFull(page, name);
      console.log(`[UX-AUDIT] ${name} ok`);
    } catch (e) {
      console.log(`[UX-AUDIT] ${name} falhou:`, (e as Error).message);
      await shot(page, name).catch(() => {});
    }
  }

  // 08 dashboard modo edição
  try {
    await page.goto("/app/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const editBtn = page.getByRole("button", { name: /editar|edit/i }).first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click().catch(() => {});
      await page.waitForTimeout(1200);
    }
    await shotFull(page, "08-dashboard-edit.png");
  } catch (e) {
    console.log("[UX-AUDIT] 08 falhou:", (e as Error).message);
  }

  // === SIDEBAR ESPECÍFICO (20-22) ===
  try {
    await page.goto("/app/hoje", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // 20 collapsed
    const collapseBtn = page
      .locator(
        '[aria-label*="collapse" i], [aria-label*="recolher" i], [data-sidebar="trigger"], button[aria-controls*="sidebar" i]'
      )
      .first();
    if (await collapseBtn.isVisible().catch(() => false)) {
      await collapseBtn.click().catch(() => {});
      await page.waitForTimeout(800);
    }
    await shot(page, "20-sidebar-collapsed.png");

    // re-expande
    if (await collapseBtn.isVisible().catch(() => false)) {
      await collapseBtn.click().catch(() => {});
      await page.waitForTimeout(800);
    }

    // 21 todos os grupos abertos — clica em todos botões de grupo
    const groupHeaders = page.locator(
      '[data-sidebar="group-label"], button[aria-expanded]'
    );
    const cnt = await groupHeaders.count().catch(() => 0);
    for (let i = 0; i < Math.min(cnt, 12); i++) {
      const h = groupHeaders.nth(i);
      const expanded = await h.getAttribute("aria-expanded").catch(() => null);
      if (expanded === "false") {
        await h.click().catch(() => {});
        await page.waitForTimeout(250);
      }
    }
    await page.waitForTimeout(600);
    await shotFull(page, "21-sidebar-todos-grupos-abertos.png");

    // 22 hover
    const firstNav = page
      .locator('aside a, nav a, [role="navigation"] a')
      .first();
    if (await firstNav.isVisible().catch(() => false)) {
      await firstNav.hover().catch(() => {});
      await page.waitForTimeout(800);
    }
    await shot(page, "22-sidebar-hover.png");
  } catch (e) {
    console.log("[UX-AUDIT] sidebar específico falhou:", (e as Error).message);
  }

  // === ESTADOS (23-25) ===
  // 23 projetos vazio — só capturamos o atual (pode estar populado, mas registramos)
  try {
    await page.goto("/app/projetos", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await shotFull(page, "23-projetos-estado-atual.png");

    // 24 modal novo projeto
    const novoBtn = page
      .getByRole("button", { name: /novo projeto|criar projeto|\+ projeto/i })
      .first();
    if (await novoBtn.isVisible().catch(() => false)) {
      await novoBtn.click().catch(() => {});
      await page.waitForTimeout(1200);
    }
    await shot(page, "24-modal-novo-projeto.png");
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(400);
  } catch (e) {
    console.log("[UX-AUDIT] estados projetos falhou:", (e as Error).message);
  }

  // 25 task detail sheet — abre primeira task em /app/hoje
  try {
    await page.goto("/app/hoje", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1800);
    const firstTask = page
      .locator(
        '[data-task-row], [data-testid*="task"], li[role="button"], button[aria-label*="tarefa" i], [class*="task-row" i]'
      )
      .first();
    if (await firstTask.isVisible().catch(() => false)) {
      await firstTask.click().catch(() => {});
      await page.waitForTimeout(1500);
      await shot(page, "25a-task-detail-default.png");

      const tabs = ["Comentários", "Tempo", "Estratégia", "Whiteboard", "Campos", "IA"];
      for (let i = 0; i < tabs.length; i++) {
        const tab = page
          .getByRole("tab", { name: new RegExp(tabs[i], "i") })
          .first();
        if (await tab.isVisible().catch(() => false)) {
          await tab.click().catch(() => {});
          await page.waitForTimeout(700);
          await shot(page, `25${String.fromCharCode(98 + i)}-task-tab-${tabs[i].toLowerCase()}.png`);
        }
      }
    } else {
      await shot(page, "25-task-detail-no-task.png");
    }
  } catch (e) {
    console.log("[UX-AUDIT] task detail falhou:", (e as Error).message);
  }

  await context.close();

  // === MOBILE ===
  const mobileCtx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    storageState: fs.existsSync(STORAGE) ? STORAGE : undefined,
    isMobile: true,
    hasTouch: true,
  });
  const mPage = await mobileCtx.newPage();

  if (!fs.existsSync(STORAGE)) {
    await tryLogin(mPage);
  }

  for (const [name, route] of [
    ["17-mobile-hoje.png", "/app/hoje"],
    ["18-mobile-kanban.png", "/app/kanban"],
    ["19-mobile-config.png", "/app/configuracoes"],
  ] as Array<[string, string]>) {
    try {
      await mPage.goto(route, { waitUntil: "domcontentloaded" });
      await mPage.waitForTimeout(1800);
      await shotFull(mPage, name);
    } catch (e) {
      console.log(`[UX-AUDIT] ${name} falhou:`, (e as Error).message);
    }
  }

  await mobileCtx.close();
});
