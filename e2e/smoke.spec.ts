import { test, expect, Page, ConsoleMessage, Response } from "@playwright/test";
import fs from "fs";
import path from "path";

const REPORT_DIR = path.resolve(
  "/Users/andreylopes/complete-guide/.claude/reports"
);
const SHOTS_DIR = path.join(REPORT_DIR, "screenshots");
const REPORT_PATH = path.join(REPORT_DIR, "smoke-test-20260504.md");
const JSON_PATH = path.join(REPORT_DIR, "smoke-test-20260504.json");

fs.mkdirSync(SHOTS_DIR, { recursive: true });

const TS = Date.now();
const NEW_EMAIL = `qa.cto+${TS}@oxytest.dev`;
const FALLBACK_EMAIL = "qa.cto.fixed@oxytest.dev";
const PASSWORD = "OxyTest!2026";

type RouteResult = {
  route: string;
  label: string;
  status: "OK" | "quebrado" | "parcial" | "mock";
  consoleErrors: string[];
  networkErrors: string[];
  note: string;
  screenshot: string;
};

const results: RouteResult[] = [];
const interactionFindings: string[] = [];

const SIDEBAR = [
  { label: "Inbox", route: "/app" },
  { label: "Hoje", route: "/app/hoje" },
  { label: "Próximos 7", route: "/app/proximos" },
  { label: "Atrasadas", route: "/app/atrasadas" },
  { label: "Atribuídas", route: "/app/atribuidas" },
  { label: "Calendário", route: "/app/calendario" },
  { label: "Kanban", route: "/app/kanban" },
  { label: "Lista (projetos)", route: "/app/projetos" },
  { label: "Templates", route: "/app/templates" },
  { label: "Squads", route: "/app/squads" },
  { label: "Demandas", route: "/app/demandas" },
  { label: "Aprovações", route: "/app/aprovacoes" },
  { label: "SLAs", route: "/app/slas" },
  { label: "Mídias previews", route: "/app/midias" },
  { label: "Calendário editorial", route: "/app/social" },
  { label: "Inbox social", route: "/app/social/inbox" },
  { label: "Cadência", route: "/app/social/cadencia" },
  { label: "Studio criativo", route: "/app/social/studio" },
  { label: "Pipeline produção", route: "/app/social/pipeline" },
  { label: "Inteligência IA", route: "/app/social/intel" },
  { label: "Analytics social", route: "/app/social/analytics" },
  { label: "Campanhas", route: "/app/campanhas" },
  { label: "Boost manager", route: "/app/social/boosts" },
  { label: "Creators", route: "/app/social/creators" },
  { label: "Link-in-bio", route: "/app/social/bio" },
  { label: "Biblioteca de mídia", route: "/app/biblioteca" },
  { label: "Snippets", route: "/app/snippets" },
  { label: "Dashboard", route: "/app/dashboard" },
  { label: "Executive", route: "/app/exec" },
  { label: "Copilot IA", route: "/app/copilot" },
  { label: "Benchmarks", route: "/app/benchmarks" },
  { label: "Simulações", route: "/app/simulacoes" },
  { label: "Report Builder", route: "/app/reports" },
  { label: "Forecast IA", route: "/app/forecast" },
  { label: "OKRs", route: "/app/okrs" },
  { label: "Anomalias", route: "/app/anomalias" },
  { label: "Workload", route: "/app/workload" },
  { label: "Skills", route: "/app/skills" },
  { label: "Capacity", route: "/app/capacity" },
  { label: "Foco", route: "/app/foco" },
  { label: "Gênio Growth", route: "/app/genio" },
  { label: "IA Proativa", route: "/app/ia-proativa" },
  { label: "Notificações", route: "/app/notificacoes" },
  { label: "Comece aqui", route: "/app/comecar" },
  { label: "Ajuda", route: "/app/ajuda" },
  { label: "Conquistas", route: "/app/conquistas" },
  { label: "Enterprise", route: "/app/enterprise" },
  { label: "Automações", route: "/app/automacoes" },
  { label: "Regras (no-code)", route: "/app/automacoes/regras" },
  { label: "Workspaces", route: "/app/workspaces" },
  { label: "Plano & billing", route: "/app/configuracoes/plano" },
  { label: "Marketplace", route: "/app/marketplace" },
  { label: "Developer Hub", route: "/app/developer" },
  { label: "Busca global", route: "/app/buscar" },
  { label: "Dados (import/export)", route: "/app/configuracoes/dados" },
  { label: "Segurança 2FA", route: "/app/seguranca" },
  { label: "Privacidade LGPD", route: "/app/configuracoes/privacidade" },
  { label: "Saúde sistema", route: "/app/admin/saude" },
  { label: "Erros admin", route: "/app/admin/erros" },
  { label: "Atalhos", route: "/app/atalhos" },
  { label: "Aparência", route: "/app/configuracoes/aparencia" },
  { label: "Idioma", route: "/app/configuracoes/idioma" },
  { label: "Tipos de tarefa", route: "/app/configuracoes/tipos" },
  { label: "Integrações", route: "/app/configuracoes/integracoes" },
  { label: "Integrações nativas", route: "/app/configuracoes/integracoes-externas" },
  { label: "Audit log", route: "/app/audit" },
  { label: "Configurações", route: "/app/configuracoes" },
];

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function attachConsoleAndNet(page: Page) {
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];
  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      const t = msg.text();
      if (
        t.includes("Failed to load resource") ||
        t.includes("favicon") ||
        t.includes("Manifest")
      )
        return;
      consoleErrors.push(t.slice(0, 220));
    }
  };
  const onResponse = (r: Response) => {
    const status = r.status();
    if (status >= 400 && status < 600) {
      const url = r.url();
      if (
        url.includes("favicon") ||
        url.includes(".svg") ||
        url.includes(".png") ||
        url.includes(".woff")
      )
        return;
      // ignore expected Supabase 4xx for logged out probes
      networkErrors.push(`${status} ${url.slice(0, 180)}`);
    }
  };
  page.on("console", onConsole);
  page.on("response", onResponse);
  return {
    consoleErrors,
    networkErrors,
    detach: () => {
      page.off("console", onConsole);
      page.off("response", onResponse);
    },
  };
}

