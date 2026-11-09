"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Building2,
  Calculator,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  FileCheck2,
  FileSpreadsheet,
  Globe2,
  ImagePlus,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Medal,
  MessageSquareText,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Unplug,
  UserCheck,
  Users,
  CreditCard,
  DollarSign,
  Zap,
  ArrowUpRight,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCrmStore } from "@/lib/store/crm-store";
import { formatCurrency } from "@/lib/utils";
import { uploadMediaFile } from "@/lib/firebase/storage-upload";
import { getSafePropertyImageUrl } from "@/lib/property-images";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionTier,
  type BillingCycle,
} from "@/lib/subscription-plans";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const { user, agentProfile, updateProfile, updateSubscription } = useAuth();
  const {
    leads,
    properties,
    deals,
    quotations,
    messages,
    messengerSettings,
    updateMessengerSettings,
    activeAgentUid,
  } = useCrmStore();

  // --- Subscription & Billing State ---
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = React.useState(false);
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("MONTHLY");
  const [selectedPlanTier, setSelectedPlanTier] = React.useState<SubscriptionTier>("PRO");
  const [selectedPaymentGateway, setSelectedPaymentGateway] = React.useState<
    "GCASH" | "MAYA" | "CREDIT_CARD" | "BANK_TRANSFER"
  >("GCASH");
  const [isProcessingUpgrade, setIsProcessingUpgrade] = React.useState(false);

  const handleConfirmUpgrade = async () => {
    setIsProcessingUpgrade(true);
    try {
      await updateSubscription(selectedPlanTier, billingCycle);
      toast.success(
        `Subscribed to ${SUBSCRIPTION_PLANS[selectedPlanTier].name} (${billingCycle.toLowerCase()}) via ${selectedPaymentGateway}! Features updated.`
      );
      setIsUpgradeModalOpen(false);
    } catch {
      toast.error("Failed to process plan update. Please try again.");
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

const PRESET_LICENSING_LOGOS = [
  {
    name: "PRC Official Seal",
    code: "PRC",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Professional_Regulation_Commission_%28PRC%29.svg/240px-Professional_Regulation_Commission_%28PRC%29.svg.png",
  },
  {
    name: "DHSUD Official Seal",
    code: "DHSUD",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Department_of_Human_Settlements_and_Urban_Development_%28DHSUD%29.svg/240px-Department_of_Human_Settlements_and_Urban_Development_%28DHSUD%29.svg.png",
  },
  {
    name: "REALTOR® / NAR",
    code: "REALTOR",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/National_Association_of_Realtors_logo.svg/240px-National_Association_of_Realtors_logo.svg.png",
  },
];

  // --- Profile State ---
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [facebookUrl, setFacebookUrl] = React.useState("");
  const [agencyName, setAgencyName] = React.useState("");
  const [prcLicenseNumber, setPrcLicenseNumber] = React.useState("");
  const [prcExpiryDate, setPrcExpiryDate] = React.useState("");
  const [dhsudRegistrationNo, setDhsudRegistrationNo] = React.useState("");
  const [dhsudExpiryDate, setDhsudExpiryDate] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [licensingBodyLogoUrl, setLicensingBodyLogoUrl] = React.useState("");
  const [boardAffiliation, setBoardAffiliation] = React.useState("");
  const [bioHeadline, setBioHeadline] = React.useState("");
  const [awards, setAwards] = React.useState<string[]>([]);
  const [newAwardInput, setNewAwardInput] = React.useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [isUploadingBadge, setIsUploadingBadge] = React.useState(false);
  const [role, setRole] = React.useState<"AGENT" | "TEAM_LEADER" | "BROKER">("BROKER");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  // --- Messenger State ---
  const [pageId, setPageId] = React.useState("");
  const [pageName, setPageName] = React.useState("");
  const [pageAccessToken, setPageAccessToken] = React.useState("");
  const [appSecret, setAppSecret] = React.useState("");
  const [showToken, setShowToken] = React.useState(false);
  const [autoReplyGreeting, setAutoReplyGreeting] = React.useState(true);
  const [greetingMessage, setGreetingMessage] = React.useState("");
  const [isVerifyingToken, setIsVerifyingToken] = React.useState(false);
  const [isSavingMessenger, setIsSavingMessenger] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // --- Quotation & Financial Defaults State ---
  const [defaultCommissionRate, setDefaultCommissionRate] = React.useState("3.5");
  const [defaultVatRate, setDefaultVatRate] = React.useState("12.0");
  const [defaultBankRate, setDefaultBankRate] = React.useState("7.5");
  const [defaultBankTermYears, setDefaultBankTermYears] = React.useState("15");
  const [defaultCurrency, setDefaultCurrency] = React.useState("PHP");
  const [quotationValidityDays, setQuotationValidityDays] = React.useState("30");
  const [isSavingDefaults, setIsSavingDefaults] = React.useState(false);

  // --- Automations State ---
  const [staleLeadHours, setStaleLeadHours] = React.useState("48");
  const [enableAiCopilot, setEnableAiCopilot] = React.useState(true);
  const [enableEmailAlerts, setEnableEmailAlerts] = React.useState(true);

  // Hydrate Profile
  React.useEffect(() => {
    if (agentProfile) {
      setFullName(agentProfile.fullName || "");
      setEmail(agentProfile.email || user?.email || "");
      setPhone(agentProfile.phone || "");
      setFacebookUrl(agentProfile.facebookUrl || "");
      setAgencyName(agentProfile.agencyName || "");
      setPrcLicenseNumber(agentProfile.prcLicenseNumber || "");
      setPrcExpiryDate(agentProfile.prcExpiryDate || "");
      setDhsudRegistrationNo(agentProfile.dhsudRegistrationNo || "");
      setDhsudExpiryDate(agentProfile.dhsudExpiryDate || "");
      setAvatarUrl(agentProfile.avatarUrl || "");
      setLicensingBodyLogoUrl(agentProfile.licensingBodyLogoUrl || "");
      setBoardAffiliation(agentProfile.boardAffiliation || "");
      setBioHeadline(agentProfile.bioHeadline || "");
      setAwards(agentProfile.awards || []);
      setRole((agentProfile.role as "AGENT" | "TEAM_LEADER" | "BROKER") || "BROKER");
    }
  }, [agentProfile, user]);

  // Hydrate Messenger Settings
  React.useEffect(() => {
    if (messengerSettings) {
      setPageId(messengerSettings.pageId || "");
      setPageName(messengerSettings.pageName || "");
      setPageAccessToken(messengerSettings.pageAccessToken || "");
      setAppSecret(messengerSettings.appSecret || "");
      setAutoReplyGreeting(messengerSettings.autoReplyGreeting ?? true);
      setGreetingMessage(
        messengerSettings.greetingMessage ||
          "Hi {name}! Thanks for reaching out. Are you interested in pre-selling or ready-for-occupancy units?"
      );
    } else {
      setGreetingMessage(
        "Hi {name}! Thanks for reaching out. Are you interested in pre-selling or ready-for-occupancy units?"
      );
    }
  }, [messengerSettings]);

  // Hydrate Financial & Automation Defaults from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedDefaults = localStorage.getItem("propflow_general_settings");
        if (storedDefaults) {
          const parsed = JSON.parse(storedDefaults);
          if (parsed.defaultCommissionRate) setDefaultCommissionRate(String(parsed.defaultCommissionRate));
          if (parsed.defaultVatRate) setDefaultVatRate(String(parsed.defaultVatRate));
          if (parsed.defaultBankRate) setDefaultBankRate(String(parsed.defaultBankRate));
          if (parsed.defaultBankTermYears) setDefaultBankTermYears(String(parsed.defaultBankTermYears));
          if (parsed.defaultCurrency) setDefaultCurrency(parsed.defaultCurrency);
          if (parsed.quotationValidityDays) setQuotationValidityDays(String(parsed.quotationValidityDays));
          if (parsed.staleLeadHours) setStaleLeadHours(String(parsed.staleLeadHours));
          if (parsed.enableAiCopilot !== undefined) setEnableAiCopilot(Boolean(parsed.enableAiCopilot));
          if (parsed.enableEmailAlerts !== undefined) setEnableEmailAlerts(Boolean(parsed.enableEmailAlerts));
        }
      } catch {}
    }
  }, []);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://propflow.ph";
  const callbackUrl = `${origin}/api/webhooks/messenger`;
  const verifyToken =
    messengerSettings?.verifyToken || "propflow_meta_verify_secret_2026";

  const copyToClipboard = (text: string, fieldId: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // --- Handlers ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        facebookUrl: facebookUrl.trim() || undefined,
        agencyName: agencyName.trim(),
        prcLicenseNumber: prcLicenseNumber.trim(),
        prcExpiryDate: prcExpiryDate.trim() || undefined,
        dhsudRegistrationNo: dhsudRegistrationNo.trim(),
        dhsudExpiryDate: dhsudExpiryDate.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        licensingBodyLogoUrl: licensingBodyLogoUrl.trim() || undefined,
        boardAffiliation: boardAffiliation.trim() || undefined,
        bioHeadline: bioHeadline.trim() || undefined,
        awards,
        role,
      });
      toast.success("Agent profile and credibility credentials updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadMediaFile(file, "avatars");
      setAvatarUrl(url);
      await updateProfile({ avatarUrl: url });
      toast.success("Profile photo uploaded and saved!");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error("Photo upload failed. You can paste an image URL instead.");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleBadgeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBadge(true);
    try {
      const url = await uploadMediaFile(file, "badges");
      setLicensingBodyLogoUrl(url);
      await updateProfile({ licensingBodyLogoUrl: url });
      toast.success("Licensing body / board logo uploaded and saved!");
    } catch (err) {
      console.error("Badge upload failed:", err);
      toast.error("Badge upload failed. You can paste an image URL instead.");
    } finally {
      setIsUploadingBadge(false);
      e.target.value = "";
    }
  };

  const handleAddAward = () => {
    if (!newAwardInput.trim()) return;
    if (awards.includes(newAwardInput.trim())) {
      toast.info("Award already listed.");
      return;
    }
    setAwards([...awards, newAwardInput.trim()]);
    setNewAwardInput("");
    toast.success("Award badge added!");
  };

  const handleRemoveAward = (indexToRemove: number) => {
    setAwards(awards.filter((_, idx) => idx !== indexToRemove));
  };

  const handleVerifyMessengerToken = async () => {
    if (!pageAccessToken.trim()) {
      toast.error("Please enter a Page Access Token to test");
      return;
    }

    setIsVerifyingToken(true);
    try {
      const res = await fetch("/api/messenger/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: pageId.trim() || "0",
          pageAccessToken: pageAccessToken.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        toast.error(`Verification Failed: ${data.error || "Invalid token"}`);
        return;
      }

      if (data.pageName && !pageName.trim()) setPageName(data.pageName);
      if (data.pageId && (!pageId.trim() || pageId.trim() === "0")) setPageId(data.pageId);

      toast.success(
        `Verified with Meta! Connected to: ${data.pageName} (Page ID: ${data.pageId})`
      );

      await updateMessengerSettings({
        pageId: data.pageId || pageId.trim(),
        pageName: data.pageName || pageName.trim(),
        pageAccessToken: pageAccessToken.trim(),
        appSecret: appSecret.trim(),
        isConnected: true,
        lastVerifiedAt: new Date().toISOString(),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to verify token with Meta");
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handleSaveMessengerSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageId.trim() || !pageAccessToken.trim()) {
      toast.error("Page ID and Page Access Token are required.");
      return;
    }

    setIsSavingMessenger(true);
    try {
      await updateMessengerSettings({
        pageId: pageId.trim(),
        pageName: pageName.trim() || "Agent Facebook Page",
        pageAccessToken: pageAccessToken.trim(),
        appSecret: appSecret.trim(),
        isConnected: true,
        autoReplyGreeting,
        greetingMessage,
        lastVerifiedAt: messengerSettings?.lastVerifiedAt || new Date().toISOString(),
      });
      toast.success("Meta Messenger channel configuration saved!");
    } catch {
      toast.error("Failed to save Messenger channel settings.");
    } finally {
      setIsSavingMessenger(false);
    }
  };

  const handleDisconnectMessenger = async () => {
    if (!confirm("Are you sure you want to disconnect this Facebook Page?")) return;
    await updateMessengerSettings({
      isConnected: false,
      lastVerifiedAt: null,
    });
    toast.info("Facebook Page disconnected.");
  };

  const handleSaveFinancialDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDefaults(true);
    try {
      const payload = {
        defaultCommissionRate: parseFloat(defaultCommissionRate) || 3.5,
        defaultVatRate: parseFloat(defaultVatRate) || 12.0,
        defaultBankRate: parseFloat(defaultBankRate) || 7.5,
        defaultBankTermYears: parseInt(defaultBankTermYears, 10) || 15,
        defaultCurrency,
        quotationValidityDays: parseInt(quotationValidityDays, 10) || 30,
        staleLeadHours: parseInt(staleLeadHours, 10) || 48,
        enableAiCopilot,
        enableEmailAlerts,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("propflow_general_settings", JSON.stringify(payload));
      }
      toast.success("Quotation & financing calculation defaults saved!");
    } catch {
      toast.error("Failed to save financial defaults.");
    } finally {
      setIsSavingDefaults(false);
    }
  };

  const handleExportWorkspace = () => {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      agent: {
        uid: activeAgentUid || agentProfile?.uid,
        name: agentProfile?.fullName,
        email: agentProfile?.email,
        license: agentProfile?.prcLicenseNumber,
      },
      stats: {
        totalLeads: leads.length,
        totalProperties: properties.length,
        totalQuotations: quotations.length,
        totalDeals: deals.length,
        totalMessages: messages.length,
      },
      leads,
      properties,
      quotations,
      deals,
      messages,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `propflow_workspace_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Full workspace backup JSON downloaded!");
  };

  const isMessengerConnected =
    messengerSettings?.isConnected && Boolean(messengerSettings.pageId);

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-serif font-normal tracking-tight text-foreground">
              Settings &amp; Configuration
            </h1>
            <Badge variant="outline" className="text-[10px]">
              Workspace v2.4
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure agent accreditation, Facebook Messenger channels, quotation formulas, and cloud backup.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleExportWorkspace}
            title="Download full JSON snapshot of leads, deals, and unit computations"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Export Workspace JSON</span>
          </Button>
        </div>
      </div>

      {/* Main Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto p-1 gap-1">
          <TabsTrigger value="profile" className="text-xs py-2 gap-1.5">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Profile &amp; PRC</span>
          </TabsTrigger>
          <TabsTrigger value="messenger" className="text-xs py-2 gap-1.5">
            <MessageSquareText className="h-3.5 w-3.5" />
            <span>Messenger</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs py-2 gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            <span>Billing &amp; Plan</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="text-xs py-2 gap-1.5">
            <Calculator className="h-3.5 w-3.5" />
            <span>Financials</span>
          </TabsTrigger>
          <TabsTrigger value="automations" className="text-xs py-2 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Automations</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs py-2 gap-1.5">
            <Database className="h-3.5 w-3.5" />
            <span>Data &amp; Backup</span>
          </TabsTrigger>
        </TabsList>

        {/* ================================================================= */}
        {/* TAB 1: Profile, Accreditation & Agent Credibility */}
        {/* ================================================================= */}
        <TabsContent value="profile" className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    Licensed Broker &amp; Agent Credibility Profile
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your photo, PRC/DHSUD accreditation seals, awards, and licensing body logos appear across your client Showcase, quotation sheets, and deal rooms.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="won" className="text-[10px] gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    PRC / DHSUD Verified
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* 1. AGENT PHOTO & BIO HEADLINE */}
                <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-primary" />
                    1. Profile Portrait &amp; Consultant Tagline
                  </span>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/30 bg-muted shadow-sm group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          avatarUrl?.trim()
                            ? avatarUrl
                            : "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80"
                        }
                        alt="Agent Avatar"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                      <label
                        htmlFor="avatar-file-upload-input"
                        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-semibold text-center p-1"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Change Photo"
                        )}
                      </label>
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label
                          htmlFor="avatar-file-upload-input"
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-background px-3 py-2 text-xs font-medium hover:bg-accent hover:border-primary/50 transition-colors"
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          ) : (
                            <ImagePlus className="h-3.5 w-3.5 text-primary" />
                          )}
                          <span>
                            {isUploadingAvatar ? "Uploading Photo..." : "Upload Photo (JPG/PNG)"}
                          </span>
                        </label>

                        <input
                          id="avatar-file-upload-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarFileUpload}
                        />

                        <Input
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="Or paste Photo URL / Google Drive link"
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="prof-headline" className="text-[11px] font-semibold text-muted-foreground">
                          Consultant Bio Headline / Value Proposition
                        </Label>
                        <Input
                          id="prof-headline"
                          value={bioHeadline}
                          onChange={(e) => setBioHeadline(e.target.value)}
                          placeholder="e.g. Licensed Real Estate Broker specializing in high-yield Metro Manila masterplanned estates."
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. LEGAL IDENTITY & CONTACT */}
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                    2. Legal Identity &amp; Brokerage Firm
                  </span>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-name" className="text-xs font-semibold">
                        Full Legal Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="prof-name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Marco Reyes, REB"
                        className="h-9 text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prof-email" className="text-xs font-semibold">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Input
                          id="prof-email"
                          value={email}
                          readOnly
                          className="h-9 text-xs bg-muted/40 pl-8 font-mono"
                        />
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Account email managed via Firebase Authentication.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prof-phone" className="text-xs font-semibold">
                        Mobile / WhatsApp Number
                      </Label>
                      <div className="relative">
                        <Input
                          id="prof-phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+63 917 880 1122"
                          className="h-9 text-xs pl-8 font-mono"
                        />
                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prof-messenger" className="text-xs font-semibold">
                        Facebook Page / Messenger URL
                      </Label>
                      <div className="relative">
                        <Input
                          id="prof-messenger"
                          value={facebookUrl}
                          onChange={(e) => setFacebookUrl(e.target.value)}
                          placeholder="e.g. m.me/doncaballerorealty or page URL"
                          className="h-9 text-xs pl-8"
                        />
                        <MessageSquareText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prof-agency" className="text-xs font-semibold">
                        Realty Firm / Brokerage Group
                      </Label>
                      <div className="relative">
                        <Input
                          id="prof-agency"
                          value={agencyName}
                          onChange={(e) => setAgencyName(e.target.value)}
                          placeholder="e.g. PropFlow Realty Group"
                          className="h-9 text-xs pl-8"
                        />
                        <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="prof-role" className="text-xs font-semibold">
                        Professional Role Designation
                      </Label>
                      <select
                        id="prof-role"
                        value={role}
                        onChange={(e) =>
                          setRole(e.target.value as "AGENT" | "TEAM_LEADER" | "BROKER")
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                      >
                        <option value="BROKER">Licensed Real Estate Broker (Principal)</option>
                        <option value="TEAM_LEADER">Sales Director / Unit Team Leader</option>
                        <option value="AGENT">Accredited Real Estate Salesperson</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. LICENSES & ACCREDITATIONS */}
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      3. Philippine Government Licensing &amp; Expiry
                    </span>
                    <Badge variant="won" className="text-[10px]">
                      Compliant
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="prof-prc" className="text-xs font-semibold">
                        PRC Real Estate License Number
                      </Label>
                      <Input
                        id="prof-prc"
                        value={prcLicenseNumber}
                        onChange={(e) => setPrcLicenseNumber(e.target.value)}
                        placeholder="e.g. PRC REB #0031842"
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prof-prc-exp" className="text-xs font-semibold">
                        PRC License Expiry Date
                      </Label>
                      <Input
                        id="prof-prc-exp"
                        type="date"
                        value={prcExpiryDate}
                        onChange={(e) => setPrcExpiryDate(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prof-dhsud" className="text-xs font-semibold">
                        DHSUD Registration Certificate
                      </Label>
                      <Input
                        id="prof-dhsud"
                        value={dhsudRegistrationNo}
                        onChange={(e) => setDhsudRegistrationNo(e.target.value)}
                        placeholder="e.g. DHSUD-NCR-B-08/24-1190"
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prof-dhsud-exp" className="text-xs font-semibold">
                        DHSUD Registration Expiry Date
                      </Label>
                      <Input
                        id="prof-dhsud-exp"
                        type="date"
                        value={dhsudExpiryDate}
                        onChange={(e) => setDhsudExpiryDate(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="prof-board" className="text-xs font-semibold">
                        Real Estate Board / Association Affiliation
                      </Label>
                      <Input
                        id="prof-board"
                        value={boardAffiliation}
                        onChange={(e) => setBoardAffiliation(e.target.value)}
                        placeholder="e.g. PAREB - Pasig Realtors Board (PRB) or REBAP Global"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. LICENSING BODY LOGOS & BADGES */}
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                      4. Licensing Body Logo &amp; Accreditation Seals
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Boosts trust on public client storefronts
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Select Official Preset:
                      </span>
                      {PRESET_LICENSING_LOGOS.map((preset) => (
                        <Button
                          key={preset.code}
                          type="button"
                          variant={
                            licensingBodyLogoUrl === preset.url
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="h-7 text-xs gap-1.5"
                          onClick={() => setLicensingBodyLogoUrl(preset.url)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="h-4 w-4 object-contain"
                          />
                          <span>{preset.name}</span>
                        </Button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <label
                        htmlFor="badge-file-upload-input"
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-background px-3 py-2 text-xs font-medium hover:bg-accent hover:border-primary/50 transition-colors"
                      >
                        {isUploadingBadge ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        ) : (
                          <ImagePlus className="h-3.5 w-3.5 text-primary" />
                        )}
                        <span>
                          {isUploadingBadge
                            ? "Uploading Seal..."
                            : "Upload Custom Logo (PNG)"}
                        </span>
                      </label>

                      <input
                        id="badge-file-upload-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBadgeFileUpload}
                      />

                      <Input
                        value={licensingBodyLogoUrl}
                        onChange={(e) => setLicensingBodyLogoUrl(e.target.value)}
                        placeholder="Or direct logo image URL"
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    {licensingBodyLogoUrl && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="h-10 w-10 p-1 rounded-lg border bg-white flex items-center justify-center shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={licensingBodyLogoUrl}
                            alt="Active Licensing Logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold block text-foreground">
                            Active Licensing Body Seal
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Rendered beside your broker accreditation in proposals and client view.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. AWARDS, HONORS & ACHIEVEMENTS */}
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5 text-primary" />
                      5. Awards, Honors &amp; Career Milestones
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {awards.length} Award Badges
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newAwardInput}
                        onChange={(e) => setNewAwardInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddAward();
                          }
                        }}
                        placeholder="e.g. 🏆 Ayala Land Premier Top Producer 2025"
                        className="h-8 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs gap-1"
                        onClick={handleAddAward}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Award
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {awards.map((award, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="px-2.5 py-1 text-xs gap-1.5 bg-background shadow-sm border-primary/20 text-foreground"
                        >
                          <Trophy className="h-3 w-3 text-amber-500" />
                          <span>{award}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAward(idx)}
                            className="ml-1 text-muted-foreground hover:text-destructive"
                            title="Remove award"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {awards.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          No awards added yet. Add your sales accolades, developer citations, or board honors above.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. LIVE PUBLIC CREDIBILITY CARD PREVIEW */}
                <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Live Buyer Preview: Verified Consultant Credibility Seal
                    </span>
                    <Badge variant="outline" className="border-white/20 text-white text-[10px] bg-white/5">
                      Client-Facing View
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-emerald-400/60 bg-slate-800 shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            avatarUrl
                              ? getSafePropertyImageUrl(avatarUrl)
                              : "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80"
                          }
                          alt={fullName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white tracking-tight">
                            {fullName || "Marco Reyes, REB"}
                          </h4>
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                            ✓
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium">
                          {role === "BROKER"
                            ? "Licensed Real Estate Broker"
                            : role === "TEAM_LEADER"
                            ? "Sales Director"
                            : "Accredited Real Estate Salesperson"}{" "}
                          • {agencyName || "PropFlow Realty Group"}
                        </p>
                        {bioHeadline && (
                          <p className="text-[11px] text-slate-400 pt-0.5 line-clamp-1 max-w-md">
                            {bioHeadline}
                          </p>
                        )}
                      </div>
                    </div>

                    {licensingBodyLogoUrl && (
                      <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getSafePropertyImageUrl(licensingBodyLogoUrl)}
                          alt="Licensing Logo"
                          className="h-7 w-7 object-contain"
                        />
                        <div className="text-[10px] leading-tight">
                          <span className="font-semibold block text-slate-200">Accredited by</span>
                          <span className="text-slate-400">PRC &amp; DHSUD</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/10 text-xs">
                    <div className="bg-white/5 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 block">PRC License</span>
                      <span className="font-mono font-semibold text-emerald-300">
                        {prcLicenseNumber || "PRC #0031842"}
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 block">DHSUD Certificate</span>
                      <span className="font-mono font-semibold text-emerald-300 truncate block">
                        {dhsudRegistrationNo || "DHSUD-NCR-B-08/24-1190"}
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block">Affiliation</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {boardAffiliation || "PAREB - PRB"}
                      </span>
                    </div>
                  </div>

                  {awards.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {awards.map((award, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-medium text-amber-200"
                        >
                          <Trophy className="h-2.5 w-2.5 text-amber-400" />
                          {award}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <div className="flex justify-end pt-3 border-t">
                  <Button type="submit" size="sm" className="h-9 px-4 text-xs gap-1.5 font-semibold" disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save Profile &amp; Credibility Credentials
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB 2: Meta Messenger Channel Configuration */}
        {/* ================================================================= */}
        <TabsContent value="messenger" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-primary" />
                    Facebook Messenger Business Channel
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Each agent connects their specific Facebook Page. Webhook events route strictly to your account.
                  </CardDescription>
                </div>
                {isMessengerConnected ? (
                  <Badge variant="won" className="text-[11px] gap-1 px-2.5 py-0.5">
                    <Radio className="h-3 w-3 animate-pulse text-pipeline-won" />
                    Channel Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] text-amber-500 border-amber-500/40">
                    Not Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Status Header Box */}
              <div className="rounded-lg border bg-card p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isMessengerConnected
                        ? "bg-pipeline-won/15 text-pipeline-won"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isMessengerConnected ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Unplug className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">
                      {isMessengerConnected
                        ? pageName || "Facebook Page Connected"
                        : "No Facebook Page Connected"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {isMessengerConnected ? (
                        <>
                          Page ID: <span className="font-mono text-foreground font-semibold">{pageId}</span> • Verified
                        </>
                      ) : (
                        "Paste your Page ID and Access Token below to sync buyer chats."
                      )}
                    </p>
                  </div>
                </div>

                {!isMessengerConnected && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => {
                      setPageId("109283746599182");
                      setPageName("Marco Reyes - BGC Premier Realty");
                      setPageAccessToken("EAAdemo_marco_reyes_bgc_real_estate_pat_2026");
                      setAppSecret("demo_meta_app_secret_998811");
                      toast.info("Loaded demo credentials");
                    }}
                  >
                    Load Demo Credentials
                  </Button>
                )}
              </div>

              {/* Multi-Agent Separation Strategy Note */}
              <div className="rounded-lg border bg-primary/5 border-primary/20 p-3.5 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  Multi-Agent Separation Guarantee
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Every Facebook inquiry carries your unique <strong>Page ID</strong>. PropFlow routes the webhook straight to your private inbox (<code className="font-mono text-primary">/agents/{activeAgentUid || "you"}/messages</code>). Other agents will never see or interact with your leads.
                </p>
              </div>

              {/* Credentials Form */}
              <form onSubmit={handleSaveMessengerSettings} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="set-pageId" className="text-xs font-semibold">
                      Facebook Page ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="set-pageId"
                      value={pageId}
                      onChange={(e) => setPageId(e.target.value)}
                      placeholder="e.g. 109283746599182"
                      className="h-8 text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="set-pageName" className="text-xs font-semibold">
                      Page Display Name
                    </Label>
                    <Input
                      id="set-pageName"
                      value={pageName}
                      onChange={(e) => setPageName(e.target.value)}
                      placeholder="e.g. Marco Reyes - BGC Premier"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="set-pat" className="text-xs font-semibold">
                    Page Access Token (PAT) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="set-pat"
                      type={showToken ? "text" : "password"}
                      value={pageAccessToken}
                      onChange={(e) => setPageAccessToken(e.target.value)}
                      placeholder="EAAB..."
                      className="h-8 text-xs font-mono pr-9"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken((prev) => !prev)}
                      className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="set-secret" className="text-xs font-semibold">
                    Meta App Secret <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="set-secret"
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    placeholder="App Secret for HMAC payload verification"
                    className="h-8 text-xs font-mono"
                  />
                </div>

                {/* Automations sub-section */}
                <div className="space-y-3 rounded-lg border p-3.5 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold">Instant Welcome Greeting</h5>
                      <p className="text-[11px] text-muted-foreground">
                        Automatically reply when a buyer sends their first message.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoReplyGreeting}
                      onChange={(e) => setAutoReplyGreeting(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>

                  {autoReplyGreeting && (
                    <div className="space-y-1">
                      <Label htmlFor="set-greeting" className="text-[11px] font-semibold">
                        Greeting Template (use <code className="text-primary font-mono">{"{name}"}</code>)
                      </Label>
                      <textarea
                        id="set-greeting"
                        rows={3}
                        value={greetingMessage}
                        onChange={(e) => setGreetingMessage(e.target.value)}
                        className="w-full rounded-md border border-input bg-background p-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  )}
                </div>

                {/* Webhook Copy Box */}
                <div className="space-y-2 rounded-lg border p-3.5 bg-muted/10">
                  <h5 className="text-xs font-bold flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    Meta Webhook Credentials
                  </h5>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Callback URL</Label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Input readOnly value={callbackUrl} className="h-7 text-[11px] font-mono bg-background" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => copyToClipboard(callbackUrl, "url")}
                        >
                          {copiedField === "url" ? <Check className="h-3 w-3 text-pipeline-won" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Verify Token</Label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Input readOnly value={verifyToken} className="h-7 text-[11px] font-mono bg-background" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => copyToClipboard(verifyToken, "token")}
                        >
                          {copiedField === "token" ? <Check className="h-3 w-3 text-pipeline-won" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={handleVerifyMessengerToken}
                      disabled={isVerifyingToken || !pageAccessToken.trim()}
                    >
                      {isVerifyingToken ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 text-primary" />
                      )}
                      Test &amp; Verify Token
                    </Button>

                    {isMessengerConnected && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10"
                        onClick={handleDisconnectMessenger}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Disconnect
                      </Button>
                    )}
                  </div>

                  <Button type="submit" size="sm" className="h-8 text-xs gap-1.5" disabled={isSavingMessenger}>
                    {isSavingMessenger ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save Channel Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB 3: Subscription & Billing Management */}
        {/* ================================================================= */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Subscription &amp; Platform Plan
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Manage your PropFlow CRM entitlements, listing quotas, 360° tour features, and Philippine payment method.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="won" className="text-[10px] gap-1 py-0.5">
                    <CheckCircle2 className="h-3 w-3" />
                    {agentProfile?.subscriptionStatus || "ACTIVE"}
                  </Badge>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-medium"
                    onClick={() => {
                      setSelectedPlanTier(
                        agentProfile?.subscriptionTier === "PRO" ? "ENTERPRISE" : "PRO"
                      );
                      setIsUpgradeModalOpen(true);
                    }}
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-300" />
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              {/* Active Plan Summary Box */}
              {(() => {
                const currentTier: SubscriptionTier =
                  (agentProfile?.subscriptionTier as SubscriptionTier) || "PRO";
                const plan = SUBSCRIPTION_PLANS[currentTier];
                return (
                  <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-background to-secondary/30 p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Current Active Entitlement
                          </span>
                          <Badge variant="won" className="text-[10px]">
                            {plan.badge || "Subscribed"}
                          </Badge>
                        </div>
                        <h3 className="text-2xl font-serif font-normal text-foreground">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                          {plan.tagline}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-2xl font-bold font-serif text-foreground">
                          {plan.priceMonthlyPhp === 0
                            ? "Free Forever"
                            : `${formatCurrency(plan.priceMonthlyPhp, "PHP", 0)} / mo`}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Renews automatically on {agentProfile?.subscriptionRenewsAt || "2027-01-01"}
                        </span>
                      </div>
                    </div>

                    {/* Quota Usage Meters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t pt-4">
                      <div className="rounded-lg bg-background/80 p-3 border space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Property Listings:</span>
                          <strong className="text-foreground">
                            {properties.length} / {plan.quotas.maxProperties}
                          </strong>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width:
                                plan.quotas.maxProperties === "UNLIMITED"
                                  ? "25%"
                                  : `${Math.min(100, (properties.length / (plan.quotas.maxProperties || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="rounded-lg bg-background/80 p-3 border space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">CSV Lead Importer:</span>
                          <strong className="text-foreground">
                            {plan.quotas.maxLeadsPerImport === "UNLIMITED"
                              ? "Unlimited Leads"
                              : `${plan.quotas.maxLeadsPerImport} leads / batch`}
                          </strong>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-full" />
                        </div>
                      </div>

                      <div className="rounded-lg bg-background/80 p-3 border space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Quotation Proposals:</span>
                          <strong className="text-foreground">
                            {quotations.length} Sent
                          </strong>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-1/3" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Feature Inclusions Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Features Included in Your Current Tier
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {SUBSCRIPTION_PLANS[
                    (agentProfile?.subscriptionTier as SubscriptionTier) || "PRO"
                  ].features.map((feat, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
                        feat.included ? "bg-muted/15" : "bg-muted/5 opacity-50"
                      }`}
                    >
                      {feat.included ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className={feat.included ? "font-medium text-foreground" : "text-muted-foreground line-through"}>
                          {feat.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Upgrade & Change Tier Modal */}
          <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <DialogTitle className="text-lg">Select Your PropFlow Plan</DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  Upgrade your realty capabilities with 360° virtual tours, Facebook Lead Ads bulk importing, and individual Messenger channel automation.
                </DialogDescription>
              </DialogHeader>

              {/* Billing Cycle Switcher */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBillingCycle("MONTHLY")}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                    billingCycle === "MONTHLY"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("ANNUAL")}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                    billingCycle === "ANNUAL"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Annual Billing</span>
                  <Badge variant="won" className="text-[9px] px-1 py-0 h-4">
                    Save 17%
                  </Badge>
                </button>
              </div>

              {/* Plans Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {(Object.values(SUBSCRIPTION_PLANS) as (typeof SUBSCRIPTION_PLANS)[SubscriptionTier][]).map(
                  (plan) => {
                    const isSelected = selectedPlanTier === plan.id;
                    const price =
                      billingCycle === "ANNUAL"
                        ? plan.priceAnnualPhp === 0
                          ? 0
                          : Math.round(plan.priceAnnualPhp / 12)
                        : plan.priceMonthlyPhp;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanTier(plan.id)}
                        className={`rounded-lg border p-4 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : "border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                              {plan.name}
                            </span>
                            {plan.badge && (
                              <Badge variant="won" className="text-[9px]">
                                {plan.badge}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xl font-bold font-serif text-foreground">
                            {price === 0 ? "Free" : `${formatCurrency(price, "PHP", 0)}/mo`}
                          </div>
                          {billingCycle === "ANNUAL" && plan.priceAnnualPhp > 0 && (
                            <div className="text-[10px] text-muted-foreground">
                              Billed ₱{plan.priceAnnualPhp.toLocaleString()} annually
                            </div>
                          )}
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {plan.tagline}
                          </p>

                          <div className="border-t pt-2 space-y-1 text-xs">
                            <div className="text-[11px] font-semibold text-foreground">Quotas:</div>
                            <div className="text-[11px] text-muted-foreground">
                              • {plan.quotas.maxProperties === "UNLIMITED" ? "Unlimited Units" : `${plan.quotas.maxProperties} listings`}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              • {plan.quotas.maxLeadsPerImport === "UNLIMITED" ? "Unlimited CSV Leads" : `${plan.quotas.maxLeadsPerImport} leads/batch`}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4">
                          <Button
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className="w-full text-xs h-7"
                          >
                            {isSelected ? "Selected" : "Choose Plan"}
                          </Button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Philippine Payment Gateway Selection */}
              {selectedPlanTier !== "STARTER" && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs font-semibold">Select Payment Method (Philippines)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentGateway("GCASH")}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition-all text-center ${
                        selectedPaymentGateway === "GCASH"
                          ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 ring-1 ring-blue-500"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="text-blue-600 font-bold">GCash</div>
                      <span className="text-[10px] text-muted-foreground font-normal">e-Wallet QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentGateway("MAYA")}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition-all text-center ${
                        selectedPaymentGateway === "MAYA"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 ring-1 ring-emerald-500"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="text-emerald-600 font-bold">Maya</div>
                      <span className="text-[10px] text-muted-foreground font-normal">Instant QR Ph</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentGateway("CREDIT_CARD")}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition-all text-center ${
                        selectedPaymentGateway === "CREDIT_CARD"
                          ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/40 ring-1 ring-purple-500"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="text-purple-600 font-bold">Card</div>
                      <span className="text-[10px] text-muted-foreground font-normal">Visa / Mastercard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentGateway("BANK_TRANSFER")}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition-all text-center ${
                        selectedPaymentGateway === "BANK_TRANSFER"
                          ? "border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-950/40 ring-1 ring-amber-500"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="text-amber-600 font-bold">Bank Wire</div>
                      <span className="text-[10px] text-muted-foreground font-normal">BDO / BPI Wire</span>
                    </button>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsUpgradeModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="text-xs bg-primary text-primary-foreground font-medium gap-1.5"
                  disabled={isProcessingUpgrade}
                  onClick={handleConfirmUpgrade}
                >
                  {isProcessingUpgrade ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5 text-amber-300" />
                  )}
                  Confirm Subscription
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB 4: Quotation & Financial Calculation Defaults */}
        {/* ================================================================= */}
        <TabsContent value="finance" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Quotation &amp; Amortization Formulas
              </CardTitle>
              <CardDescription className="text-xs">
                Set baseline interest rates, VAT thresholds, and broker commission splits used across new quotations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveFinancialDefaults} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fin-comm" className="text-xs font-semibold">
                      Default Broker Commission Rate (%)
                    </Label>
                    <Input
                      id="fin-comm"
                      type="number"
                      step="0.1"
                      min="1"
                      max="15"
                      value={defaultCommissionRate}
                      onChange={(e) => setDefaultCommissionRate(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Standard Philippine developer commission is typically 3.0% – 5.0%.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fin-vat" className="text-xs font-semibold">
                      Philippine VAT Rate (%)
                    </Label>
                    <Input
                      id="fin-vat"
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      value={defaultVatRate}
                      onChange={(e) => setDefaultVatRate(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      12% statutory VAT on residential lots &gt; ₱1.9M / units &gt; ₱3.6M.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fin-rate" className="text-xs font-semibold">
                      Default Bank Interest Rate (%)
                    </Label>
                    <Input
                      id="fin-rate"
                      type="number"
                      step="0.1"
                      min="3"
                      max="18"
                      value={defaultBankRate}
                      onChange={(e) => setDefaultBankRate(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Prevailing 1–5 yr fixing rate (BDO, BPI, Metrobank).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fin-term" className="text-xs font-semibold">
                      Default Bank Loan Term (Years)
                    </Label>
                    <select
                      id="fin-term"
                      value={defaultBankTermYears}
                      onChange={(e) => setDefaultBankTermYears(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                    >
                      <option value="5">5 Years (60 Months)</option>
                      <option value="10">10 Years (120 Months)</option>
                      <option value="15">15 Years (180 Months)</option>
                      <option value="20">20 Years (240 Months)</option>
                      <option value="25">25 Years (300 Months)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fin-curr" className="text-xs font-semibold">
                      Primary Display Currency
                    </Label>
                    <select
                      id="fin-curr"
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                    >
                      <option value="PHP">Philippine Peso (PHP ₱)</option>
                      <option value="USD">United States Dollar (USD $)</option>
                      <option value="AED">UAE Dirham (AED)</option>
                      <option value="SGD">Singapore Dollar (SGD S$)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fin-valid" className="text-xs font-semibold">
                      Quotation Validity (Days)
                    </Label>
                    <Input
                      id="fin-valid"
                      type="number"
                      min="5"
                      max="90"
                      value={quotationValidityDays}
                      onChange={(e) => setQuotationValidityDays(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t">
                  <Button type="submit" size="sm" className="h-8 text-xs gap-1.5" disabled={isSavingDefaults}>
                    {isSavingDefaults ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save Financial Defaults
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB 4: CRM & Lead Automations */}
        {/* ================================================================= */}
        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Pipeline &amp; Lead AI Automation
              </CardTitle>
              <CardDescription className="text-xs">
                Configure follow-up reminder thresholds and AI Copilot reply generation settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3.5 bg-card">
                  <div>
                    <h5 className="text-xs font-bold">AI Quotation &amp; Property Copilot</h5>
                    <p className="text-[11px] text-muted-foreground">
                      Enables the 1-click AI Draft button in the Messenger Hub to match budget and draft structured unit proposals.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableAiCopilot}
                    onChange={(e) => setEnableAiCopilot(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3.5 bg-card">
                  <div>
                    <h5 className="text-xs font-bold">Email Quotation Dispatch</h5>
                    <p className="text-[11px] text-muted-foreground">
                      Dispatches official PDF quotation sheets via SMTP whenever an agent sends an amortization sheet.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableEmailAlerts}
                    onChange={(e) => setEnableEmailAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 rounded-lg border p-3.5 bg-card">
                  <Label htmlFor="set-stale" className="text-xs font-semibold">
                    Stale Lead Follow-Up Alert Threshold
                  </Label>
                  <select
                    id="set-stale"
                    value={staleLeadHours}
                    onChange={(e) => setStaleLeadHours(e.target.value)}
                    className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                  >
                    <option value="24">24 Hours (High Urgency)</option>
                    <option value="48">48 Hours (Recommended)</option>
                    <option value="72">72 Hours (Standard)</option>
                    <option value="168">7 Days (Weekly Review)</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    Leads with no recorded contact after this window are elevated in your Priority Follow-Up queue.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t">
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    handleSaveFinancialDefaults({ preventDefault: () => {} } as React.FormEvent);
                  }}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Automation Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB 5: Data & Backup */}
        {/* ================================================================= */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Workspace Data &amp; Offline Backup
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your buyer leads, property computations, and deal records are continuously secured in your private workspace.
                  </CardDescription>
                </div>
                <Badge variant="won" className="text-[10px] gap-1 px-2.5 py-0.5">
                  <Radio className="h-2.5 w-2.5 animate-pulse text-pipeline-won" />
                  Cloud Synced
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-muted/20 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Buyer Leads</span>
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-bold tabular-nums">{leads.length}</div>
                  <p className="text-[11px] text-muted-foreground">Active in your pipeline</p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Properties</span>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-bold tabular-nums">{properties.length}</div>
                  <p className="text-[11px] text-muted-foreground">Available unit inventory</p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Quotations</span>
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-bold tabular-nums">{quotations.length}</div>
                  <p className="text-[11px] text-muted-foreground">Generated proposals</p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Deal Rooms</span>
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-bold tabular-nums">{deals.length}</div>
                  <p className="text-[11px] text-muted-foreground">In reservation &amp; closing</p>
                </div>
              </div>

              {/* Data Privacy & Broker Protection Card */}
              <div className="rounded-lg border bg-card p-4 space-y-2.5">
                <h5 className="text-xs font-bold flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Data Privacy &amp; Broker Protection
                </h5>
                <div className="grid gap-2.5 text-xs text-muted-foreground sm:grid-cols-3">
                  <div className="rounded-md border bg-muted/20 p-3 space-y-1">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                      <Lock className="h-3.5 w-3.5 text-primary" />
                      Isolated Tenant Storage
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Your buyer contact details and phone numbers are encrypted and isolated exclusively to your accredited account.
                    </p>
                  </div>

                  <div className="rounded-md border bg-muted/20 p-3 space-y-1">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-pipeline-won" />
                      Continuous Auto-Sync
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Every new quotation, stage change, and Messenger note automatically syncs to the cloud in real time.
                    </p>
                  </div>

                  <div className="rounded-md border bg-muted/20 p-3 space-y-1">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                      <Download className="h-3.5 w-3.5 text-primary" />
                      Full Data Ownership
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Export your complete CRM dataset anytime for offline audits, tax compliance, or independent backups.
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Section */}
              <div className="rounded-lg border bg-muted/15 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold text-foreground">
                    Download Complete Offline Archive (.json)
                  </h5>
                  <p className="text-[11px] text-muted-foreground">
                    Includes all buyer contacts, notes, unit payment calculations, and transaction records.
                  </p>
                </div>

                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 shrink-0"
                  onClick={handleExportWorkspace}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Backup JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

