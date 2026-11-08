"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Download,
  MapPin,
  MessageSquare,
  User,
} from "lucide-react";
import { useCrmStore } from "@/lib/store/crm-store";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TrippingScheduleItem {
  id: string;
  leadId: string;
  propertyId: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  meetingPoint: string;
  status: "CONFIRMED" | "COMPLETED" | "RESCHEDULED";
  notes: string;
}

const INITIAL_TRIPPINGS: TrippingScheduleItem[] = [
  {
    id: "trip-001",
    leadId: "20000000-0000-4000-8000-000000000002",
    propertyId: "10000000-0000-4000-8000-000000000001",
    scheduledDate: "2026-11-14",
    scheduledTime: "14:00",
    meetingPoint: "The Meridian Park Main Pavilion, 34th St., BGC",
    status: "CONFIRMED",
    notes: "VIP Guest Parking Slot #12 reserved. Prepare 2BR Corner scale model.",
  },
  {
    id: "trip-002",
    leadId: "20000000-0000-4000-8000-000000000001",
    propertyId: "10000000-0000-4000-8000-000000000002",
    scheduledDate: "2026-11-15",
    scheduledTime: "10:30",
    meetingPoint: "Solana Verde Clubhouse Gate, Nuvali South",
    status: "CONFIRMED",
    notes: "Inspecting Aria RFO Model House (Block 14 Lot 8) with family.",
  },
];

export default function TrippingsPage() {
  const { leads, properties, moveLeadStage, sendMessage } = useCrmStore();
  const [trippings, setTrippings] =
    React.useState<TrippingScheduleItem[]>(INITIAL_TRIPPINGS);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const [selectedLeadId, setSelectedLeadId] = React.useState(
    leads[0]?.id || ""
  );
  const [selectedPropId, setSelectedPropId] = React.useState(
    properties[0]?.id || ""
  );
  const [dateVal, setDateVal] = React.useState("2026-11-15");
  const [timeVal, setTimeVal] = React.useState("14:00");
  const [meetingPoint, setMeetingPoint] = React.useState(
    "Main Project Showroom Lobby"
  );
  const [notesVal, setNotesVal] = React.useState("");

  const handleCreateTripping = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrip: TrippingScheduleItem = {
      id: `trip-${Date.now()}`,
      leadId: selectedLeadId,
      propertyId: selectedPropId,
      scheduledDate: dateVal,
      scheduledTime: timeVal,
      meetingPoint,
      status: "CONFIRMED",
      notes: notesVal || "Guided showroom & model unit viewing.",
    };

    setTrippings((prev) => [newTrip, ...prev]);

    const lead = leads.find((l) => l.id === selectedLeadId);
    const prop = properties.find((p) => p.id === selectedPropId);

    if (lead) {
      moveLeadStage(lead.id, "SITE_TRIPPING");
      sendMessage(
        lead.id,
        `📅 Confirmed Site Viewing Pass for ${prop?.projectName} (${prop?.unitCode})\n• Date & Time: ${dateVal} at ${timeVal}\n• Meeting Point: ${meetingPoint}`
      );
    }

    toast.success(
      `Site tripping booked for ${lead?.firstName} ${lead?.lastName} and sent via Messenger!`
    );
    setIsDialogOpen(false);
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
      `SUMMARY:Site Viewing: ${prop?.projectName} with ${lead?.firstName} ${lead?.lastName}`,
      `DTSTART:${cleanDate}T${cleanTime}`,
      `LOCATION:${trip.meetingPoint}`,
      `DESCRIPTION:${trip.notes} (Buyer Contact: ${lead?.phone})`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
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

  const handleMarkCompleted = (tripId: string) => {
    setTrippings((prev) =>
      prev.map((t) =>
        t.id === tripId ? { ...t, status: "COMPLETED" as const } : t
      )
    );
    toast.success("Site viewing marked as Completed!");
  };

  return (
    <div className="container space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-normal tracking-tight text-foreground sm:text-3xl">
            Site Tripping &amp; Showroom Viewing Scheduler
          </h1>
          <p className="text-xs text-muted-foreground">
            Coordinate buyer site visits, send Messenger gate passes, and export `.ics` calendar invites.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs gap-1.5">
              <CalendarPlus className="h-3.5 w-3.5" />
              Schedule Site Viewing
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Book Buyer Site Viewing</DialogTitle>
              <DialogDescription>
                Automatically moves the buyer to Site Tripping stage and dispatches a Messenger confirmation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTripping} className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Select Buyer Lead</Label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.firstName} {l.lastName} ({l.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Property / Showroom Model Unit</Label>
                <select
                  value={selectedPropId}
                  onChange={(e) => setSelectedPropId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} — {p.unitCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Viewing Date</Label>
                  <Input
                    type="date"
                    value={dateVal}
                    onChange={(e) => setDateVal(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Viewing Time</Label>
                  <Input
                    type="time"
                    value={timeVal}
                    onChange={(e) => setTimeVal(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Showroom / Gate Meeting Point</Label>
                <Input
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label>Parking & Gate Pass Notes</Label>
                <Input
                  placeholder="e.g. Bringing 1 SUV, prepare RFO keys"
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
                <Button type="submit" size="sm">
                  Confirm & Send Gate Pass
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {trippings.map((trip) => {
          const lead = leads.find((l) => l.id === trip.leadId);
          const prop = properties.find((p) => p.id === trip.propertyId);

          return (
            <Card key={trip.id} className="flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      trip.status === "COMPLETED" ? "won" : "tripping"
                    }
                    className="text-[10px]"
                  >
                    {trip.status}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary tabular-nums">
                    <Calendar className="h-3.5 w-3.5" />
                    {trip.scheduledDate} • {trip.scheduledTime}
                  </span>
                </div>
                <CardTitle className="mt-2 text-base font-bold">
                  {prop?.projectName} ({prop?.unitCode})
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {trip.meetingPoint}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3">
                <div className="rounded-lg border bg-muted/30 p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      {lead?.firstName} {lead?.lastName}
                    </span>
                    <span className="text-muted-foreground">{lead?.phone}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {trip.notes}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleDownloadIcs(trip)}
                    >
                      <Download className="h-3 w-3" />
                      .ICS Calendar
                    </Button>
                    {lead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        asChild
                      >
                        <Link href={`/inbox?leadId=${lead.id}`}>
                          <MessageSquare className="h-3 w-3" />
                          Messenger
                        </Link>
                      </Button>
                    )}
                  </div>

                  {trip.status !== "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleMarkCompleted(trip.id)}
                    >
                      <CheckCircle2 className="h-3 w-3 text-pipeline-won" />
                      Mark Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