async function tryAuth(page: Page): Promise<{ authed: boolean; mode: string; error?: string }> {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  // Try signup
  try {
    await page.getByRole("tab", { name: "Criar conta" }).click({ timeout: 3000 });
    await page.waitForTimeout(400);
    // Signup form has 3 inputs: text(name), email, password
    const signupForm = page.locator('[role="tabpanel"][data-state="active"]');
    await signupForm.locator('input[type="text"], input:not([type])').first().fill("QA CTO");
    await signupForm.locator('input[name="email"]').fill(NEW_EMAIL);
    await signupForm.locator('input[name="password"]').fill(PASSWORD);
    await signupForm.getByRole("button", { name: "Criar conta" }).click();
    await page.waitForURL(/\/onboarding|\/app/, { timeout: 10000 });
    return { authed: true, mode: `signup:${NEW_EMAIL}` };
  } catch (e: any) {
    interactionFindings.push(
      `Signup falhou para ${NEW_EMAIL}: ${String(e).slice(0, 160)}`
    );
  }

  // Fallback login
  try {
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.getByRole("tab", { name: "Entrar" }).click({ timeout: 3000 });
    await page.waitForTimeout(400);
    const loginForm = page.locator('[role="tabpanel"][data-state="active"]');
    await loginForm.locator('input[name="email"]').fill(FALLBACK_EMAIL);
    await loginForm.locator('input[name="password"]').fill(PASSWORD);
    await loginForm.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(/\/onboarding|\/app/, { timeout: 10000 });
    return { authed: true, mode: `login:${FALLBACK_EMAIL}` };
  } catch (e: any) {
    return {
      authed: false,
      mode: "fail",
      error: String(e).slice(0, 200),
    };
  }
}

async function completeOnboardingIfNeeded(page: Page) {
  if (!page.url().includes("/onboarding")) return false;
  try {
    await page.waitForTimeout(600);
    const inputs = page.locator("form input");
    await inputs.nth(0).fill("QA CTO");
    await inputs.nth(1).fill("CTO QA");
    await page.getByRole("button", { name: /Concluir e entrar/i }).click();
    await page.waitForURL(/\/app/, { timeout: 10000 });
    return true;
  } catch (e: any) {
    interactionFindings.push(`Onboarding travou: ${String(e).slice(0, 160)}`);
    return false;
  }
}

