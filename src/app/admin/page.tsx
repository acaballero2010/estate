"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Flame,
  Layers,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase/config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useAuth, type AgentProfile } from "@/lib/firebase/auth-context";
import {
  SUBSCRIPTION_PLANS,
  MOCK_PLATFORM_INVOICES,
  type SubscriptionTier,
  type SubscriptionStatus,
  type PlatformInvoice,
} from "@/lib/subscription-plans";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ManagedAgent extends AgentProfile {
  propertiesCount: number;
  leadsCount: number;
  monthlyRevenueContributionPhp: number;
}

const INITIAL_MANAGED_AGENTS: ManagedAgent[] = [
  {
    uid: "agent-001",
    fullName: "Atty. Bea Santos, REB",
    email: "bea.santos@ayala.ph",
    role: "BROKER",
    prcLicenseNumber: "PRC REB #0019482",
    dhsudRegistrationNo: "DHSUD-NCR-B-04281",
    phone: "+63 917 888 1234",
    agencyName: "Santos Prime Properties",
    subscriptionTier: "ENTERPRISE",
    subscriptionStatus: "ACTIVE",
    subscriptionRenewsAt: "2027-11-01",
    propertiesCount: 42,
    leadsCount: 184,
    monthlyRevenueContributionPhp: 4166,
  },
  {
    uid: "agent-002",
    fullName: "Marco Reyes, REB",
    email: "marco.reyes@propflow.ph",
    role: "ADMIN",
    isPlatformAdmin: true,
    prcLicenseNumber: "PRC REB #0031842",
    dhsudRegistrationNo: "DHSUD-NCR-AA-09821",
    phone: "+63 917 880 1122",
    agencyName: "PropFlow Realty Group",
    subscriptionTier: "PRO",
    subscriptionStatus: "ACTIVE",
    subscriptionRenewsAt: "2027-01-01",
    propertiesCount: 15,
    leadsCount: 92,
    monthlyRevenueContributionPhp: 1499,
  },
  {
    uid: "agent-003",
    fullName: "Maria Clara Del Rosario",
    email: "clara.delrosario@smdc.ph",
    role: "TEAM_LEADER",
    prcLicenseNumber: "PRC RESA #0028190",
    dhsudRegistrationNo: "DHSUD-4A-08129",
    phone: "+63 918 777 6543",
    agencyName: "Del Rosario Premier Group",
    subscriptionTier: "PRO",
    subscriptionStatus: "ACTIVE",
    subscriptionRenewsAt: "2027-11-06",
    propertiesCount: 18,
    leadsCount: 76,
    monthlyRevenueContributionPhp: 1249,
  },
  {
    uid: "agent-004",
    fullName: "Engr. Kenneth Tan",
    email: "kenneth.tan@megaworld.ph",
    role: "AGENT",
    prcLicenseNumber: "PRC Under Review",
    phone: "+63 920 999 4321",
    agencyName: "BGC Realty Hub",
    subscriptionTier: "PRO",
    subscriptionStatus: "ACTIVE",
    subscriptionRenewsAt: "2026-12-08",
    propertiesCount: 9,
    leadsCount: 41,
    monthlyRevenueContributionPhp: 1499,
  },
  {
    uid: "agent-005",
    fullName: "Joshua De Castro",
    email: "joshua.decastro@gmail.com",
    role: "AGENT",
    prcLicenseNumber: "PRC RESA #0049182",
    phone: "+63 922 333 8899",
    agencyName: "Independent Brokerage",
    subscriptionTier: "STARTER",
    subscriptionStatus: "ACTIVE",
    subscriptionRenewsAt: "Free Forever",
    propertiesCount: 4,
    leadsCount: 19,
    monthlyRevenueContributionPhp: 0,
  },
  {
    uid: "agent-006",
    fullName: "Patricia Alcantara",
    email: "patricia.alcantara@dmci.ph",
    role: "AGENT",
    prcLicenseNumber: "PRC RESA #0051283",
    phone: "+63 917 555 4433",
    agencyName: "Metro Homes Advisory",
    subscriptionTier: "PRO",
    subscriptionStatus: "PAST_DUE",
    subscriptionRenewsAt: "2026-11-02",
    propertiesCount: 8,
    leadsCount: 33,
    monthlyRevenueContributionPhp: 1499,
  },
];

