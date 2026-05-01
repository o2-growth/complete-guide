/**
 * Oxy Growth OS — SDK público (TypeScript)
 *
 * Uso:
 *   const oxy = new OxyClient({ apiKey: "oxy_xxx" });
 *   const tasks = await oxy.tasks.list({ limit: 50 });
 *   await oxy.tasks.create({ title: "Nova tarefa" });
 */

export interface OxyClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface OxyTask {
  id: string;
  title: string;
  status?: string | null;
  priority?: number | null;
  due_at?: string | null;
  created_at: string;
}

export interface ListParams {
  limit?: number;
  offset?: number;
}

class HttpClient {
  constructor(private opts: Required<OxyClientOptions>) {}
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.opts.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.opts.apiKey,
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Oxy API ${res.status}: ${text || res.statusText}`);
    }
    return (await res.json()) as T;
  }
}

export class OxyClient {
  private http: HttpClient;
  constructor(opts: OxyClientOptions) {
    const baseUrl =
      opts.baseUrl ??
      "https://dboftogzjobfvtjaoifh.supabase.co/functions/v1/api-public";
    this.http = new HttpClient({ apiKey: opts.apiKey, baseUrl });
  }

  ping() {
    return this.http.request<{ ok: boolean }>("/ping");
  }

  tasks = {
    list: (params: ListParams = {}) => {
      const qs = new URLSearchParams();
      if (params.limit) qs.set("limit", String(params.limit));
      if (params.offset) qs.set("offset", String(params.offset));
      const suffix = qs.toString() ? `?${qs}` : "";
      return this.http.request<OxyTask[]>(`/tasks${suffix}`);
    },
    create: (input: { title: string; description?: string; project_id?: string }) =>
      this.http.request<OxyTask>("/tasks", { method: "POST", body: JSON.stringify(input) }),
  };

  projects = {
    list: () => this.http.request<Array<{ id: string; name: string }>>("/projects"),
  };

  anomalies = {
    list: () => this.http.request<Array<{ id: string; severity: string; metric: string }>>("/anomalies"),
  };
}

export default OxyClient;
