"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Share2,
  Trash2,
  User,
} from "lucide-react";
import { useCrmStore } from "@/lib/store/crm-store";
import type { TrippingScheduleItem } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function TrippingsContent() {
  const searchParams = useSearchParams();
  const initialLeadId = searchParams.get("leadId");
  const initialPropId = searchParams.get("propertyId");

  const {
    trippings,
    leads,
    properties,
    addTripping,
    updateTrippingStatus,
    deleteTripping,
    sendMessage,
  } = useCrmStore();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [filterTab, setFilterTab] = React.useState<"ALL" | "UPCOMING" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [selectedLeadId, setSelectedLeadId] = React.useState<string>(
    initialLeadId || leads[0]?.id || ""
  );
  const [selectedPropId, setSelectedPropId] = React.useState<string>(
    initialPropId || properties[0]?.id || ""
  );
  const [dateVal, setDateVal] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [timeVal, setTimeVal] = React.useState("14:00");
  const [meetingPoint, setMeetingPoint] = React.useState(
    "Main Project Showroom & Sales Pavilion"
  );
  const [notesVal, setNotesVal] = React.useState("");

  // Automatically open dialog if routed with leadId or propertyId
  React.useEffect(() => {
    if (initialLeadId) {
      setSelectedLeadId(initialLeadId);
      setIsDialogOpen(true);
    }
    if (initialPropId) {
      setSelectedPropId(initialPropId);
    }
  }, [initialLeadId, initialPropId]);

  const handleCreateTripping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !selectedPropId) {
      toast.error("Please select a buyer lead and property unit.");
      return;
    }

    const lead = leads.find((l) => l.id === selectedLeadId);
    const prop = properties.find((p) => p.id === selectedPropId);

    addTripping({
      leadId: selectedLeadId,
      propertyId: selectedPropId,
      scheduledDate: dateVal,
      scheduledTime: timeVal,
      meetingPoint,
      status: "CONFIRMED",
      notes: notesVal || "Guided showroom & model unit viewing.",
    });

    if (lead) {
      sendMessage(
        lead.id,
        `📅 Confirmed Site Viewing Pass for ${prop?.projectName} (${prop?.unitCode})\n• Date & Time: ${dateVal} at ${timeVal}\n• Meeting Point: ${meetingPoint}`
      );
    }

    toast.success(
      `Site viewing booked for ${lead?.firstName || "Buyer"} ${lead?.lastName || ""}! Gate pass generated.`
    );
    setIsDialogOpen(false);
    setNotesVal("");
  };

  const handleDownloadIcs = (trip: TrippingScheduleItem) => {
    const lead = leads.find((l) => l.id === trip.leadId);
    const prop = properties.find((p) => p.id === trip.propertyId);
    const cleanDate = trip.scheduledDate.replace(/-/g, "");
    const cleanTime = trip.scheduledTime.replace(/:/g, "") + "00";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PropFlow CRM//Site Tripping Scheduler//EN",
      "BEGIN:VEVENT",
      `SUMMARY:Site Viewing: ${prop?.projectName || "Property"} with ${lead?.firstName || "Buyer"} ${lead?.lastName || ""}`,
      `DTSTART:${cleanDate}T${cleanTime}`,
      `LOCATION:${trip.meetingPoint}`,
      `DESCRIPTION:${trip.notes} (Buyer Contact: ${lead?.phone || "N/A"})`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tripping-${trip.scheduledDate}-${lead?.lastName || "buyer"}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded .ics Calendar Invite");
  };

  const getGoogleCalendarUrl = (trip: TrippingScheduleItem) => {
    const lead = leads.find((l) => l.id === trip.leadId);
    const prop = properties.find((p) => p.id === trip.propertyId);
    const cleanDate = trip.scheduledDate.replace(/-/g, "");
    const cleanTime = trip.scheduledTime.replace(/:/g, "") + "00";
    // Default 1 hour duration
    const startHour = parseInt(trip.scheduledTime.split(":")[0] || "14", 10);
    const endHour = String(Math.min(startHour + 1, 23)).padStart(2, "0");
    const endMinutes = trip.scheduledTime.split(":")[1] || "00";
    const cleanEndTime = `${endHour}${endMinutes}00`;

    const title = `Site Viewing: ${prop?.projectName || "Property"} - ${lead?.firstName || "Buyer"} ${lead?.lastName || ""}`;
    const details = `${trip.notes}\n\nBuyer Contact: ${lead?.phone || "N/A"}\nMeeting Location: ${trip.meetingPoint}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${cleanDate}T${cleanTime}/${cleanDate}T${cleanEndTime}&details=${encodeURIComponent(
      details
    )}&location=${encodeURIComponent(trip.meetingPoint)}`;
  };

  const handleShareWhatsAppInvite = (trip: TrippingScheduleItem) => {
    const lead = leads.find((l) => l.id === trip.leadId);
    const prop = properties.find((p) => p.id === trip.propertyId);

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      (prop?.projectName || "") + " " + trip.meetingPoint
    )}`;

    const text = `🗓️ *Site Viewing Gate Pass Confirmation*\n\n🏢 *Project:* ${prop?.projectName || "Development"} (${prop?.unitCode || "Model Unit"})\n👤 *Buyer:* ${lead?.firstName || "Guest"} ${lead?.lastName || ""}\n📅 *Date & Time:* ${trip.scheduledDate} at ${trip.scheduledTime}\n📍 *Meeting Point:* ${trip.meetingPoint}\n\n🚗 *Parking & Access Notes:* ${trip.notes || "VIP Guest Access"}\n🗺️ *Google Maps Pin:* ${mapsUrl}\n\nLooking forward to touring the property with you!`;

    navigator.clipboard.writeText(text);
    toast.success("Viewing confirmation copied! Ready to paste in WhatsApp, Viber, or Messenger.");

    if (lead?.phone) {
      const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, "_blank");
    }
  };

  const filteredTrippings = React.useMemo(() => {
    return trippings
      .filter((t) => {
        if (filterTab === "UPCOMING" && t.status === "COMPLETED") return false;
        if (filterTab === "COMPLETED" && t.status !== "COMPLETED") return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const lead = leads.find((l) => l.id === t.leadId);
          const prop = properties.find((p) => p.id === t.propertyId);
          const buyerName = `${lead?.firstName || ""} ${lead?.lastName || ""}`.toLowerCase();
          const proj = (prop?.projectName || "").toLowerCase();
          const point = t.meetingPoint.toLowerCase();
          return buyerName.includes(q) || proj.includes(q) || point.includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        return new Date(b.scheduledDate + "T" + b.scheduledTime).getTime() -
          new Date(a.scheduledDate + "T" + a.scheduledTime).getTime();
      });
  }, [trippings, filterTab, searchQuery, leads, properties]);

  return (
    <div className="container space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-normal tracking-tight text-foreground sm:text-3xl">
            Site Tripping &amp; Showroom Viewing Logistics
          </h1>
          <p className="text-xs text-muted-foreground">
            Schedule buyer inspections, auto-generate WhatsApp / Viber gate passes, and sync to Google &amp; Apple calendars.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90">
              <CalendarPlus className="h-3.5 w-3.5" />
              Schedule Site Viewing
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                Book Buyer Site Tripping
              </DialogTitle>
              <DialogDescription className="text-xs">
                Creates a verified viewing schedule, updates the lead stage to Site Tripping, and generates calendar &amp; messaging invites.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateTripping} className="space-y-3.5 py-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Select Buyer Lead *</Label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.firstName} {l.lastName} ({l.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Property / Showroom Unit *</Label>
                <select
                  value={selectedPropId}
                  onChange={(e) => setSelectedPropId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} — {p.unitCode} ({p.locationCity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Viewing Date *</Label>
                  <Input
                    type="date"
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Viewing Time *</Label>
                  <Input
                    type="time"
                    value={timeVal}
                    onChange={(e) => setTimeVal(e.target.value)}
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Showroom / Gate Meeting Point *</Label>
                <Input
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  placeholder="e.g. The Meridian Park Main Pavilion, 34th St., BGC"
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Gate Pass &amp; Parking Notes</Label>
                <Input
                  placeholder="e.g. VIP Guest Parking Slot #12, prepare 2BR model keys"
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Confirm &amp; Dispatch Pass
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
        <Tabs
          value={filterTab}
          onValueChange={(v) => setFilterTab(v as typeof filterTab)}
        >
          <TabsList className="h-8 text-xs">
            <TabsTrigger value="ALL" className="text-xs px-3">
              All Viewings ({trippings.length})
            </TabsTrigger>
            <TabsTrigger value="UPCOMING" className="text-xs px-3">
              Upcoming ({trippings.filter((t) => t.status !== "COMPLETED").length})
            </TabsTrigger>
            <TabsTrigger value="COMPLETED" className="text-xs px-3">
              Completed ({trippings.filter((t) => t.status === "COMPLETED").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search buyer, project, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Grid of Scheduled Trippings */}
      {filteredTrippings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-3 bg-muted/10">
          <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">No Scheduled Trippings Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? "No viewing sessions matched your search filters."
                : "Schedule your first property site tripping or showroom tour to get started."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5"
            onClick={() => setIsDialogOpen(true)}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Schedule Site Viewing
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTrippings.map((trip) => {
            const lead = leads.find((l) => l.id === trip.leadId);
            const prop = properties.find((p) => p.id === trip.propertyId);

            return (
              <Card key={trip.id} className="flex flex-col justify-between border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-1.5 gap-1 text-[11px] font-semibold">
                          <Badge
                            variant={
                              trip.status === "COMPLETED"
                                ? "won"
                                : trip.status === "CONFIRMED"
                                ? "tripping"
                                : "outline"
                            }
                            className="text-[10px] cursor-pointer"
                          >
                            {trip.status} ▾
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel className="text-xs">Update Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            updateTrippingStatus(trip.id, "CONFIRMED");
                            toast.success("Viewing marked as Confirmed!");
                          }}
                          className="text-xs"
                        >
                          Confirmed
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            updateTrippingStatus(trip.id, "COMPLETED");
                            toast.success("Viewing marked as Completed!");
                          }}
                          className="text-xs"
                        >
                          Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            updateTrippingStatus(trip.id, "RESCHEDULED");
                            toast.info("Viewing marked as Rescheduled.");
                          }}
                          className="text-xs"
                        >
                          Rescheduled
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            updateTrippingStatus(trip.id, "CANCELLED");
                            toast.info("Viewing marked as Cancelled.");
                          }}
                          className="text-xs text-rose-600"
                        >
                          Cancelled
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            deleteTripping(trip.id);
                            toast.success("Viewing schedule removed.");
                          }}
                          className="text-xs text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1.5" />
                          Delete Schedule
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <span className="flex items-center gap-1 text-xs font-semibold text-primary tabular-nums font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      {trip.scheduledDate} • {trip.scheduledTime}
                    </span>
                  </div>

                  <CardTitle className="mt-2 text-base font-bold">
                    {prop?.projectName || "Development Project"} ({prop?.unitCode || "Unit"})
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{trip.meetingPoint}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="rounded-lg border bg-muted/30 p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5 text-foreground">
                        <User className="h-3.5 w-3.5 text-primary" />
                        {lead?.firstName || "Prospective"} {lead?.lastName || "Buyer"}
                      </span>
                      <span className="text-muted-foreground font-mono">{lead?.phone || "No phone"}</span>
                    </div>
                    {trip.notes && (
                      <p className="text-[11px] text-muted-foreground pt-0.5">
                        {trip.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
                        onClick={() => handleShareWhatsAppInvite(trip)}
                        title="Copy gate pass invite or open in WhatsApp"
                      >
                        <Share2 className="h-3 w-3" />
                        WhatsApp / Viber
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        asChild
                      >
                        <a
                          href={getGoogleCalendarUrl(trip)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Google Cal
                        </a>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleDownloadIcs(trip)}
                      >
                        <Download className="h-3 w-3" />
                        .ICS
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      {lead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          asChild
                        >
                          <Link href={`/inbox?leadId=${lead.id}`}>
                            <MessageSquare className="h-3 w-3" />
                            Chat
                          </Link>
                        </Button>
                      )}

                      {trip.status !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            updateTrippingStatus(trip.id, "COMPLETED");
                            toast.success("Site viewing completed!");
                          }}
                        >
                          <CheckCircle2 className="h-3 w-3 text-pipeline-won" />
                          Done
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TrippingsPage() {
  return (
    <React.Suspense fallback={<div className="container py-8 text-center text-xs text-muted-foreground">Loading Tripping Logistics...</div>}>
      <TrippingsContent />
    </React.Suspense>
  );
}
