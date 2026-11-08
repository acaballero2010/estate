"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Building2,
  Calculator,
  CalendarCheck,
  Film,
  Globe,
  Kanban,
  MessageSquareText,
  FileCheck2,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
  Plus,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCrmStore } from "@/lib/store/crm-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, agentProfile, signOut } = useAuth();
  const { leads, properties, deals } = useCrmStore();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [globalQuery, setGlobalQuery] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);

  const navItems = React.useMemo<NavItem[]>(
    () => [
      {
        title: "Command Center",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Pipeline",
        href: "/pipeline",
        icon: Kanban,
        badge: leads.length,
      },
      {
        title: "Messenger Hub",
        href: "/inbox",
        icon: MessageSquareText,
        badge: leads.filter((l) => Boolean(l.messengerPsid)).length,
      },
      {
        title: "Quotations",
        href: "/quotations",
        icon: Calculator,
      },
      {
        title: "Site Trippings",
        href: "/trippings",
        icon: CalendarCheck,
        badge: leads.filter((l) => l.stage === "SITE_TRIPPING").length || 2,
      },
      {
        title: "Deals & Closing",
        href: "/deals",
        icon: FileCheck2,
        badge: deals.length,
      },
      {
        title: "Properties",
        href: "/properties",
        icon: Building2,
        badge: properties.length,
      },
      {
        title: "Storefront",
        href: "/showcase",
        icon: Film,
      },
      {
        title: "Lead Form",
        href: "/inquire",
        icon: Globe,
      },
    ],
    [leads, deals, properties]
  );

  const searchResults = React.useMemo(() => {
    const q = globalQuery.toLowerCase().trim();
    if (!q) return null;

    const matchedLeads = leads
      .filter(
        (l) =>
          `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.preferredLocations.some((loc) => loc.toLowerCase().includes(q))
      )
      .slice(0, 3);

    const matchedProps = properties
      .filter(
        (p) =>
          p.projectName.toLowerCase().includes(q) ||
          p.unitCode.toLowerCase().includes(q) ||
          p.locationCity.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedDeals = deals
      .filter((d) => d.dealNumber.toLowerCase().includes(q))
      .slice(0, 2);

    return { matchedLeads, matchedProps, matchedDeals };
  }, [globalQuery, leads, properties, deals]);

  const initials = React.useMemo(() => {
    const name = agentProfile?.fullName || "Marco Reyes";
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }, [agentProfile]);

  const handleSignOut = async () => {
    await signOut();
    toast.info("Signed out of PropFlow Agent Portal");
  };

  const isPublicStandalone =
    pathname === "/" || pathname?.startsWith("/quote/");

  if (isPublicStandalone) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background md:flex-row">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          "hidden border-r bg-sidebar text-sidebar-foreground transition-all duration-200 md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30",
          isCollapsed ? "md:w-16" : "md:w-60"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-semibold tracking-tight"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-serif font-normal tracking-tight leading-none">
                  PropFlow
                </span>
                <span className="text-[9px] font-sans font-medium uppercase tracking-widest text-muted-foreground mt-0.5">
                  Estates &amp; Advisory
                </span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {!isCollapsed && <span>{item.title}</span>}
                </div>
                {!isCollapsed && item.badge !== undefined && (
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className="h-4 px-1.5 text-[10px] tabular-nums"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Agent Footer Profile */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs font-semibold">
                    {agentProfile?.fullName}
                  </span>
                  {user && (
                    <UserCheck className="h-3 w-3 shrink-0 text-pipeline-won" />
                  )}
                </div>
                <span className="truncate text-[11px] text-muted-foreground">
                  {agentProfile?.prcLicenseNumber}
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div>
              {user ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-full text-[11px] gap-1.5"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3 w-3" />
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 w-full text-[11px] gap-1.5"
                  asChild
                >
                  <Link href="/login">
                    <LogIn className="h-3 w-3" />
                    Agent Login / Register
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex h-screen min-w-0 flex-1 flex-col overflow-hidden transition-all duration-200",
          isCollapsed ? "md:pl-16" : "md:pl-60"
        )}
      >
        {/* Top Header (above the scrollable main body) */}
        <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2.5">
            {/* Mobile Hamburger Drawer */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:hidden"
                >
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex h-14 items-center gap-2.5 border-b px-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
                </div>
                <nav className="space-y-1 p-3">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-accent"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                        {item.badge !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Quick Global Search */}
            <div className="relative w-full max-w-[220px] sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search leads, units, deals..."
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                className="h-8 pl-8 text-xs bg-muted/40"
              />
              {searchFocused && searchResults && (
                <div className="absolute left-0 top-10 z-50 w-72 sm:w-80 rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg space-y-2">
                  {searchResults.matchedLeads.length > 0 && (
                    <div>
                      <p className="px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                        Buyer Leads
                      </p>
                      {searchResults.matchedLeads.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onMouseDown={() => {
                            setGlobalQuery("");
                            router.push(`/inbox?leadId=${l.id}`);
                          }}
                          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent"
                        >
                          <span className="font-semibold">
                            {l.firstName} {l.lastName}
                          </span>
                          <Badge variant="outline" className="text-[9px]">
                            {l.stage.replace("_", " ")}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.matchedProps.length > 0 && (
                    <div>
                      <p className="px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                        Property Units
                      </p>
                      {searchResults.matchedProps.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={() => {
                            setGlobalQuery("");
                            router.push(`/quotations?propertyId=${p.id}`);
                          }}
                          className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent"
                        >
                          <span className="font-semibold">{p.projectName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {p.unitCode} • {p.locationCity}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.matchedDeals.length > 0 && (
                    <div>
                      <p className="px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                        Deal Rooms
                      </p>
                      {searchResults.matchedDeals.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onMouseDown={() => {
                            setGlobalQuery("");
                            router.push("/deals");
                          }}
                          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent"
                        >
                          <span className="font-semibold">{d.dealNumber}</span>
                          <Badge variant="won" className="text-[9px]">
                            {d.stage}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.matchedLeads.length === 0 &&
                    searchResults.matchedProps.length === 0 &&
                    searchResults.matchedDeals.length === 0 && (
                      <p className="p-2 text-center text-xs text-muted-foreground">
                        No matching leads, units, or deals.
                      </p>
                    )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!user ? (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                <Link href="/login">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Agent Sign In</span>
                </Link>
              </Button>
            ) : (
              <Badge variant="won" className="hidden sm:inline-flex text-[10px] gap-1">
                <UserCheck className="h-3 w-3" />
                {agentProfile?.fullName}
              </Badge>
            )}

            <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
              <Link href="/pipeline">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Capture Lead</span>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pipeline-new" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="text-xs">
                  Recent Sales Activity & Alerts
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="text-xs cursor-pointer">
                  <Link href="/inbox">
                    <div>
                      <p className="font-semibold">Camille Soriano replied</p>
                      <p className="text-[11px] text-muted-foreground">
                        Requested 15-year bank computation for Nuvali RFO
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-xs cursor-pointer">
                  <Link href="/trippings">
                    <div>
                      <p className="font-semibold">Upcoming Site Viewing</p>
                      <p className="text-[11px] text-muted-foreground">
                        Rafael Villanueva • BGC Showroom (Sat 2:00 PM)
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-xs cursor-pointer">
                  <Link href="/deals">
                    <div>
                      <p className="font-semibold">Reservation Fee Verified</p>
                      <p className="text-[11px] text-muted-foreground">
                        Dr. Elena Gomez-Tan • ₱100,000 BPI Transfer
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Page Body (scrollbar only covers the body below header) */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t bg-background/95 px-2 backdrop-blur md:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate max-w-[68px]">{item.title}</span>
              {item.badge !== undefined && (
                <span className="absolute right-1.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

