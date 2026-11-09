"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Bot,
  Calculator,
  CheckCheck,
  FileSpreadsheet,
  Globe2,
  MapPin,
  MessageCircle,
  MessageSquarePlus,
  Radio,
  Send,
  Settings,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import {
  PIPELINE_STAGE_LABELS,
  type PipelineStage,
} from "@/lib/schemas";
import {
  SAVED_REPLY_SNIPPETS,
  useCrmStore,
} from "@/lib/store/crm-store";
import { MessengerSettingsModal } from "@/components/inbox/messenger-settings-modal";
import { WhatsAppViberShareModal } from "@/components/quotations/whatsapp-viber-share-modal";
import { useAuth } from "@/lib/firebase/auth-context";
import { cn, formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function InboxContent() {
  const searchParams = useSearchParams();
  const queryLeadId = searchParams.get("leadId");

  const {
    leads,
    messages,
    properties,
    sendMessage,
    receiveWebhookMessage,
    moveLeadStage,
    messengerSettings,
  } = useCrmStore();
  const { agentProfile } = useAuth();

  const [activeLeadId, setActiveLeadId] = React.useState<string>(
    queryLeadId || leads[0]?.id || ""
  );
  const [draftText, setDraftText] = React.useState("");
  const [showSnippets, setShowSnippets] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [shareModalOpen, setShareModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (queryLeadId) {
      setActiveLeadId(queryLeadId);
    }
  }, [queryLeadId]);

  const openSettingsParam = searchParams.get("openSettings");
  React.useEffect(() => {
    if (openSettingsParam === "true") {
      setSettingsOpen(true);
    }
  }, [openSettingsParam]);

  const activeLead = React.useMemo(
    () => leads.find((l) => l.id === activeLeadId) ?? leads[0],
    [leads, activeLeadId]
  );

  const isPageConnected = Boolean(
    messengerSettings?.isConnected && messengerSettings?.pageId
  );

  const threadMessages = React.useMemo(
    () =>
      messages
        .filter((m) => m.leadId === activeLead?.id)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    [messages, activeLead]
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !draftText.trim()) return;
    const textToSend = draftText.trim();
    sendMessage(activeLead.id, textToSend);
    setDraftText("");
    setShowSnippets(false);

    // If connected to Facebook Page and buyer has a PSID, dispatch to Meta Send API
    if (activeLead.messengerPsid && isPageConnected && messengerSettings?.pageAccessToken) {
      try {
        void fetch("/api/messenger/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientPsid: activeLead.messengerPsid,
            text: textToSend,
            pageAccessToken: messengerSettings.pageAccessToken,
          }),
        });
      } catch (err) {
        console.warn("Outbound Messenger send notice:", err);
      }
    }
  };

  const handleInsertSnippet = (body: string) => {
    setDraftText(body);
    setShowSnippets(false);
    toast.info("Loaded saved reply snippet into composer");
  };

  const handleAiDraftReply = () => {
    if (!activeLead) return;
    const bestProp =
      properties.find(
        (p) =>
          p.listPrice <= activeLead.budgetMax * 1.15 &&
          p.listPrice >= activeLead.budgetMin * 0.8
      ) ?? properties[0];

    if (!bestProp) return;
    const monthlyEquity24 =
      (bestProp.listPrice * 0.2 - bestProp.reservationFee) / 24;
    const portalLink = `${window.location.origin}/quote/${activeLead.id.slice(
      0,
      8
    )}?leadId=${activeLead.id}&unit=${encodeURIComponent(bestProp.unitCode)}`;

    const aiDraft = `Hi ${activeLead.firstName}! Based on your target budget of ${formatCompactCurrency(
      activeLead.budgetMax
    )} and preference for ${activeLead.preferredLocations[0]}, I highly recommend ${
      bestProp.projectName
    } (${bestProp.unitCode} – ${bestProp.floorAreaSqm} sqm). With our 24-month stretched equity promo, monthly DP is only ${formatCurrency(
      monthlyEquity24
    )}/mo. You can customize your payment terms and reserve online here: ${portalLink}`;

    setDraftText(aiDraft);
    toast.success(
      `AI Copilot matched ${bestProp.unitCode} and drafted a personalized reply!`
    );
  };

  const handleQuickAttachQuotation = (propId: string) => {
    if (!activeLead) return;
    const prop = properties.find((p) => p.id === propId);
    if (!prop) return;

    const dp20 = prop.listPrice * 0.2 - prop.reservationFee;
    const monthlyDp24 = dp20 / 24;
    const loan80 = prop.listPrice * 0.8;
    // 15 yrs @ 7.5%
    const r = 0.075 / 12;
    const n = 180;
    const monthlyAmort =
      (loan80 * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);

    const summaryMsg = `📊 Quick Quotation Sheet: ${prop.projectName} (${prop.unitCode})\n• List Price: ${formatCurrency(prop.listPrice, "PHP", 0)}\n• Reservation Fee: ${formatCurrency(prop.reservationFee, "PHP", 0)}\n• 20% Monthly Equity (24 mos): ${formatCurrency(monthlyDp24)}/mo\n• 80% Bank Amortization (15 yrs @ 7.5%): ${formatCurrency(monthlyAmort)}/mo`;

    sendMessage(activeLead.id, summaryMsg);
    toast.success(`Attached ${prop.unitCode} quotation to chat thread`);
  };

  const handleSimulateIncomingWebhook = () => {
    if (!activeLead) return;
    const psid = activeLead.messengerPsid || `psid_sim_${activeLead.id.slice(0, 6)}`;
    const sampleQuestions = [
      "Hi Marco! Can we schedule a site viewing this Sunday morning around 10 AM?",
      "If I pay 30% Down Payment, how much will my monthly bank amortization drop to?",
      "Do you accept online bank transfer for the unit reservation fee?",
    ];
    const randomMsg =
      sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)] ??
      sampleQuestions[0]!;

    receiveWebhookMessage(
      psid,
      `${activeLead.firstName} ${activeLead.lastName}`,
      randomMsg
    );
    toast.info(
      `Webhook Event: New Messenger reply from ${activeLead.firstName}`
    );
  };

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-3.5rem)] w-full min-w-0 max-w-full flex-col md:flex-row overflow-hidden">
      {/* LEFT PANE: Conversations Thread List */}
      <div className="w-full min-w-0 border-b md:w-72 md:shrink-0 md:border-b-0 md:border-r flex flex-col bg-card">
        <div className="flex items-center justify-between border-b p-3">
          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold truncate">Messenger Hub</h2>
              {isPageConnected ? (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="inline-flex items-center gap-1 text-[10px] text-pipeline-won font-medium hover:underline shrink-0"
                  title="Page Connected - Click to view Channel Settings"
                >
                  <Radio className="h-2 w-2 animate-pulse text-pipeline-won" />
                  Active
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="inline-flex items-center text-[10px] text-amber-500 font-medium hover:underline shrink-0"
                  title="Click to Connect Facebook Page"
                >
                  Connect Page
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {isPageConnected
                ? messengerSettings?.pageName || "Facebook Page Active"
                : "Multi-Agent Routing Ready"}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSettingsOpen(true)}
              title="Messenger Channel Settings (Page Access Token & Webhook)"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2 gap-1"
              onClick={handleSimulateIncomingWebhook}
              title="Simulate Meta Graph API POST Webhook Event"
            >
              <Zap className="h-3 w-3 text-pipeline-proposal" />
              <span className="hidden sm:inline">Simulate</span>
            </Button>
          </div>
        </div>

        <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto divide-x md:divide-x-0 md:divide-y">
          {leads.map((lead) => {
            const leadMsgs = messages.filter((m) => m.leadId === lead.id);
            const lastMsg = leadMsgs[leadMsgs.length - 1];
            const isSelected = lead.id === activeLead?.id;

            return (
              <button
                key={lead.id}
                type="button"
                onClick={() => setActiveLeadId(lead.id)}
                className={cn(
                  "flex min-w-[220px] md:min-w-0 flex-col gap-1 p-3 text-left transition-colors hover:bg-accent/50",
                  isSelected && "bg-primary/10 border-l-2 border-l-primary"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold truncate">
                    {lead.firstName} {lead.lastName}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {lead.stage.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {lastMsg
                    ? lastMsg.content
                    : "No Messenger messages yet. Start conversation."}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* CENTER PANE: Active Two-Way Chat Thread */}
      <div className="flex min-w-0 flex-1 flex-col bg-background overflow-hidden">
        {activeLead ? (
          <>
            {/* Thread Header */}
            <div className="flex items-center justify-between gap-2 border-b bg-card px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {activeLead.firstName[0]}
                  {activeLead.lastName[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold truncate">
                      {activeLead.firstName} {activeLead.lastName}
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-pipeline-won font-medium shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-pipeline-won" />
                      Messenger Active
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    PSID: {activeLead.messengerPsid || "Manual Lead"} •{" "}
                    {activeLead.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Mobile & Tablet Lead Context Sheet Trigger (<xl screens) */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs gap-1 xl:hidden"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Lead & Units</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto">
                    <SheetHeader className="text-left">
                      <SheetTitle className="text-base">
                        {activeLead.firstName} {activeLead.lastName}
                      </SheetTitle>
                      <SheetDescription className="text-xs">
                        {activeLead.phone} • {activeLead.email || "Messenger Lead"}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="font-bold tabular-nums">
                            {formatCompactCurrency(activeLead.budgetMin)} –{" "}
                            {formatCompactCurrency(activeLead.budgetMax)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Areas:</span>
                          <span className="font-medium truncate max-w-[160px]">
                            {activeLead.preferredLocations.join(", ")}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Update Deal Stage</Label>
                        <select
                          value={activeLead.stage}
                          onChange={(e) => {
                            const nextStage = e.target.value as PipelineStage;
                            moveLeadStage(activeLead.id, nextStage);
                            toast.success(
                              `Stage updated to ${PIPELINE_STAGE_LABELS[nextStage]}`
                            );
                          }}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm"
                        >
                          {(
                            Object.keys(
                              PIPELINE_STAGE_LABELS
                            ) as PipelineStage[]
                          ).map((st) => (
                            <option key={st} value={st}>
                              {PIPELINE_STAGE_LABELS[st]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                          Quick-Attach Unit Computation
                        </Label>
                        {properties.map((prop) => (
                          <div
                            key={prop.id}
                            className="rounded-lg border p-2.5 text-xs space-y-1.5"
                          >
                            <div className="font-semibold leading-tight">
                              {prop.projectName}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{prop.unitCode}</span>
                              <span className="font-semibold text-foreground tabular-nums">
                                {formatCompactCurrency(prop.listPrice)}
                              </span>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-7 w-full text-[11px]"
                              onClick={() =>
                                handleQuickAttachQuotation(prop.id)
                              }
                            >
                              Attach Sample Computation
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 dark:text-emerald-400"
                  onClick={() => setShareModalOpen(true)}
                  title="Generate formatted WhatsApp / Viber property card"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>

                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                  <Link href={`/quotations?leadId=${activeLead.id}`}>
                    <Calculator className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Full Quote</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Messages Scroll Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {threadMessages.map((msg) => {
                const isAgent = msg.senderType === "AGENT";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[82%] sm:max-w-[70%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm",
                      isAgent
                        ? "ml-auto bg-primary text-primary-foreground rounded-br-none"
                        : "mr-auto border bg-card text-card-foreground rounded-bl-none"
                    )}
                  >
                    <p className="whitespace-pre-line break-words">{msg.content}</p>
                    <div
                      className={cn(
                        "mt-1 flex items-center justify-end gap-1 text-[10px]",
                        isAgent
                          ? "text-primary-foreground/75"
                          : "text-muted-foreground"
                      )}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isAgent && <CheckCheck className="h-3 w-3" />}
                    </div>
                  </div>
                );
              })}

              {threadMessages.length === 0 && (
                <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
                  No messages in this thread yet. Choose a saved reply snippet below or attach a quotation sheet.
                </div>
              )}
            </div>

            {/* Saved Reply Snippets Drawer */}
            {showSnippets && (
              <div className="border-t bg-muted/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    Saved Agent Reply Snippets
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => setShowSnippets(false)}
                  >
                    Close
                  </Button>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {SAVED_REPLY_SNIPPETS.map((snip) => (
                    <button
                      key={snip.id}
                      type="button"
                      onClick={() => handleInsertSnippet(snip.bodyTemplate)}
                      className="rounded-lg border bg-card p-2 text-left text-xs hover:border-primary transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{snip.title}</span>
                        <Badge variant="secondary" className="text-[9px]">
                          {snip.shortcut}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {snip.bodyTemplate}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Channel Dispatch Status Indicator */}
            <div className="flex items-center justify-between border-t bg-muted/20 px-3.5 py-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5 truncate">
                {isPageConnected ? (
                  <>
                    <Globe2 className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">
                      Replying via Page:{" "}
                      <strong className="text-foreground font-semibold">
                        {messengerSettings?.pageName || messengerSettings?.pageId}
                      </strong>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-amber-500 font-medium">⚠️ No Page Connected.</span>
                    <span className="truncate">Replies stay internal in CRM.</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="text-primary hover:underline font-medium shrink-0 ml-2 text-[10px]"
              >
                {isPageConnected ? "Channel Settings" : "Connect Page"}
              </button>
            </div>

            {/* Composer Input Bar */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t bg-card p-3"
            >
              <Button
                type="button"
                variant={showSnippets ? "default" : "outline"}
                size="sm"
                className="h-9 px-2.5 text-xs gap-1 shrink-0"
                onClick={() => setShowSnippets((prev) => !prev)}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Snippets</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 px-2.5 text-xs gap-1 shrink-0 text-primary"
                onClick={handleAiDraftReply}
                title="AI Sales Copilot: Draft personalized unit match & computation reply"
              >
                <Bot className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">AI Draft</span>
              </Button>

              <Input
                placeholder={`Reply to ${activeLead.firstName} via Facebook Messenger...`}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="h-9 text-xs"
              />

              <Button type="submit" size="sm" className="h-9 px-4 text-xs gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </form>
          </>
        ) : null}
      </div>

      {/* RIGHT PANE: Lead Context & Quick-Attach Quotation Accelerators */}
      {activeLead && (
        <div className="hidden xl:flex xl:w-80 flex-col border-l bg-card p-4 space-y-4 overflow-y-auto">
          <div>
            <Label className="text-muted-foreground">Lead CRM Profile</Label>
            <h3 className="mt-1 text-sm font-bold">
              {activeLead.firstName} {activeLead.lastName}
            </h3>
            <p className="text-xs text-muted-foreground">{activeLead.email}</p>
          </div>

          <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5" /> Budget:
              </span>
              <span className="font-bold tabular-nums">
                {formatCompactCurrency(activeLead.budgetMin)} –{" "}
                {formatCompactCurrency(activeLead.budgetMax)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Areas:
              </span>
              <span className="font-medium truncate max-w-[150px]">
                {activeLead.preferredLocations.join(", ")}
              </span>
            </div>
          </div>

          {/* Pipeline Stage Quick Update */}
          <div className="space-y-1.5">
            <Label>Update Deal Stage</Label>
            <select
              value={activeLead.stage}
              onChange={(e) => {
                const nextStage = e.target.value as PipelineStage;
                moveLeadStage(activeLead.id, nextStage);
                toast.success(
                  `Stage updated to ${PIPELINE_STAGE_LABELS[nextStage]}`
                );
              }}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm"
            >
              {(Object.keys(PIPELINE_STAGE_LABELS) as PipelineStage[]).map(
                (st) => (
                  <option key={st} value={st}>
                    {PIPELINE_STAGE_LABELS[st]}
                  </option>
                )
              )}
            </select>
          </div>

          {/* One-Click Attach Property Quotation Sheet */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
              Quick-Attach Unit Computation
            </Label>
            <div className="space-y-2">
              {properties.map((prop) => (
                <div
                  key={prop.id}
                  className="rounded-lg border p-2.5 text-xs space-y-1.5"
                >
                  <div className="font-semibold leading-tight">
                    {prop.projectName}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{prop.unitCode}</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatCompactCurrency(prop.listPrice)}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 w-full text-[11px]"
                    onClick={() => handleQuickAttachQuotation(prop.id)}
                  >
                    Attach Sample Computation
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Messenger Channel Settings Modal */}
      <MessengerSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      {/* WhatsApp / Viber Quick Share Modal */}
      {activeLead &&
        (() => {
          const bestProp =
            properties.find(
              (p) =>
                p.listPrice <= activeLead.budgetMax * 1.15 &&
                p.listPrice >= activeLead.budgetMin * 0.8
            ) ?? properties[0];

          const listPrice = bestProp?.listPrice ?? 15000000;
          const rf = bestProp?.reservationFee ?? 25000;
          const dp20 = listPrice * 0.2 - rf;
          const monthlyDp = dp20 / 24;
          const loan80 = listPrice * 0.8;
          const r = 0.075 / 12;
          const n = 180;
          const monthlyAmort =
            (loan80 * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);

          return (
            <WhatsAppViberShareModal
              open={shareModalOpen}
              onOpenChange={setShareModalOpen}
              quotationData={{
                projectName: bestProp?.projectName ?? "Premier Condominium",
                unitCode: bestProp?.unitCode ?? "Unit Spec",
                floorAreaSqm: bestProp?.floorAreaSqm ?? 65,
                locationCity: bestProp?.locationCity ?? "Metro Manila",
                totalContractPrice: listPrice,
                reservationFee: rf,
                monthlyDownPayment: monthlyDp,
                downPaymentMonths: 24,
                monthlyAmortization: monthlyAmort,
                loanTenorYears: 15,
                annualInterestRate: 7.5,
                buyerName: `${activeLead.firstName} ${activeLead.lastName}`,
                buyerPhone: activeLead.phone,
                agentName: agentProfile?.fullName || "Licensed Real Estate Broker",
                agentLicense: agentProfile?.prcLicenseNumber || "PRC Accredited",
                shareUrl: `${
                  typeof window !== "undefined"
                    ? window.location.origin
                    : "https://propflow.ph"
                }/quote/${activeLead.id.slice(0, 8)}?leadId=${
                  activeLead.id
                }&unit=${encodeURIComponent(bestProp?.unitCode ?? "")}`,
              }}
            />
          );
        })()}
    </div>
  );
}

export default function InboxPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-6 text-xs text-muted-foreground">
          Loading Messenger Hub...
        </div>
      }
    >
      <InboxContent />
    </React.Suspense>
  );
}

