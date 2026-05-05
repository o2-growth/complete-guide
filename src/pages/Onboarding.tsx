import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2, Sparkles, Megaphone, TrendingUp, ArrowRight, ArrowLeft,
  Users, User, Building2, Wand2, Mail, X, Plus, SkipForward,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import logoOxy from "@/assets/logo-oxy.png";

const stepOneSchema = z.object({
  displayName: z.string().min(2, "Como prefere ser chamado?"),
  workspaceName: z.string().min(2, "Dê um nome ao seu workspace"),
  role: z.string().min(2, "Informe seu cargo"),
});

type StepOneValues = z.infer<typeof stepOneSchema>;

const squads = [
  { key: "ia", name: "IA & Automação", icon: Sparkles, color: "squad-ia" },
  { key: "marketing", name: "Marketing", icon: Megaphone, color: "squad-marketing" },
  { key: "expansao", name: "Expansão", icon: TrendingUp, color: "squad-expansao" },
] as const;

type Persona = "agencia" | "freelancer" | "interno";

const personas: { id: Persona; icon: typeof Users; title: string; description: string }[] = [
  { id: "agencia", icon: Users, title: "Agência", description: "Múltiplos clientes, squads, calendário editorial." },
  { id: "freelancer", icon: User, title: "Freelancer / Solo", description: "Você + alguns clientes, foco em entrega." },
  { id: "interno", icon: Building2, title: "Time interno", description: "Marketing in-house ou produto." },
];

