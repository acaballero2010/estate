"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { CreateLeadInputSchema, type CreateLeadInput } from "@/lib/schemas";
import { useCrmStore } from "@/lib/store/crm-store";
import { formatCurrency } from "@/lib/utils";
import { SiteHeader } from "@/components/layout/site-header";
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

export default function PublicLeadCapturePage() {
  const router = useRouter();
  const { properties, addLead, sendMessage } = useCrmStore();
  const [selectedPropId, setSelectedPropId] = React.useState<string>(
    properties[0]?.id || ""
  );

  const selectedProp =
    properties.find((p) => p.id === selectedPropId) ?? properties[0];

  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(CreateLeadInputSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "+63 917 ",
      stage: "NEW_LEAD",
      source: "WEB_CAPTURE_FORM",
      priority: "HOT",
      budgetMin: 5000000,
      budgetMax: selectedProp?.listPrice ?? 18500000,
      preferredLocations: [
        selectedProp?.locationCity ?? "Bonifacio Global City, Taguig",
      ],
      preferredPropertyTypes: [selectedProp?.propertyType ?? "CONDOMINIUM"],
      financingPreference: "BANK",
      notes: "",
    },
  });

  const handleSelectProject = (propId: string) => {
    setSelectedPropId(propId);
    const prop = properties.find((p) => p.id === propId);
    if (!prop) return;
    form.setValue("budgetMax", prop.listPrice);
    form.setValue("preferredLocations", [prop.locationCity]);
    form.setValue("preferredPropertyTypes", [prop.propertyType]);
  };

  const onSubmitInquiry = (values: CreateLeadInput) => {
    const createdLead = addLead({
      ...values,
      source: "WEB_CAPTURE_FORM",
      priority: "HOT",
      notes: `Web Lead Capture Form Inquiry for ${selectedProp?.projectName} (${selectedProp?.unitCode}). ${values.notes || ""}`,
    });

    sendMessage(
      createdLead.id,
      `🌐 [Web Capture Lead]: ${createdLead.firstName} ${createdLead.lastName} requested an instant sample computation for ${selectedProp?.projectName} (${selectedProp?.unitCode}).`
    );

    toast.success(
      "Generating your personalized sample computation sheet..."
    );

    const token = createdLead.id.slice(0, 8);
    router.push(
      `/quote/${token}?leadId=${createdLead.id}&unit=${encodeURIComponent(
        selectedProp?.unitCode || ""
      )}`
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="container max-w-5xl py-8">
        <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Project Showcase (5 Cols) */}
        <div className="min-w-0 space-y-4 lg:col-span-5">
          <Badge variant="new" className="gap-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" /> Official Online Inquiry Portal
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Get Instant Sample Computation & Floor Plans
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Select your preferred property below to unlock real-time Bank, Pag-IBIG, or In-House monthly equity computations and reserve a showroom tour.
          </p>

          <div className="space-y-2.5 pt-2">
            <Label>Select Featured Development</Label>
            {properties.map((prop) => {
              const isSelected = prop.id === selectedProp?.id;
              return (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => handleSelectProject(prop.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">
                      {prop.projectName}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {prop.turnoverDate}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    {prop.unitCode} • {prop.locationCity}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {prop.floorAreaSqm} sqm • {prop.bedrooms} BR
                    </span>
                    <span className="font-bold text-primary tabular-nums">
                      {formatCurrency(prop.listPrice, "PHP", 0)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Lead Capture Form (7 Cols) */}
        <div className="min-w-0 lg:col-span-7">
          <Card className="border-2 border-primary/15 shadow-lg">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Buyer Inquiry & Instant Quotation Form
              </CardTitle>
              <CardDescription className="text-xs">
                Your inquiry is automatically routed to our licensed broker desk and generates a downloadable PDF quotation.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-2">
              <form
                onSubmit={form.handleSubmit(onSubmitInquiry)}
                className="space-y-3.5"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="inq-first">First Name</Label>
                    <Input
                      id="inq-first"
                      placeholder="e.g. Lorenzo"
                      {...form.register("firstName")}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-[11px] text-destructive">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inq-last">Last Name</Label>
                    <Input
                      id="inq-last"
                      placeholder="e.g. Zobel"
                      {...form.register("lastName")}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-[11px] text-destructive">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="inq-phone">
                      Mobile / Viber / WhatsApp
                    </Label>
                    <Input
                      id="inq-phone"
                      placeholder="+63 917 888 9900"
                      {...form.register("phone")}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-[11px] text-destructive">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inq-email">Email Address</Label>
                    <Input
                      id="inq-email"
                      type="email"
                      placeholder="buyer@email.com"
                      {...form.register("email")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="inq-fin">Preferred Financing Option</Label>
                    <select
                      id="inq-fin"
                      {...form.register("financingPreference")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                    >
                      <option value="BANK">Bank Housing Loan (15–20 yrs)</option>
                      <option value="PAG_IBIG">Pag-IBIG / HDMF (up to 30 yrs)</option>
                      <option value="IN_HOUSE">In-House Developer Financing</option>
                      <option value="SPOT_CASH">Spot Cash (With Maximum Discount)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="inq-budget">Target Max Budget (₱)</Label>
                    <Input
                      id="inq-budget"
                      type="number"
                      className="tabular-nums"
                      {...form.register("budgetMax", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="inq-notes">
                    Specific Questions or Preferred Viewing Schedule
                  </Label>
                  <Input
                    id="inq-notes"
                    placeholder="e.g. Interested in corner unit with parking slot; available Saturday afternoon"
                    {...form.register("notes")}
                  />
                </div>

                <Button type="submit" className="w-full h-10 text-xs font-semibold gap-2">
                  Unlock Instant Sample Computation
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-pipeline-won" />
                  <span>
                    100% Data Privacy Act Compliant • Handled by PRC Licensed Brokers
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
  );
}

