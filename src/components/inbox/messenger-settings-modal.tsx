"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Globe2,
  HelpCircle,
  KeyRound,
  Loader2,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unplug,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrmStore } from "@/lib/store/crm-store";

interface MessengerSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessengerSettingsModal({
  open,
  onOpenChange,
}: MessengerSettingsModalProps) {
  const { messengerSettings, updateMessengerSettings, activeAgentUid } =
    useCrmStore();

  const [pageId, setPageId] = React.useState("");
  const [pageName, setPageName] = React.useState("");
  const [pageAccessToken, setPageAccessToken] = React.useState("");
  const [appSecret, setAppSecret] = React.useState("");
  const [autoReplyGreeting, setAutoReplyGreeting] = React.useState(true);
  const [greetingMessage, setGreetingMessage] = React.useState("");

  const [showToken, setShowToken] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // Sync state whenever settings change or modal opens
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
      // Sensible defaults
      setGreetingMessage(
        "Hi {name}! Thanks for reaching out. Are you interested in pre-selling or ready-for-occupancy units?"
      );
    }
  }, [messengerSettings, open]);

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

  const handleFillDemoCredentials = () => {
    setPageId("109283746599182");
    setPageName("Marco Reyes - BGC Premier Realty");
    setPageAccessToken("EAAdemo_marco_reyes_bgc_real_estate_pat_2026");
    setAppSecret("demo_meta_app_secret_998811");
    toast.info("Populated demo Facebook Page credentials");
  };

  const handleVerifyConnection = async () => {
    if (!pageAccessToken.trim()) {
      toast.error("Please enter a Page Access Token to test");
      return;
    }

    setIsVerifying(true);
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

      if (data.pageName && !pageName.trim()) {
        setPageName(data.pageName);
      }
      if (data.pageId && (!pageId.trim() || pageId.trim() === "0")) {
        setPageId(data.pageId);
      }

      toast.success(
        `Verified successfully! Connected to: ${data.pageName} (Page ID: ${data.pageId})`
      );

      // Auto-save verified state
      await updateMessengerSettings({
        pageId: data.pageId || pageId.trim(),
        pageName: data.pageName || pageName.trim(),
        pageAccessToken: pageAccessToken.trim(),
        appSecret: appSecret.trim(),
        isConnected: true,
        lastVerifiedAt: new Date().toISOString(),
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to verify token with Meta"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageId.trim() || !pageAccessToken.trim()) {
      toast.error("Page ID and Page Access Token are required.");
      return;
    }

    setIsSaving(true);
    try {
      await updateMessengerSettings({
        pageId: pageId.trim(),
        pageName: pageName.trim() || "Agent Facebook Page",
        pageAccessToken: pageAccessToken.trim(),
        appSecret: appSecret.trim(),
        isConnected: true,
        autoReplyGreeting,
        greetingMessage,
        lastVerifiedAt:
          messengerSettings?.lastVerifiedAt || new Date().toISOString(),
      });
      toast.success("Messenger channel settings saved successfully!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect this Facebook Page from your CRM inbox?"
      )
    ) {
      return;
    }

    await updateMessengerSettings({
      isConnected: false,
      lastVerifiedAt: null,
    });
    toast.info("Facebook Page disconnected.");
  };

  const isConnected = messengerSettings?.isConnected && Boolean(messengerSettings.pageId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-5 pb-3 border-b bg-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Globe2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Meta Messenger Channel Settings
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Connect your Facebook Business Page for isolated two-way buyer messaging.
                </DialogDescription>
              </div>
            </div>

            {isConnected ? (
              <Badge variant="won" className="text-[11px] gap-1 px-2.5 py-0.5">
                <Radio className="h-3 w-3 animate-pulse text-pipeline-won" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px] text-amber-500 border-amber-500/40">
                Not Connected
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="credentials" className="w-full">
          <div className="px-5 pt-3 border-b bg-muted/20">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="credentials" className="text-xs gap-1.5">
                <KeyRound className="h-3.5 w-3.5" />
                Credentials
              </TabsTrigger>
              <TabsTrigger value="webhook" className="text-xs gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Webhook &amp; Routing
              </TabsTrigger>
              <TabsTrigger value="automations" className="text-xs gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Automations
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Credentials */}
          <TabsContent value="credentials" className="p-5 space-y-4 m-0">
            {/* Status card */}
            <div className="rounded-lg border bg-card p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    isConnected ? "bg-pipeline-won/15 text-pipeline-won" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isConnected ? <CheckCircle2 className="h-5 w-5" /> : <Unplug className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold">
                    {isConnected
                      ? pageName || "Connected Facebook Page"
                      : "No Facebook Page Connected"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {isConnected ? (
                      <>
                        Page ID: <span className="font-mono text-foreground">{pageId}</span> • Verified
                      </>
                    ) : (
                      "Add your Facebook Page credentials below to sync buyer inquiries directly."
                    )}
                  </p>
                </div>
              </div>

              {!isConnected && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] shrink-0"
                  onClick={handleFillDemoCredentials}
                >
                  Load Demo Credentials
                </Button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pageId" className="text-xs font-semibold">
                    Facebook Page ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pageId"
                    placeholder="e.g. 109283746599182"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    className="h-8 text-xs font-mono"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Found in your Facebook Page &gt; About &gt; Page Transparency.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pageName" className="text-xs font-semibold">
                    Page Display Name
                  </Label>
                  <Input
                    id="pageName"
                    placeholder="e.g. Marco Reyes - BGC Premier"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Label displayed in your CRM Messenger thread.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="token" className="text-xs font-semibold">
                  Page Access Token (PAT) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="token"
                    type={showToken ? "text" : "password"}
                    placeholder="EAAB..."
                    value={pageAccessToken}
                    onChange={(e) => setPageAccessToken(e.target.value)}
                    className="h-8 text-xs font-mono pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((prev) => !prev)}
                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                    title={showToken ? "Hide token" : "Show token"}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Permanent Page Access Token generated from Meta for Developers &gt; Messenger &gt; API Setup.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="appSecret" className="text-xs font-semibold">
                  Meta App Secret <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="appSecret"
                  type="password"
                  placeholder="App Secret for X-Hub-Signature HMAC verification"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={handleVerifyConnection}
                    disabled={isVerifying || !pageAccessToken.trim()}
                  >
                    {isVerifying ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 text-primary" />
                    )}
                    Test &amp; Verify Token
                  </Button>

                  {isConnected && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10"
                      onClick={handleDisconnect}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Disconnect
                    </Button>
                  )}
                </div>

                <Button type="submit" size="sm" className="h-8 text-xs gap-1.5" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save Channel Settings
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: Webhook & Separation Strategy */}
          <TabsContent value="webhook" className="p-5 space-y-4 m-0">
            {/* Explanation banner */}
            <div className="rounded-lg border bg-primary/5 border-primary/20 p-3.5 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <ShieldCheck className="h-4 w-4" />
                Per-Agent Routing &amp; Message Separation Strategy
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                When a buyer sends a message on Facebook, Meta tags the payload with your Facebook <strong>Page ID</strong>. PropFlow routes the webhook directly to your private workspace (<code className="font-mono text-primary">/agents/{activeAgentUid || "you"}/messages</code>). Other agents on the team never receive or view your buyers.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Meta Webhook Callback URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={callbackUrl}
                    className="h-8 text-xs font-mono bg-muted/40"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 shrink-0 text-xs gap-1"
                    onClick={() => copyToClipboard(callbackUrl, "url")}
                  >
                    {copiedField === "url" ? (
                      <Check className="h-3.5 w-3.5 text-pipeline-won" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Meta Webhook Verify Token</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={verifyToken}
                    className="h-8 text-xs font-mono bg-muted/40"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 shrink-0 text-xs gap-1"
                    onClick={() => copyToClipboard(verifyToken, "token")}
                  >
                    {copiedField === "token" ? (
                      <Check className="h-3.5 w-3.5 text-pipeline-won" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick setup steps */}
            <div className="rounded-lg border bg-card p-3.5 space-y-2 text-xs">
              <h5 className="font-bold flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                3-Step Meta Setup Guide
              </h5>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground leading-relaxed pl-1">
                <li>
                  Open <span className="font-semibold text-foreground">Meta for Developers</span> &gt; Your App &gt; <span className="font-semibold text-foreground">Messenger</span> &gt; <span className="font-semibold text-foreground">Webhooks</span>.
                </li>
                <li>
                  Click <span className="font-semibold text-foreground">Add Callback URL</span>, paste the URL and Verify Token above, then click <span className="font-semibold text-foreground">Verify and Save</span>.
                </li>
                <li>
                  Under Page Subscriptions, subscribe your Page to:{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground">messages</code> and{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground">messaging_postbacks</code>.
                </li>
              </ol>
            </div>
          </TabsContent>

          {/* TAB 3: Automations */}
          <TabsContent value="automations" className="p-5 space-y-4 m-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="autoGreeting" className="text-xs font-bold cursor-pointer">
                    Instant Welcome Greeting
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically sends an initial greeting when a new buyer messages your Facebook Page.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="autoGreeting"
                  checked={autoReplyGreeting}
                  onChange={(e) => setAutoReplyGreeting(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {autoReplyGreeting && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="greetingMessage" className="text-xs font-semibold">
                      Greeting Message Template
                    </Label>
                    <span className="text-[10px] text-muted-foreground">
                      Use <code className="font-mono text-primary font-bold">{"{name}"}</code> for buyer&apos;s name
                    </span>
                  </div>
                  <textarea
                    id="greetingMessage"
                    rows={4}
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    className="w-full rounded-md border border-input bg-background p-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Hi {name}! Welcome to our showroom..."
                  />
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={async () => {
                    await updateMessengerSettings({
                      autoReplyGreeting,
                      greetingMessage,
                    });
                    toast.success("Automations preferences updated!");
                    onOpenChange(false);
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                  Save Automation Preferences
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