test("smoke test Oxy Growth OS", async ({ page }) => {
  test.setTimeout(8 * 60_000);

  // 1. AUTH
  const auth = await tryAuth(page);
  if (!auth.authed) {
    interactionFindings.push(
      `AUTH BLOQUEADO. Erro: ${auth.error}. Continuando smoke em rotas públicas.`
    );
    await page.screenshot({
      path: path.join(SHOTS_DIR, "auth-falhou.png"),
      fullPage: true,
    });
    // public probes
    for (const pub of [
      { label: "Landing /", route: "/" },
      { label: "Auth", route: "/auth" },
      { label: "Preços", route: "/precos" },
      { label: "Checkout free", route: "/checkout/free" },
    ]) {
      const tap = attachConsoleAndNet(page);
      try {
        await page.goto(pub.route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(800);
        const file = path.join(SHOTS_DIR, slug(pub.label) + ".png");
        await page.screenshot({ path: file, fullPage: false });
        results.push({
          route: pub.route,
          label: pub.label,
          status: "OK",
          consoleErrors: tap.consoleErrors,
          networkErrors: tap.networkErrors,
          note: "rota pública carregou",
          screenshot: file,
        });
      } catch (e: any) {
        results.push({
          route: pub.route,
          label: pub.label,
          status: "quebrado",
          consoleErrors: tap.consoleErrors,
          networkErrors: tap.networkErrors,
          note: `falha: ${String(e).slice(0, 140)}`,
          screenshot: "",
        });
      } finally {
        tap.detach();
      }
    }
  } else {
    interactionFindings.push(`Auth OK (${auth.mode}).`);

    // 2. ONBOARDING
    const did = await completeOnboardingIfNeeded(page);
    if (did) interactionFindings.push("Onboarding completado com sucesso.");

    // 3. APPHOME
    {
      const tap = attachConsoleAndNet(page);
      try {
        await page.goto("/app", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1200);
        const sidebarVisible = await page
          .locator('[data-tour="sidebar"]')
          .first()
          .isVisible()
          .catch(() => false);
        const file = path.join(SHOTS_DIR, "app-home.png");
        await page.screenshot({ path: file, fullPage: false });
        results.push({
          route: "/app",
          label: "AppHome (Inbox)",
          status: sidebarVisible ? "OK" : "parcial",
          consoleErrors: tap.consoleErrors,
          networkErrors: tap.networkErrors,
          note: sidebarVisible
            ? "sidebar e topbar visíveis"
            : "sidebar não detectada",
          screenshot: file,
        });
      } catch (e: any) {
        results.push({
          route: "/app",
          label: "AppHome",
          status: "quebrado",
          consoleErrors: tap.consoleErrors,
          networkErrors: tap.networkErrors,
          note: `crash: ${String(e).slice(0, 140)}`,
          screenshot: "",
        });
      } finally {
        tap.detach();
      }
    }

    // 4. WALK ALL ROUTES
    for (const item of SIDEBAR) {
      const tap = attachConsoleAndNet(page);
      const start = Date.now();
      let status: RouteResult["status"] = "OK";
      let note = "";
      let file = "";
      try {
        await page.goto(item.route, {
          waitUntil: "domcontentloaded",
          timeout: 10_000,
        });
        // wait briefly for content
        await page.waitForTimeout(900);

        // detect skeleton-only state after extra wait
        const stillSkeleton = await page
          .locator('[data-skeleton], .animate-pulse')
          .count()
          .then((n) => n > 3)
          .catch(() => false);
        if (stillSkeleton) {
          await page.waitForTimeout(1800);
          const stillSkeleton2 = await page
            .locator('[data-skeleton], .animate-pulse')
            .count()
            .then((n) => n > 3)
            .catch(() => false);
          if (stillSkeleton2) {
            status = "parcial";
            note = "skeleton persistente >2.5s";
          }
        }

        // Check for h1 / heading
        const headingCount = await page
          .locator("h1, h2")
          .count()
          .catch(() => 0);
        if (headingCount === 0 && status === "OK") {
          status = "parcial";
          note = (note ? note + "; " : "") + "sem h1/h2";
        }

        // Check error boundary text
        const hasErrorBoundary = await page
          .getByText(/Algo deu errado|Erro inesperado|Página não encontrada/i)
          .first()
          .isVisible()
          .catch(() => false);
        if (hasErrorBoundary) {
          status = "quebrado";
          note = (note ? note + "; " : "") + "error boundary visível";
        }

        // Check button presence
        const btnCount = await page
          .locator('button, [role="button"], a[href]')
          .count();
        if (btnCount < 3 && status === "OK") {
          status = "parcial";
          note = (note ? note + "; " : "") + "poucos CTAs";
        }

        // Demo/mock heuristic
        const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(
          0,
          5000
        );
        if (
          /demo|placeholder|exemplo|mock|sample|lorem/i.test(bodyText) &&
          !/Configurações|Notificações/.test(item.label)
        ) {
          if (status === "OK") {
            status = "mock";
            note = (note ? note + "; " : "") + "texto sugere placeholder";
          }
        }

        file = path.join(SHOTS_DIR, slug(item.label) + ".png");
        await page.screenshot({ path: file, fullPage: false });
      } catch (e: any) {
        status = "quebrado";
        note = `nav falhou: ${String(e).slice(0, 140)}`;
      } finally {
        tap.detach();
      }

      // promote to quebrado if many console errors
      if (tap.consoleErrors.length >= 3 && status !== "quebrado") {
        status = "parcial";
        note = (note ? note + "; " : "") + `${tap.consoleErrors.length} console.error`;
      }

      results.push({
        route: item.route,
        label: item.label,
        status,
        consoleErrors: tap.consoleErrors,
        networkErrors: tap.networkErrors,
        note: note || `ok em ${Date.now() - start}ms`,
        screenshot: file,
      });
    }

    // 5. INTERACTIONS
    // /app/hoje QuickAdd
    try {
      await page.goto("/app/hoje", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      const quick = page
        .locator(
          'input[placeholder*="Adicione"], input[placeholder*="tarefa"], input[placeholder*="Reunião"], input[placeholder*="O que"]'
        )
        .first();
      if (await quick.isVisible().catch(() => false)) {
        await quick.fill("Reunião amanhã 14h #marketing");
        await quick.press("Enter");
        await page.waitForTimeout(1500);
        const found = await page
          .getByText("Reunião amanhã 14h", { exact: false })
          .first()
          .isVisible()
          .catch(() => false);
        interactionFindings.push(
          `QuickAdd /hoje: ${found ? "tarefa apareceu na lista" : "input enviado mas tarefa não foi visível"}`
        );
      } else {
        interactionFindings.push("QuickAdd /hoje: input não encontrado");
      }
    } catch (e: any) {
      interactionFindings.push(`QuickAdd /hoje crash: ${String(e).slice(0, 140)}`);
    }

    // Kanban
    try {
      await page.goto("/app/kanban", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const cols = await page
        .locator(
          '[data-kanban-column], [class*="kanban"], [class*="column"]'
        )
        .count();
      interactionFindings.push(
        `Kanban: ${cols} elementos coluna detectados`
      );
    } catch (e: any) {
      interactionFindings.push(`Kanban crash: ${String(e).slice(0, 140)}`);
    }

    // Calendário grid
    try {
      await page.goto("/app/calendario", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const cells = await page.locator('[role="gridcell"], [class*="day"]').count();
      interactionFindings.push(`Calendário: ${cells} células detectadas`);
    } catch (e: any) {
      interactionFindings.push(`Calendário crash: ${String(e).slice(0, 140)}`);
    }

    // Projetos novo
    try {
      await page.goto("/app/projetos", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      const novo = page.getByRole("button", { name: /Novo projeto|Criar projeto/i }).first();
      if (await novo.isVisible().catch(() => false)) {
        await novo.click();
        await page.waitForTimeout(700);
        const nameInput = page.locator('input[name="name"], input[placeholder*="ome"]').first();
        if (await nameInput.isVisible().catch(() => false)) {
          await nameInput.fill(`QA Project ${TS}`);
          const submit = page.getByRole("button", { name: /Criar|Salvar|Adicionar/i }).last();
          await submit.click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(1500);
          const ok = await page
            .getByText(`QA Project ${TS}`)
            .first()
            .isVisible()
            .catch(() => false);
          interactionFindings.push(
            `Novo projeto: ${ok ? "criado e visível" : "submit não confirmou criação"}`
          );
        } else {
          interactionFindings.push("Novo projeto: campo nome não encontrado no modal");
        }
      } else {
        interactionFindings.push("Novo projeto: botão não encontrado");
      }
    } catch (e: any) {
      interactionFindings.push(`Novo projeto crash: ${String(e).slice(0, 140)}`);
    }

    // Squads novo
    try {
      await page.goto("/app/squads", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      const novo = page.getByRole("button", { name: /Novo squad|Criar squad/i }).first();
      if (await novo.isVisible().catch(() => false)) {
        await novo.click();
        await page.waitForTimeout(700);
        const nameInput = page.locator('input[name="name"], input[placeholder*="ome"]').first();
        if (await nameInput.isVisible().catch(() => false)) {
          await nameInput.fill(`QA Squad ${TS}`);
          const submit = page.getByRole("button", { name: /Criar|Salvar/i }).last();
          await submit.click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(1500);
          const ok = await page
            .getByText(`QA Squad ${TS}`)
            .first()
            .isVisible()
            .catch(() => false);
          interactionFindings.push(
            `Novo squad: ${ok ? "criado e visível" : "submit não confirmou"}`
          );
        } else {
          interactionFindings.push("Novo squad: campo nome não encontrado");
        }
      } else {
        interactionFindings.push("Novo squad: botão não encontrado");
      }
    } catch (e: any) {
      interactionFindings.push(`Novo squad crash: ${String(e).slice(0, 140)}`);
    }

    // Genio chat
    try {
      await page.goto("/app/genio", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      const ta = page.locator('textarea, input[type="text"]').first();
      if (await ta.isVisible().catch(() => false)) {
        await ta.fill("Resumo da semana de marketing");
        const send = page
          .getByRole("button", { name: /Enviar|Send/i })
          .first();
        if (await send.isVisible().catch(() => false)) {
          await send.click();
        } else {
          await ta.press("Enter");
        }
        await page.waitForTimeout(3500);
        const errs = await page
          .getByText(/erro|limite|falhou|rate limit/i)
          .first()
          .isVisible()
          .catch(() => false);
        interactionFindings.push(
          `Gênio chat: ${errs ? "mensagem de erro visível" : "request enviado sem erro óbvio"}`
        );
      } else {
        interactionFindings.push("Gênio chat: input não encontrado");
      }
    } catch (e: any) {
      interactionFindings.push(`Gênio crash: ${String(e).slice(0, 140)}`);
    }

    // Notificações tabs
    try {
      await page.goto("/app/notificacoes", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const tabs = await page.locator('[role="tab"]').count();
      interactionFindings.push(`Notificações: ${tabs} tabs detectadas`);
    } catch (e: any) {
      interactionFindings.push(`Notificações crash: ${String(e).slice(0, 140)}`);
    }

    // Aparência tema
    try {
      await page.goto("/app/configuracoes/aparencia", {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(1200);
      const dark = page
        .getByRole("button", { name: /Escuro|Dark/i })
        .first();
      if (await dark.isVisible().catch(() => false)) {
        const before = await page.evaluate(() =>
          document.documentElement.classList.contains("dark")
        );
        await dark.click();
        await page.waitForTimeout(700);
        const after = await page.evaluate(() =>
          document.documentElement.classList.contains("dark")
        );
        interactionFindings.push(
          `Aparência: tema ${before === after ? "NÃO mudou" : "mudou"} (before=${before}, after=${after})`
        );
      } else {
        interactionFindings.push("Aparência: botão tema não encontrado");
      }
    } catch (e: any) {
      interactionFindings.push(`Aparência crash: ${String(e).slice(0, 140)}`);
    }

    // Idioma
    try {
      await page.goto("/app/configuracoes/idioma", {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(1200);
      const opts = page.getByText(/English|Español|Inglês|Espanhol/i).first();
      if (await opts.isVisible().catch(() => false)) {
        await opts.click().catch(() => {});
        await page.waitForTimeout(800);
        interactionFindings.push("Idioma: opção alternativa clicável");
      } else {
        interactionFindings.push("Idioma: nenhuma opção alternativa visível");
      }
    } catch (e: any) {
      interactionFindings.push(`Idioma crash: ${String(e).slice(0, 140)}`);
    }

    // Buscar
    try {
      await page.goto("/app/buscar", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      const inp = page.locator('input[type="search"], input[placeholder*="usca"]').first();
      if (await inp.isVisible().catch(() => false)) {
        await inp.fill("teste");
        await page.waitForTimeout(1500);
        const empty = await page
          .getByText(/Nenhum resultado|Sem resultados|empty/i)
          .first()
          .isVisible()
          .catch(() => false);
        interactionFindings.push(
          `Buscar: ${empty ? "empty state visível" : "input aceitou query"}`
        );
      } else {
        interactionFindings.push("Buscar: input não encontrado");
      }
    } catch (e: any) {
      interactionFindings.push(`Buscar crash: ${String(e).slice(0, 140)}`);
    }
  }

  // Persist results JSON for report builder
  fs.writeFileSync(
    JSON_PATH,
    JSON.stringify(
      { auth, results, interactionFindings, ts: TS, newEmail: NEW_EMAIL },
      null,
      2
    )
  );

  // Build report
  const total = results.length;
  const counts = {
    OK: results.filter((r) => r.status === "OK").length,
    quebrado: results.filter((r) => r.status === "quebrado").length,
    parcial: results.filter((r) => r.status === "parcial").length,
    mock: results.filter((r) => r.status === "mock").length,
  };

  const tableRows = results
    .map(
      (r) =>
        `| ${r.route} | ${r.status} | ${r.consoleErrors.length} | ${r.networkErrors.length} | ${r.note.replace(/\|/g, "\\|").slice(0, 100)} | ${r.screenshot ? path.basename(r.screenshot) : "—"} |`
    )
    .join("\n");

  const critical = results
    .filter((r) => r.status === "quebrado")
    .map(
      (r) =>
        `- ${r.route} (${r.label}): ${r.note}. console.errors=${r.consoleErrors.length}, net4xx5xx=${r.networkErrors.length}`
    )
    .join("\n");

  const high = results
    .filter((r) => r.status === "parcial")
    .map(
      (r) =>
        `- ${r.route} (${r.label}): ${r.note}. console.errors=${r.consoleErrors.length}`
    )
    .join("\n");

  const mockSection = results
    .filter((r) => r.status === "mock")
    .map((r) => `- ${r.route} (${r.label}): ${r.note}`)
    .join("\n");

  // Group network errors by host/path stem
  const netByHost: Record<string, number> = {};
  for (const r of results) {
    for (const ne of r.networkErrors) {
      const m = ne.match(/^(\d{3}) https?:\/\/([^/]+)(\/[^?#]*)?/);
      if (!m) continue;
      const key = `${m[1]} ${m[2]}${(m[3] || "").split("/").slice(0, 4).join("/")}`;
      netByHost[key] = (netByHost[key] || 0) + 1;
    }
  }
  const netGrouped = Object.entries(netByHost)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([k, n]) => `- ${n}× ${k}`)
    .join("\n");

  // Group console errors
  const consoleByPattern: Record<string, number> = {};
  for (const r of results) {
    for (const ce of r.consoleErrors) {
      const key = ce.split(/[:\n]/)[0].slice(0, 80);
      consoleByPattern[key] = (consoleByPattern[key] || 0) + 1;
    }
  }
  const consoleGrouped = Object.entries(consoleByPattern)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, n]) => `- ${n}× ${k}`)
    .join("\n");

  const md = `# Smoke Test Oxy Growth OS — 2026-05-04

**Auth:** ${auth.authed ? `OK (${auth.mode})` : `FALHOU (${auth.error})`}
**Email novo gerado:** ${NEW_EMAIL}
**Senha:** ${PASSWORD}
**Fallback email:** ${FALLBACK_EMAIL}

## Resumo
- Total de rotas testadas: **${total}**
- OK: **${counts.OK}**
- Quebradas: **${counts.quebrado}**
- Parciais: **${counts.parcial}**
- Mock/demo: **${counts.mock}**

## Tabela de rotas

| Rota | Status | console.error | net 4xx/5xx | Nota | Screenshot |
|---|---|---|---|---|---|
${tableRows}

## Bugs críticos (rota quebrada / impede uso)

${critical || "_Nenhum_"}

## Bugs altos (rota carrega mas tem problema)

${high || "_Nenhum_"}

## Modo mock/demo confirmado

${mockSection || "_Nenhum_"}

## Interações principais

${interactionFindings.map((f) => `- ${f}`).join("\n") || "_Nenhuma_"}

## Sugestões pro CTO (padrões agrupados)

### Top falhas de rede agrupadas
${netGrouped || "_Sem 4xx/5xx significativos_"}

### Top erros de console agrupados
${consoleGrouped || "_Sem erros significativos_"}

---
_Gerado por Playwright smoke test em ${new Date().toISOString()}_
`;

  fs.writeFileSync(REPORT_PATH, md);
  // Don't fail the test — this is reporting, not gating
  expect(results.length).toBeGreaterThan(0);
});
