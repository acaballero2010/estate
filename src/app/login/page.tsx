"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2,
  KeyRound,
  LogIn,
  ShieldCheck,
  UserPlus,
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
      const message =
        error instanceof Error ? error.message : "Google Sign-In failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-12 items-center">
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
                className="w-full text-xs h-9"
                disabled={isSubmitting}
                onClick={handleGoogleLogin}
              >
                Continue with Google Workspace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

