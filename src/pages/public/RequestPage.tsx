import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet as RawHelmet } from "react-router-dom"; // not used; placeholder removed below
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoOxy from "@/assets/logo-oxy.png";

// (removendo import errado de Helmet acima)
void RawHelmet;

interface FormSchemaField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "email" | "url" | "date";
  required?: boolean;
  placeholder?: string;
}

interface FormDef {
  id: string;
  title: string;
  description: string | null;
  schema: { fields?: FormSchemaField[] };
  active: boolean;
}

const DEFAULT_FIELDS: FormSchemaField[] = [
  { name: "title", label: "Título da demanda", type: "text", required: true, placeholder: "Ex: Post no Instagram sobre lançamento" },
  { name: "description", label: "Descreva sua solicitação", type: "textarea", required: true, placeholder: "Detalhe objetivos, contexto e prazo desejado…" },
  { name: "deadline", label: "Prazo desejado (opcional)", type: "date" },
  { name: "links", label: "Links de referência (opcional)", type: "text", placeholder: "https://…" },
];

export default function RequestPage() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<FormDef | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ approval_url: string } | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    document.title = "Solicitar — Oxy Growth OS";
  }, []);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("demand_forms")
        .select("id, title, description, schema, active")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) toast.error("Erro: " + error.message);
      setForm((data as unknown as FormDef) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  const fields = useMemo<FormSchemaField[]>(() => {
    const f = form?.schema?.fields;
    return Array.isArray(f) && f.length ? f : DEFAULT_FIELDS;
  }, [form]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    for (const f of fields) {
      if (f.required && !(values[f.name] ?? "").trim()) {
        toast.error(`Preencha "${f.label}"`);
        return;
      }
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("process-demand", {
      body: {
        action: "submit",
        slug,
        payload: values,
        requester_name: name || undefined,
        requester_email: email || undefined,
      },
    });
    setSubmitting(false);
    if (error || (data as { error?: unknown })?.error) {
      toast.error("Erro ao enviar: " + (error?.message ?? "tente novamente"));
      return;
    }
    setDone({ approval_url: (data as { approval_url: string }).approval_url });
  };

  if (loading) {
    return (
      <Shell>
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </Shell>
    );
  }

  if (!form) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Formulário não encontrado</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O link pode estar incorreto ou o formulário foi desativado.
        </p>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-3 text-2xl font-bold">Solicitação enviada!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você receberá uma resposta em breve. Guarde o link de
            acompanhamento abaixo:
          </p>
          <code className="mt-3 inline-block break-all rounded-md border bg-muted/40 p-2 text-xs">
            {done.approval_url}
          </code>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold tracking-tight">{form.title}</h1>
      {form.description && (
        <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        {fields.map((f) => (
          <div key={f.name} className="space-y-1.5">
            <Label htmlFor={f.name}>
              {f.label}
              {f.required && <span className="ml-0.5 text-destructive">*</span>}
            </Label>
            {f.type === "textarea" ? (
              <Textarea
                id={f.name}
                rows={4}
                placeholder={f.placeholder}
                value={values[f.name] ?? ""}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                maxLength={4000}
              />
            ) : (
              <Input
                id={f.name}
                type={f.type === "date" ? "date" : f.type ?? "text"}
                placeholder={f.placeholder}
                value={values[f.name] ?? ""}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                maxLength={500}
              />
            )}
          </div>
        ))}

        <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Seu nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Seu email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={180}
            />
          </div>
        </div>

        <Button type="submit" disabled={submitting} size="lg" className="w-full">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Enviar solicitação
        </Button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <header className="mb-6 flex items-center gap-2">
          <img src={logoOxy} alt="Oxy" className="h-8 w-8" />
          <span className="text-sm font-bold tracking-tight">Oxy Growth OS</span>
        </header>
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}