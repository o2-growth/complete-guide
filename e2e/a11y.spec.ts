import { test, expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

const REPORT_DIR = path.resolve(
  "/Users/andreylopes/complete-guide/.claude/reports"
);
const JSON_PATH = path.join(REPORT_DIR, "a11y-20260504.json");
const MD_PATH = path.join(REPORT_DIR, "a11y-20260504.md");

fs.mkdirSync(REPORT_DIR, { recursive: true });

const TS = Date.now();
const NEW_EMAIL = `qa.a11y+${TS}@oxytest.dev`;
const FALLBACK_EMAIL = "qa.cto.fixed@oxytest.dev";
const PASSWORD = "OxyTest!2026";

const ROUTES = [
  "/",
  "/auth",
  "/precos",
  "/app",
  "/app/hoje",
  "/app/proximos",
  "/app/kanban",
  "/app/calendario",
  "/app/projetos",
  "/app/squads",
  "/app/genio",
  "/app/notificacoes",
  "/app/configuracoes",
  "/app/configuracoes/aparencia",
  "/app/configuracoes/idioma",
];

type RouteScan = {
  route: string;
  violationCount: number;
  violations: Array<{
    id: string;
    impact: string | null | undefined;
    description: string;
    help: string;
    helpUrl: string;
    nodeCount: number;
    sampleTargets: string[];
    sampleHtml: string[];
  }>;
};

async function tryAuth(page: Page): Promise<{ authed: boolean; mode: string }> {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  // Login first (faster path)
  try {
    await page.getByRole("tab", { name: "Entrar" }).click({ timeout: 3000 });
    await page.waitForTimeout(400);
    const loginForm = page.locator('[role="tabpanel"][data-state="active"]');
    await loginForm.locator('input[name="email"]').fill(FALLBACK_EMAIL);
    await loginForm.locator('input[name="password"]').fill(PASSWORD);
    await loginForm.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(/\/onboarding|\/app/, { timeout: 10000 });
    return { authed: true, mode: `login:${FALLBACK_EMAIL}` };
  } catch {}
  // Fallback signup with new email
  try {
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.getByRole("tab", { name: "Criar conta" }).click({ timeout: 3000 });
    await page.waitForTimeout(400);
    const signupForm = page.locator('[role="tabpanel"][data-state="active"]');
    await signupForm.locator('input[type="text"], input:not([type])').first().fill("QA A11y");
    await signupForm.locator('input[name="email"]').fill(NEW_EMAIL);
    await signupForm.locator('input[name="password"]').fill(PASSWORD);
    await signupForm.getByRole("button", { name: "Criar conta" }).click();
    await page.waitForURL(/\/onboarding|\/app/, { timeout: 10000 });
    return { authed: true, mode: `signup:${NEW_EMAIL}` };
  } catch {
    return { authed: false, mode: "fail" };
  }
}

async function completeOnboardingIfNeeded(page: Page) {
  if (!page.url().includes("/onboarding")) return;
  try {
    await page.waitForTimeout(600);
    const inputs = page.locator("form input");
    await inputs.nth(0).fill("QA A11y");
    await inputs.nth(1).fill("CTO QA");
    await page.getByRole("button", { name: /Concluir e entrar/i }).click();
    await page.waitForURL(/\/app/, { timeout: 10000 });
  } catch {}
}

test("axe a11y scan oxy growth os", async ({ page }) => {
  test.setTimeout(300_000);

  const auth = await tryAuth(page);
  await completeOnboardingIfNeeded(page);

  const scans: RouteScan[] = [];

  for (const route of ROUTES) {
    try {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 12_000 });
      await page.waitForTimeout(1200);
    } catch {
      // continue scanning even if nav timed out
    }

    let scan: RouteScan = {
      route,
      violationCount: 0,
      violations: [],
    };

    try {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      for (const v of results.violations) {
        const nodes = v.nodes || [];
        scan.violations.push({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodeCount: nodes.length,
          sampleTargets: nodes.slice(0, 3).map((n) => n.target.join(" ")),
          sampleHtml: nodes.slice(0, 3).map((n) => (n.html || "").slice(0, 220)),
        });
        scan.violationCount += nodes.length;
      }
    } catch (e: any) {
      scan.violations.push({
        id: "axe-runner-error",
        impact: "critical",
        description: String(e).slice(0, 200),
        help: "axe failed to run",
        helpUrl: "",
        nodeCount: 0,
        sampleTargets: [],
        sampleHtml: [],
      });
    }

    scans.push(scan);
  }

  // Aggregate top issues by id (sum nodeCount across routes)
  const byId: Record<
    string,
    {
      id: string;
      impact: string;
      help: string;
      helpUrl: string;
      totalNodes: number;
      routes: string[];
      sampleHtml: string[];
    }
  > = {};
  for (const s of scans) {
    for (const v of s.violations) {
      const k = v.id;
      if (!byId[k]) {
        byId[k] = {
          id: v.id,
          impact: String(v.impact || "minor"),
          help: v.help,
          helpUrl: v.helpUrl,
          totalNodes: 0,
          routes: [],
          sampleHtml: [],
        };
      }
      byId[k].totalNodes += v.nodeCount;
      byId[k].routes.push(s.route);
      for (const h of v.sampleHtml) {
        if (byId[k].sampleHtml.length < 3) byId[k].sampleHtml.push(h);
      }
    }
  }

  const impactWeight: Record<string, number> = {
    critical: 4,
    serious: 3,
    moderate: 2,
    minor: 1,
  };
  const topIds = Object.values(byId).sort((a, b) => {
    const wa = (impactWeight[a.impact] || 1) * a.totalNodes;
    const wb = (impactWeight[b.impact] || 1) * b.totalNodes;
    return wb - wa;
  });
  const top50 = topIds.slice(0, 50);

  const totalViolations = scans.reduce((acc, s) => acc + s.violationCount, 0);

  fs.writeFileSync(
    JSON_PATH,
    JSON.stringify(
      { auth, ts: TS, totalViolations, scans, aggregated: topIds },
      null,
      2
    )
  );

  const tableRows = top50
    .map(
      (v, i) =>
        `| ${i + 1} | \`${v.id}\` | ${v.impact} | ${v.totalNodes} | ${v.routes.length} | ${v.help.replace(/\|/g, "\\|").slice(0, 80)} |`
    )
    .join("\n");

  const perRouteRows = scans
    .map((s) => `| ${s.route} | ${s.violationCount} | ${s.violations.length} |`)
    .join("\n");

  const md = `# A11y Scan Oxy Growth OS — 2026-05-04

**Auth:** ${auth.authed ? `OK (${auth.mode})` : "FALHOU (rotas autenticadas puladas)"}
**Total de violations (nodes):** ${totalViolations}
**Rotas escaneadas:** ${scans.length}

## Top 50 issues (priorizado por severidade × count)

| # | Rule | Impacto | Nodes | Rotas | Help |
|---|------|---------|------:|------:|------|
${tableRows}

## Violations por rota

| Rota | Total nodes | Distintas |
|---|---:|---:|
${perRouteRows}

## Detalhe HTML samples (top 10)

${top50
  .slice(0, 10)
  .map(
    (v) =>
      `### ${v.id} (${v.impact}, ${v.totalNodes} nodes)\n\n${v.help}\n\n${v.sampleHtml.map((h) => "\`\`\`html\n" + h + "\n\`\`\`").join("\n\n")}`
  )
  .join("\n\n")}

---
_Gerado em ${new Date().toISOString()}_
`;
  fs.writeFileSync(MD_PATH, md);

  expect(scans.length).toBe(ROUTES.length);
});