const TOTAL_STEPS = 3;

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { tenantId, loading: wsLoading } = useWorkspace();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [squad, setSquad] = useState<string>("marketing");

  // Step 2 — convites
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteDraft, setInviteDraft] = useState("");

  // Step 3 — persona / seed
  const [persona, setPersona] = useState<Persona | null>(null);
  const [seeding, setSeeding] = useState(false);

  const form = useForm<StepOneValues>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: { displayName: "", workspaceName: "", role: "" },
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    Promise.all([
      supabase.from("profiles").select("display_name, role_title").eq("id", user.id).maybeSingle(),
      tenantId
        ? supabase.from("tenants").select("name").eq("id", tenantId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]).then(([{ data: profile }, { data: tenant }]) => {
      form.reset({
        displayName: profile?.display_name ?? "",
        role: profile?.role_title ?? "",
        workspaceName: tenant?.name ?? "",
      });
    });
  }, [user, loading, tenantId, navigate, form]);

  const saveStepOne = async (values: StepOneValues) => {
    if (!user) return false;
    setSubmitting(true);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: values.displayName,
        role_title: values.role,
        preferences: { primary_squad: squad },
      })
      .eq("id", user.id);

    if (profileError) {
      setSubmitting(false);
      toast.error("Não foi possível salvar: " + profileError.message);
      return false;
    }

    if (tenantId) {
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({ name: values.workspaceName })
        .eq("id", tenantId);
      if (tenantError) {
        setSubmitting(false);
        toast.error("Não foi possível atualizar o workspace: " + tenantError.message);
        return false;
      }
    }

    setSubmitting(false);
    return true;
  };

  const handleStepOneNext = form.handleSubmit(async (values) => {
    const ok = await saveStepOne(values);
    if (ok) setStep(2);
  });

  const addInviteEmail = () => {
    const email = inviteDraft.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("E-mail inválido");
      return;
    }
    if (inviteEmails.includes(email)) {
      setInviteDraft("");
      return;
    }
    setInviteEmails([...inviteEmails, email]);
    setInviteDraft("");
  };

  const removeInvite = (email: string) => {
    setInviteEmails(inviteEmails.filter((e) => e !== email));
  };

  const sendInvitesAndAdvance = async () => {
    if (!tenantId || inviteEmails.length === 0) {
      setStep(3);
      return;
    }
    setSubmitting(true);
    try {
      const rows = inviteEmails.map((email) => ({
        tenant_id: tenantId,
        email,
        role: "specialist" as const,
      }));
      const { data: created, error } = await supabase
        .from("invitations")
        .insert(rows)
        .select("id");
      if (error) throw error;

      // Best-effort: dispara e-mails (silencioso se falhar)
      await Promise.all(
        (created ?? []).map((inv) =>
          supabase.functions.invoke("send-invite", { body: { invitation_id: inv.id } }).catch(() => null),
        ),
      );

      toast.success(`${inviteEmails.length} convite(s) enviado(s)`);
      setStep(3);
    } catch (e) {
      toast.error("Não foi possível enviar agora", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const finishWithSeed = async () => {
    if (!persona) {
      navigate("/app", { replace: true });
      return;
    }
    setSeeding(true);
    try {
      const { error } = await supabase.rpc("seed_sample_data", { _persona: persona });
      if (error) throw error;
      toast.success("Dados de exemplo criados!", { description: "Você já pode explorar." });
    } catch (e) {
      toast.error("Não foi possível gerar exemplos agora", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setSeeding(false);
      navigate("/app", { replace: true });
    }
  };

  const skipToApp = () => {
    toast.success("Tudo pronto. Bem-vindo ao Oxy Growth OS!");
    navigate("/app", { replace: true });
  };

  const progressValue = (step / TOTAL_STEPS) * 100;
  const busy = submitting || seeding || loading || wsLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-center justify-center gap-3">
          <img src={logoOxy} alt="Oxy Growth OS" className="h-10 w-10" />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight">Oxy Growth OS</span>
            <span className="text-[11px] text-muted-foreground">por O2 Inc.</span>
          </div>
        </div>

        <Card className="p-6 md:p-8 shadow-elevated">
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Passo {step} de {TOTAL_STEPS}</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          {step === 1 && (
            <div key="step-1" className="animate-fade-in">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Vamos preparar seu workspace</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Leva menos de um minuto.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={handleStepOneNext} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="workspaceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do workspace</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: Agência Oxy / Time Growth" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Como prefere ser chamado(a)?</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: Lucas" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo / função</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: Gestor de Tráfego" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <p className="mb-2 text-sm font-medium">Squad principal</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {squads.map((s) => {
                        const active = squad === s.key;
                        return (
                          <button
                            type="button"
                            key={s.key}
                            onClick={() => setSquad(s.key)}
                            className={cn(
                              "group rounded-lg border p-3 text-left transition-all",
                              active
                                ? "border-primary bg-primary/5 shadow-soft"
                                : "border-border hover:border-primary/40 hover:bg-muted/40",
                            )}
                          >
                            <div
                              className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `hsl(var(--${s.color}) / 0.12)` }}
                            >
                              <s.icon className="h-4 w-4" style={{ color: `hsl(var(--${s.color}))` }} />
                            </div>
                            <div className="text-sm font-semibold">{s.name}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={busy}
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {step === 2 && (
            <div key="step-2" className="animate-fade-in space-y-5">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Convide seu time</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adicione e-mails agora ou faça depois em Configurações.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail do colega</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="colega@empresa.com"
                      value={inviteDraft}
                      onChange={(e) => setInviteDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addInviteEmail();
                        }
                      }}
                      className="pl-9"
                    />
                  </div>
                  <Button type="button" variant="secondary" onClick={addInviteEmail}>
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {inviteEmails.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {inviteEmails.length} pessoa(s) na fila
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {inviteEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeInvite(email)}
                          className="rounded-full hover:bg-primary/20"
                          aria-label={`Remover ${email}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={busy}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="ghost" onClick={() => setStep(3)} disabled={busy}>
                    <SkipForward className="h-4 w-4" />
                    Faço depois
                  </Button>
                  <Button
                    type="button"
                    variant="hero"
                    onClick={sendInvitesAndAdvance}
                    disabled={busy || inviteEmails.length === 0}
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Enviar convites
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div key="step-3" className="animate-fade-in space-y-5">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Como você trabalha?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Podemos criar um projeto exemplo com tarefas pré-prontas. Pode arquivar a qualquer momento.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {personas.map((p) => {
                  const active = persona === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPersona(p.id)}
                      className={cn(
                        "rounded-lg border p-4 text-left transition-all",
                        active
                          ? "border-primary bg-primary/5 shadow-soft ring-2 ring-primary/30"
                          : "border-border hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <p.icon className="mb-2 h-5 w-5 text-primary" />
                      <div className="text-sm font-semibold">{p.title}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(2)} disabled={busy}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="ghost" onClick={skipToApp} disabled={busy}>
                    <SkipForward className="h-4 w-4" />
                    Faço depois
                  </Button>
                  <Button
                    type="button"
                    variant="hero"
                    onClick={finishWithSeed}
                    disabled={busy}
                  >
                    {seeding && <Loader2 className="h-4 w-4 animate-spin" />}
                    {persona ? (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Criar exemplo e entrar
                      </>
                    ) : (
                      "Concluir"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
