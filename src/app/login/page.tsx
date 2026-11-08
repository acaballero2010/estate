"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  Building2,
  KeyRound,
  LogIn,
  ShieldCheck,
  UserPlus,
  ArrowLeft,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid agent email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginInput = z.infer<typeof LoginSchema>;

const RegisterSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().trim().min(7, "Enter a valid mobile / Viber number"),
  role: z.enum(["AGENT", "TEAM_LEADER", "BROKER"]),
  prcLicenseNumber: z
    .string()
    .trim()
    .min(3, "Enter PRC License or Accreditation No."),
  agencyName: z.string().trim().min(2, "Brokerage or agency name is required"),
});

type RegisterInput = z.infer<typeof RegisterSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { signInWithEmail, registerAgent, signInWithGoogle, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      router.push("/pipeline");
    }
  }, [user, router]);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "+63 917 ",
      role: "AGENT",
      prcLicenseNumber: "PRC #00",
      agencyName: "PropFlow Realty Group",
    },
  });

  const handleLoginSubmit = async (values: LoginInput) => {
    try {
      setIsSubmitting(true);
      await signInWithEmail(values.email, values.password);
      toast.success("Signed in to PropFlow CRM!");
      router.push("/pipeline");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (values: RegisterInput) => {
    try {
      setIsSubmitting(true);
      await registerAgent(values);
      toast.success(
        `Welcome to PropFlow CRM, ${values.fullName}! Your agent account is active.`
      );
      router.push("/pipeline");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      await signInWithGoogle();
      toast.success("Signed in with Google!");
      router.push("/pipeline");
    } catch (error) {
      const err = error as { code?: string; message?: string };
      if (err?.code === "auth/unauthorized-domain") {
        const currentHostname =
          typeof window !== "undefined" ? window.location.hostname : "current domain";
        toast.error(
          `Domain "${currentHostname}" is not authorized in Firebase Console. If accessing via 127.0.0.1, switch your browser URL to http://localhost:3000/login or add "${currentHostname}" in Firebase Console > Authentication > Settings > Authorized Domains.`,
          { duration: 10000 }
        );
      } else if (err?.code === "auth/popup-closed-by-user") {
        toast.info("Google Sign-In popup was closed before completing.");
      } else {
        const message =
          error instanceof Error ? error.message : "Google Sign-In failed";
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    try {
      setIsSubmitting(true);
      await signInWithEmail("marco.reyes@propflow.ph", "PropFlow2026!");
      toast.success("Signed in with Demo Broker Account (Marco Reyes)!");
      router.push("/pipeline");
    } catch {
      try {
        await registerAgent({
          fullName: "Marco Reyes, REB",
          email: "marco.reyes@propflow.ph",
          password: "PropFlow2026!",
          phone: "+63 917 880 1122",
          role: "BROKER",
          prcLicenseNumber: "PRC #0031842",
          agencyName: "PropFlow Realty Group",
        });
        toast.success("Demo Broker Account registered & signed in!");
        router.push("/pipeline");
      } catch {
        toast.error("Could not sign in with demo broker credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Standalone Quiet Luxury Brand Header */}
      <header className="border-b bg-card/60 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-serif font-normal tracking-tight leading-none">
              PropFlow
            </span>
            <span className="text-[9px] font-sans font-medium uppercase tracking-widest text-muted-foreground mt-0.5">
              Estates &amp; Advisory
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" asChild>
            <Link href="/showcase">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back to</span> Showcase
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
            <Link href="/inquire">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Client Portal</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-12 items-center">
        {/* Left Branding & Value Prop Panel */}
        <div className="space-y-4 lg:col-span-5">
          <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <Building2 className="h-4 w-4" />
            Firebase Auth • Real Estate Portal
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            PropFlow Agent & Broker Portal
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Sign in or register your PRC / DHSUD accredited profile to manage leads, respond to Facebook Messenger inquiries, and export branded buyer quotations.
          </p>

          <div className="space-y-2.5 pt-2 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-pipeline-won shrink-0" />
              <span>
                Firebase Authentication (`propflow-crm-estate-2026`)
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-pipeline-won shrink-0" />
              <span>
                Custom Agent Branding on Exported PDF Quotations
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-pipeline-won shrink-0" />
              <span>
                Isolated Lead Pipeline & Commission Split Tracking
              </span>
            </div>
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="lg:col-span-7">
          <Card className="border shadow-md">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  Agent Authentication
                </CardTitle>
                <Badge variant="new" className="text-[10px]">
                  Firebase Live
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Use Email/Password or Google Sign-In to access your sales workspace.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-2 space-y-4">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="login" className="text-xs gap-1.5">
                    <LogIn className="h-3.5 w-3.5" />
                    Agent Sign In
                  </TabsTrigger>
                  <TabsTrigger value="register" className="text-xs gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" />
                    Register New Agent
                  </TabsTrigger>
                </TabsList>

                {/* SIGN IN TAB */}
                <TabsContent value="login" className="mt-4 space-y-3">
                  <form
                    onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                    className="space-y-3"
                  >
                    <div className="space-y-1">
                      <Label htmlFor="login-email">Work Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="agent@propflow.ph"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-[11px] text-destructive">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-[11px] text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full text-xs h-9"
                      disabled={isSubmitting}
                    >
                      <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                      {isSubmitting ? "Signing In..." : "Sign In with Email"}
                    </Button>
                  </form>
                </TabsContent>

                {/* REGISTER TAB */}
                <TabsContent value="register" className="mt-4 space-y-3">
                  <form
                    onSubmit={registerForm.handleSubmit(handleRegisterSubmit)}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="reg-name">Full Name (with Title)</Label>
                        <Input
                          id="reg-name"
                          placeholder="e.g. Clarisse Santos, REB"
                          {...registerForm.register("fullName")}
                        />
                        {registerForm.formState.errors.fullName && (
                          <p className="text-[11px] text-destructive">
                            {registerForm.formState.errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="reg-role">Accredited Role</Label>
                        <select
                          id="reg-role"
                          {...registerForm.register("role")}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                        >
                          <option value="AGENT">Accredited Salesperson</option>
                          <option value="TEAM_LEADER">Unit / Team Manager</option>
                          <option value="BROKER">Licensed Real Estate Broker</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="reg-email">Email Address</Label>
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="clarisse@propflow.ph"
                          {...registerForm.register("email")}
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-[11px] text-destructive">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="reg-password">Password</Label>
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="Min. 6 characters"
                          {...registerForm.register("password")}
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-[11px] text-destructive">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="reg-prc">
                          PRC License / Accreditation #
                        </Label>
                        <Input
                          id="reg-prc"
                          placeholder="PRC #0031842"
                          {...registerForm.register("prcLicenseNumber")}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="reg-phone">Mobile / Viber Number</Label>
                        <Input
                          id="reg-phone"
                          placeholder="+63 917 880 1122"
                          {...registerForm.register("phone")}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reg-agency">
                        Realty Brokerage / Developer Team
                      </Label>
                      <Input
                        id="reg-agency"
                        {...registerForm.register("agencyName")}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full text-xs h-9"
                      disabled={isSubmitting}
                    >
                      <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                      {isSubmitting
                        ? "Creating Agent Account..."
                        : "Create Agent Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full text-xs h-9 gap-2"
                disabled={isSubmitting}
                onClick={handleGoogleLogin}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.5 1.9 7.1l3.7 2.8C6.5 7.1 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.8c2.2-2 3.7-5 3.7-8.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1L1.9 7.1C.7 9.5 0 10.7 0 12s.7 2.5 1.9 4.9l3.7-2.8z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.8c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-4.9L1.9 16.3C3.7 20.3 7.5 23 12 23z"
                  />
                </svg>
                Continue with Google Workspace
              </Button>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs h-8 gap-1.5 border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary"
                  disabled={isSubmitting}
                  onClick={handleDemoSignIn}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Instant Sign-In with Demo Broker Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  </div>
  );
}

