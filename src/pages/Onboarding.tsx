import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Sparkles, Megaphone, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import logoOxy from "@/assets/logo-oxy.png";

const schema = z.object({
  displayName: z.string().min(2, "Como prefere ser chamado?"),
  role: z.string().min(2, "Informe seu cargo"),
});

type Values = z.infer<typeof schema>;

const squads = [
  { key: "ia", name: "IA & Automação", icon: Sparkles, color: "squad-ia" },
  { key: "marketing", name: "Marketing", icon: Megaphone, color: "squad-marketing" },
  { key: "expansao", name: "Expansão", icon: TrendingUp, color: "squad-expansao" },
] as const;

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [squad, setSquad] = useState<string>("marketing");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", role: "" },
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    supabase
      .from("profiles")
      .select("display_name, role_title")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          form.reset({
            displayName: data.display_name ?? "",
            role: data.role_title ?? "",
          });
        }
      });
  }, [user, loading, navigate, form]);

  const onSubmit = async (values: Values) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: values.displayName,
        role_title: values.role,
        preferences: { primary_squad: squad },
      })
      .eq("id", user.id);
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível salvar: " + error.message);
      return;
    }
    toast.success("Tudo pronto. Bem-vindo ao Oxy Growth OS!");
    navigate("/app", { replace: true });
  };

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
            <h1 className="text-2xl font-bold tracking-tight">Vamos personalizar sua experiência</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Leva menos de 30 segundos.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                          "group rounded-lg border p-4 text-left transition-all",
                          active
                            ? "border-primary bg-primary/5 shadow-soft"
                            : "border-border hover:border-primary/40 hover:bg-muted/40",
                        )}
                      >
                        <div
                          className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg"
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

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Concluir e entrar
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;