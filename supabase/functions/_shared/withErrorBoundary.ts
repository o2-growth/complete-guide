export interface ErrorBoundaryOpts {
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
  fallback?: () => unknown;
  source: string;
}

function log(entry: Record<string, unknown>) {
  try { console.log(JSON.stringify({ scope: "ai-error-boundary", ts: new Date().toISOString(), ...entry })); }
  catch { console.log("ai-error-boundary log error"); }
}

/**
 * Executa `fn` com timeout (AbortController), retry exponencial com jitter e fallback.
 * Logs estruturados em JSON. Pensado para envolver chamadas ao Lovable AI Gateway.
 */
export async function withErrorBoundary<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  opts: ErrorBoundaryOpts,
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 25_000;
  const retries = opts.retries ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 500;
  let lastErr: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    const started = Date.now();
    try {
      const out = await fn(ctrl.signal);
      clearTimeout(timer);
      log({ source: opts.source, attempt, status: "ok", duration_ms: Date.now() - started });
      return out;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      const errorMsg = err instanceof Error ? err.message : String(err);
      log({
        source: opts.source, attempt, status: "error",
        error: errorMsg, duration_ms: Date.now() - started,
        aborted: ctrl.signal.aborted,
      });
      if (attempt < retries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  if (opts.fallback) {
    log({ source: opts.source, status: "fallback", error: lastErr instanceof Error ? lastErr.message : String(lastErr) });
    return opts.fallback() as T;
  }
  throw lastErr;
}