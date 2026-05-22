import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import logoOxy from "@/assets/logo-oxy.png";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  // No login só exigimos que a senha esteja preenchida — quem define o
  // requisito de tamanho é o Supabase. Contas antigas podem ter senhas
  // mais curtas do que o limite atual.
  password: z.string().min(1, "Informe sua senha"),
});

const signupSchema = z.object({
  fullName: z.string().min(2, "Informe seu nome completo"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const nextParam = searchParams.get("next");
  const nextPath = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/app";

  useEffect(() => {
    if (!loading && user) navigate(nextPath, { replace: true });
  }, [user, loading, navigate, nextPath]);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const onLogin = async (values: LoginValues) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.toLowerCase().includes("invalid")
        ? "Email ou senha incorretos"
        : error.message;
      toast.error(msg);
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate(nextPath, { replace: true });
  };

  const onSignup = async (values: SignupValues) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}${nextPath}`,
        data: { full_name: values.fullName },
      },
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.toLowerCase().includes("already")
        ? "Este email já está cadastrado"
        : error.message;
      toast.error(msg);
      return;
    }
    toast.success("Conta criada! Vamos configurar seu perfil.");
    navigate(nextPath === "/app" ? "/onboarding" : nextPath, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <img src={logoOxy} alt="Oxy Growth OS" className="h-10 w-10" />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight">Oxy Growth OS</span>
            <span className="text-[11px] text-muted-foreground">por O2 Inc.</span>
          </div>
        </Link>

        <Card className="p-6 md:p-8 shadow-elevated">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Acesse seu workspace do time de Growth.
                </p>
              </div>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input type="email" placeholder="voce@o2inc.com" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input type="password" placeholder="••••••••" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Crie sua conta</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Acesso liberado imediato — sem confirmação por email.
                </p>
              </div>
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <FormField
                    control={signupForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Seu nome" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input type="email" placeholder="voce@o2inc.com" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input type="password" placeholder="Mínimo 8 caracteres" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Criar conta
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ferramenta interna · O2 Inc.
        </p>
      </div>
    </div>
  );
};

export default Auth;