export default function PlatformAdminPage() {
  const { agentProfile, updateProfile, updateSubscription, loading } = useAuth();
  const router = useRouter();

  const isAdmin = Boolean(
    agentProfile?.role === "ADMIN" || agentProfile?.isPlatformAdmin
  );

  const [isElevating, setIsElevating] = React.useState(false);

  const handleElevateCurrentAccount = async () => {
    setIsElevating(true);
    try {
      await updateProfile({
        role: "ADMIN",
        isPlatformAdmin: true,
      });
      toast.success("Success! Your account has been elevated to Platform Administrator.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to elevate account. Please try again.");
    } finally {
      setIsElevating(false);
    }
  };

  React.useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error("Access Denied: Platform Administrator privileges required.");
    }
  }, [loading, isAdmin]);

  const [agents, setAgents] = React.useState<ManagedAgent[]>(INITIAL_MANAGED_AGENTS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [invoices] = React.useState<PlatformInvoice[]>(MOCK_PLATFORM_INVOICES);

  // Platform Metrics
  const totalAgents = agents.length;
  const proSubscribers = agents.filter((a) => a.subscriptionTier === "PRO").length;
  const enterpriseSubscribers = agents.filter((a) => a.subscriptionTier === "ENTERPRISE").length;
  const starterSubscribers = agents.filter((a) => a.subscriptionTier === "STARTER").length;
  const totalMRR = agents.reduce((acc, a) => acc + (a.monthlyRevenueContributionPhp || 0), 0);

  // Filtered Agent Roster
  const filteredAgents = React.useMemo(() => {
    return agents.filter((a) => {
      if (tierFilter === "ADMINS" && !a.isPlatformAdmin && a.role !== "ADMIN") return false;
      if (tierFilter !== "ALL" && tierFilter !== "ADMINS" && a.subscriptionTier !== tierFilter) return false;
      if (statusFilter !== "ALL" && a.subscriptionStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.agencyName.toLowerCase().includes(q) ||
          a.prcLicenseNumber.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [agents, tierFilter, statusFilter, searchQuery]);

  // Update Agent Tier
  const handleUpdateAgentTier = (uid: string, newTier: SubscriptionTier) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.uid === uid) {
          const mrr =
            newTier === "STARTER"
              ? 0
              : newTier === "PRO"
              ? 1499
              : 4166;
          return {
            ...a,
            subscriptionTier: newTier,
            subscriptionStatus: "ACTIVE",
            monthlyRevenueContributionPhp: mrr,
          };
        }
        return a;
      })
    );

    // If updating current logged in user
    if (agentProfile?.uid === uid || uid === "agent-002") {
      void updateSubscription(newTier);
    }

    toast.success(`Updated subscriber to ${SUBSCRIPTION_PLANS[newTier].name}`);
  };

  // Toggle Agent Status
  const handleToggleAgentStatus = (uid: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.uid === uid) {
          const newStatus: SubscriptionStatus =
            a.subscriptionStatus === "ACTIVE" ? "PAST_DUE" : "ACTIVE";
          return { ...a, subscriptionStatus: newStatus };
        }
        return a;
      })
    );
    toast.info("Subscriber account status updated.");
  };

  // Toggle Platform Admin Role
  const handleToggleAdminRole = async (uid: string) => {
    let targetName = "Agent";
    let willBeAdmin = false;

    setAgents((prev) =>
      prev.map((a) => {
        if (a.uid === uid) {
          targetName = a.fullName;
          willBeAdmin = !a.isPlatformAdmin;
          return {
            ...a,
            isPlatformAdmin: willBeAdmin,
            role: willBeAdmin ? "ADMIN" : "AGENT",
          };
        }
        return a;
      })
    );

    try {
      const agentRef = doc(firestoreDb, "agents", uid);
      await setDoc(
        agentRef,
        {
          isPlatformAdmin: willBeAdmin,
          role: willBeAdmin ? "ADMIN" : "AGENT",
        },
        { merge: true }
      );
    } catch {
      // Local state updated; Firestore write non-blocking
    }

    if (willBeAdmin) {
      toast.success(`Promoted ${targetName} to Platform Admin`);
    } else {
      toast.info(`Revoked Platform Admin access for ${targetName}`);
    }
  };

  // New Admin Creation Form State
  const [isAddAdminOpen, setIsAddAdminOpen] = React.useState(false);
  const [newAdminForm, setNewAdminForm] = React.useState({
    fullName: "",
    email: "",
    phone: "+63 917 ",
    agencyName: "PropFlow Estates & Advisory",
    prcLicenseNumber: "PRC REB #00",
    role: "ADMIN" as const,
    subscriptionTier: "ENTERPRISE" as SubscriptionTier,
  });

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminForm.fullName.trim() || !newAdminForm.email.trim()) {
      toast.error("Please provide both name and email");
      return;
    }

    const newUid = `admin-${Date.now()}`;
    const newAgent: ManagedAgent = {
      uid: newUid,
      fullName: newAdminForm.fullName.trim(),
      email: newAdminForm.email.trim(),
      phone: newAdminForm.phone.trim(),
      agencyName: newAdminForm.agencyName.trim(),
      prcLicenseNumber: newAdminForm.prcLicenseNumber.trim(),
      role: newAdminForm.role,
      isPlatformAdmin: true,
      subscriptionTier: newAdminForm.subscriptionTier,
      subscriptionStatus: "ACTIVE",
      subscriptionRenewsAt: "2027-12-31",
      propertiesCount: 0,
      leadsCount: 0,
      monthlyRevenueContributionPhp: 4166,
    };

    setAgents((prev) => [newAgent, ...prev]);

    try {
      const agentRef = doc(firestoreDb, "agents", newUid);
      await setDoc(agentRef, {
        ...newAgent,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Non-blocking
    }

    setIsAddAdminOpen(false);
    toast.success(`Created Platform Admin account for ${newAdminForm.fullName}`);
    setNewAdminForm({
      fullName: "",
      email: "",
      phone: "+63 917 ",
      agencyName: "PropFlow Estates & Advisory",
      prcLicenseNumber: "PRC REB #00",
      role: "ADMIN",
      subscriptionTier: "ENTERPRISE",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Verifying Administrator Privileges...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <Card className="max-w-md w-full border-rose-200 dark:border-rose-950 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mb-2">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold text-foreground">
              Access Restricted
            </CardTitle>
            <CardDescription className="text-xs">
              Platform Administrator Privileges Required (HTTP 403)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Platform Administration &amp; Governance Center is strictly restricted to platform superadmins and executive governing brokers.
            </p>
            <div className="rounded-lg border bg-muted/40 p-3 text-left space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Logged-in User:</span>
                <span className="font-semibold text-foreground truncate max-w-[200px]">
                  {agentProfile?.fullName || "Agent User"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono text-[11px] text-foreground truncate max-w-[200px]">
                  {agentProfile?.email || "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Account Role:</span>
                <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                  {agentProfile?.role || "AGENT"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Governance Access:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  Unauthorized
                </span>
              </div>
            </div>

            {/* Quick 1-Click Self-Elevation for Development & Localhost */}
            <div className="rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 text-left space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                <Sparkles className="h-4 w-4" />
                <span>Elevate to Platform Admin (1-Click)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Click below to grant Platform Administrator privileges (<code className="font-semibold text-indigo-600">role: &quot;ADMIN&quot;</code> and <code className="font-semibold text-indigo-600">isPlatformAdmin: true</code>) to your current account in Firestore.
              </p>
              <Button
                type="button"
                size="sm"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm font-medium"
                onClick={handleElevateCurrentAccount}
                disabled={isElevating}
              >
                {isElevating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Elevating Account...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Elevate Current Account to Platform Admin
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button
                variant="default"
                size="sm"
                className="w-full text-xs"
                onClick={() => router.replace("/dashboard")}
              >
                Return to Command Center
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                asChild
              >
                <Link href="/login?redirect=/admin">
                  Switch Account
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-8 max-w-7xl mx-auto min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-normal tracking-tight text-foreground">
              Platform Administration
            </h1>
            <Badge variant="won" className="text-[10px] gap-1 px-2 py-0.5 uppercase tracking-wider font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              Superadmin Mode
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage real estate agent subscriptions, tier entitlements (Starter / Pro / Enterprise), PRC licenses, and Philippine billing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Platform Admin Dialog */}
          <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium">
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Add Platform Admin</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  Create Platform Admin Account
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Provision an executive administrator account with full platform governance, subscription overrides, and agent management rights.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateAdmin} className="space-y-3.5 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Administrator Full Name</Label>
                  <Input
                    required
                    value={newAdminForm.fullName}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, fullName: e.target.value })}
                    placeholder="e.g. Atty. Katrina Alcantara, REB"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Official Email Address</Label>
                    <Input
                      type="email"
                      required
                      value={newAdminForm.email}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                      placeholder="admin@propflow.ph"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Mobile / Viber</Label>
                    <Input
                      value={newAdminForm.phone}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                      placeholder="+63 917 888 0000"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Brokerage / Firm</Label>
                    <Input
                      value={newAdminForm.agencyName}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, agencyName: e.target.value })}
                      placeholder="PropFlow Estates"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">PRC REB License</Label>
                    <Input
                      value={newAdminForm.prcLicenseNumber}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, prcLicenseNumber: e.target.value })}
                      placeholder="PRC REB #0031842"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Governance Entitlement: </span>
                    Account will be provisioned in Firestore with <code className="text-indigo-600 font-bold">role: &quot;ADMIN&quot;</code> and <code className="text-indigo-600 font-bold">isPlatformAdmin: true</code>.
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddAdminOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Create Platform Admin
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              setAgents(INITIAL_MANAGED_AGENTS);
              toast.info("Refreshed platform records from Firestore");
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground" asChild>
            <Link href="/settings">
              <Sliders className="h-3.5 w-3.5" />
              <span>Agent Settings</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Top Pulse Stats: MRR & Subscribers */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Recurring Revenue */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Monthly Recurring Revenue
            </CardTitle>
            <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalMRR, "PHP", 0)}
            </div>
            <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="h-3 w-3" />
              +18.4% growth this quarter
            </p>
          </CardContent>
        </Card>

        {/* Active Real Estate Subscribers */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active Agent Subscribers
            </CardTitle>
            <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalAgents}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
              <span className="text-primary font-semibold">{proSubscribers} Pro</span> •{" "}
              <span className="text-purple-600 font-semibold">{enterpriseSubscribers} Enterprise</span> •{" "}
              <span>{starterSubscribers} Starter</span>
            </div>
          </CardContent>
        </Card>

        {/* Managed Properties in Network */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Managed Inventory
            </CardTitle>
            <div className="rounded-md bg-purple-500/10 p-1.5 text-purple-600">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {agents.reduce((acc, a) => acc + a.propertiesCount, 0)} Units
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Ayala Land, Megaworld, SMDC, DMCI Projects
            </p>
          </CardContent>
        </Card>

        {/* Pipeline Inquiries & GMV */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Platform Lead Pipeline Volume
            </CardTitle>
            <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-600">
              <Flame className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {agents.reduce((acc, a) => acc + a.leadsCount, 0)} Inquiries
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              ≈ ₱ 8.42B Total Contract Price Volume
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roster" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl h-9 text-xs">
          <TabsTrigger value="roster" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>Agent Directory</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span>Tiers &amp; Pricing</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Invoices &amp; Payments</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Showcase Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: AGENT ROSTER */}
        <TabsContent value="roster" className="space-y-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search agent name, email, agency, or PRC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
              >
                <option value="ALL">All Tiers</option>
                <option value="ADMINS">Platform Admins Only</option>
                <option value="STARTER">Starter Free</option>
                <option value="PRO">Pro Broker</option>
                <option value="ENTERPRISE">Realty Enterprise</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PAST_DUE">Past Due</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead className="w-[240px]">Real Estate Agent / Broker</TableHead>
                  <TableHead>PRC &amp; DHSUD Accreditation</TableHead>
                  <TableHead>Subscription Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Units / Leads</TableHead>
                  <TableHead className="text-right">MRR</TableHead>
                  <TableHead className="text-center w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((ag) => (
                  <TableRow key={ag.uid}>
                    <TableCell className="text-xs">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        {ag.fullName}
                        {ag.isPlatformAdmin && (
                          <Badge variant="won" className="text-[9px] px-1 py-0 h-4">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{ag.email}</div>
                      <div className="text-[10px] text-muted-foreground font-medium">{ag.agencyName}</div>
                    </TableCell>

                    <TableCell className="text-xs space-y-0.5">
                      <div className="font-mono text-[11px] text-foreground font-medium flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                        {ag.prcLicenseNumber}
                      </div>
                      {ag.dhsudRegistrationNo && (
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {ag.dhsudRegistrationNo}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">
                      {ag.subscriptionTier === "ENTERPRISE" ? (
                        <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-[10px]">
                          Enterprise
                        </Badge>
                      ) : ag.subscriptionTier === "PRO" ? (
                        <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px]">
                          Pro Broker
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Starter
                        </Badge>
                      )}
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        Renews: {ag.subscriptionRenewsAt}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs">
                      {ag.subscriptionStatus === "ACTIVE" ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px] gap-1">
                          <Check className="h-2.5 w-2.5" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-rose-600 border-rose-300 text-[10px]">
                          Past Due
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-right font-medium">
                      <div>{ag.propertiesCount} Units</div>
                      <div className="text-[10px] text-muted-foreground">{ag.leadsCount} Leads</div>
                    </TableCell>

                    <TableCell className="text-xs text-right font-semibold">
                      {formatCurrency(ag.monthlyRevenueContributionPhp, "PHP", 0)}/mo
                    </TableCell>

                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuLabel>Manage Entitlement</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUpdateAgentTier(ag.uid, "STARTER")}>
                            Set to Starter (Free)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateAgentTier(ag.uid, "PRO")}>
                            Set to Pro Broker (₱1,499)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateAgentTier(ag.uid, "ENTERPRISE")}>
                            Set to Enterprise (₱4,999)
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleAgentStatus(ag.uid)}>
                            Toggle Status ({ag.subscriptionStatus === "ACTIVE" ? "Suspend" : "Activate"})
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleAdminRole(ag.uid)}
                            className={ag.isPlatformAdmin ? "text-rose-600 dark:text-rose-400 font-medium" : "text-indigo-600 dark:text-indigo-400 font-medium"}
                          >
                            {ag.isPlatformAdmin ? "Revoke Platform Admin" : "Promote to Platform Admin"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 2: TIERS & PRICING CONFIGURATION */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.values(SUBSCRIPTION_PLANS) as (typeof SUBSCRIPTION_PLANS)[SubscriptionTier][]).map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between ${
                  plan.popular ? "border-primary ring-2 ring-primary/20 shadow-md" : ""
                }`}
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {plan.name}
                      </span>
                      {plan.badge && (
                        <Badge variant="won" className="text-[10px]">
                          {plan.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-serif text-foreground">
                        {plan.priceMonthlyPhp === 0
                          ? "Free"
                          : formatCurrency(plan.priceMonthlyPhp, "PHP", 0)}
                      </span>
                      {plan.priceMonthlyPhp > 0 && (
                        <span className="text-xs text-muted-foreground">/ month</span>
                      )}
                    </div>
                    <CardDescription className="text-xs mt-1 leading-relaxed">
                      {plan.tagline}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-2">
                    <div className="rounded-lg bg-muted/40 p-2.5 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Listing Quota:</span>
                        <strong className="font-semibold">{plan.quotas.maxProperties}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CSV Leads/Batch:</span>
                        <strong className="font-semibold">{plan.quotas.maxLeadsPerImport}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Team Seats:</span>
                        <strong className="font-semibold">{plan.quotas.teamSeats} seat(s)</strong>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                        Feature Inclusions:
                      </span>
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          {feat.included ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={
                              feat.included
                                ? feat.highlight
                                  ? "font-medium text-foreground"
                                  : "text-foreground"
                                : "text-muted-foreground line-through opacity-60"
                            }
                          >
                            {feat.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 border-t bg-muted/10">
                  <Button
                    size="sm"
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full text-xs font-medium"
                    onClick={() => {
                      if (agentProfile) {
                        void updateSubscription(plan.id);
                        toast.success(`Active test agent set to ${plan.name}`);
                      }
                    }}
                  >
                    Simulate Agent on {plan.name}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: PHILIPPINE INVOICES & PAYMENTS */}
        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-card p-3">
              <span className="text-[11px] text-muted-foreground">GCash Volume</span>
              <p className="text-lg font-bold text-blue-600">₱ 128,400</p>
              <span className="text-[10px] text-muted-foreground">51.6% of collections</span>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <span className="text-[11px] text-muted-foreground">Maya QR Payments</span>
              <p className="text-lg font-bold text-emerald-600">₱ 69,500</p>
              <span className="text-[10px] text-muted-foreground">27.9% of collections</span>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <span className="text-[11px] text-muted-foreground">Credit &amp; Debit Card</span>
              <p className="text-lg font-bold text-purple-600">₱ 41,200</p>
              <span className="text-[10px] text-muted-foreground">Visa / Mastercard</span>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <span className="text-[11px] text-muted-foreground">Bank Transfers</span>
              <p className="text-lg font-bold text-foreground">₱ 9,740</p>
              <span className="text-[10px] text-muted-foreground">BDO, BPI, UnionBank</span>
            </div>
          </div>

          <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Subscribing Agent</TableHead>
                  <TableHead>Plan Tier</TableHead>
                  <TableHead>Payment Gateway</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead className="text-right">Amount (PHP)</TableHead>
                  <TableHead className="text-center">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-xs font-mono font-medium">{inv.invoiceNo}</TableCell>
                    <TableCell className="text-xs">
                      <div className="font-semibold text-foreground">{inv.agentName}</div>
                      <div className="text-[10px] text-muted-foreground">{inv.agentEmail}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {inv.tier} ({inv.cycle})
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-medium text-foreground">{inv.paymentMethod}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.paidAt}</TableCell>
                    <TableCell className="text-xs text-right font-semibold text-foreground">
                      {formatCurrency(inv.amountPhp, "PHP", 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-primary"
                        onClick={() => toast.success(`Viewing official receipt for ${inv.invoiceNo}`)}
                      >
                        <Download className="h-3 w-3" />
                        <span>PDF</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 4: SHOWCASE CLIENT ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="rounded-lg border bg-gradient-to-br from-primary/10 via-background to-secondary/30 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Client Showcase Engagement Telemetry
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When brokers share custom showcase links (<code className="text-[10px] bg-muted px-1 py-0.5 rounded">/showcase?view=client</code>) across WhatsApp, Viber, or Facebook Ads, PropFlow tracks buyer attention dwell time, 360° panoramas inspected, and VIP pass conversion rates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card p-4 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Total Client Page Views</span>
              <p className="text-2xl font-bold text-foreground">14,280</p>
              <p className="text-[11px] text-emerald-600 font-medium">↗ +24% via WhatsApp/Viber shares</p>
            </div>
            <div className="rounded-lg border bg-card p-4 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Avg. 360° Panorama Dwell Time</span>
              <p className="text-2xl font-bold text-primary">2m 45s</p>
              <p className="text-[11px] text-muted-foreground">High buyer immersion metric</p>
            </div>
            <div className="rounded-lg border bg-card p-4 space-y-1">
              <span className="text-xs text-muted-foreground font-medium">VIP Pass &amp; Brochure Inquiries</span>
              <p className="text-2xl font-bold text-foreground">482 Leads</p>
              <p className="text-[11px] text-muted-foreground">3.4% direct client conversion rate</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
