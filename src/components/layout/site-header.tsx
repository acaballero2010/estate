"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  Building2,
  Calculator,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Film,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/firebase/auth-context";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, agentProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState<boolean>(false);

  const isHome = pathname === "/";
  const isShowcase = pathname === "/showcase" || pathname?.startsWith("/showcase");
  const isQuotations = pathname === "/quotations" || pathname?.startsWith("/quotations");

  const navLinks = [
    {
      title: "Pillars & Solutions",
      href: isHome ? "#features" : "/#features",
      active: false,
    },
    {
      title: "Client Showroom (Demo)",
      href: "/showcase?demo=true",
      active: isShowcase,
    },
    {
      title: "Amortization Studio",
      href: "/quotations",
      active: isQuotations,
    },
    {
      title: "Interactive Pricing",
      href: isHome ? "#calculator" : "/#calculator",
      active: false,
    },
    {
      title: "Developer Network",
      href: isHome ? "#developers" : "/#developers",
      active: false,
    },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 transition-all shadow-xs",
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-serif font-normal tracking-tight leading-none text-foreground">
              PropFlow
            </span>
            <span className="text-[9px] font-sans font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">
              Estates &amp; Advisory
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          {navLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className={cn(
                "transition-colors hover:text-foreground",
                link.active && "text-foreground font-semibold"
              )}
            >
              {link.title}
            </Link>
          ))}
        </nav>

        {/* Action CTAs + Mobile Hamburger */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle Theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden xl:inline text-xs font-semibold text-muted-foreground max-w-[120px] truncate">
                {agentProfile?.fullName || user.displayName || user.email}
              </span>
              <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm px-2.5 sm:px-3" asChild>
                <Link href="/dashboard">
                  <span className="hidden sm:inline">Command Center</span>
                  <span className="sm:hidden">CRM</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex h-8 text-xs px-3"
                asChild
              >
                <Link href="/login">Agent Sign In</Link>
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm px-3" asChild>
                <Link href="/login">
                  <span>Register Free</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}

          {/* Mobile Sheet Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 md:hidden text-foreground hover:bg-muted ml-0.5"
                aria-label="Open Navigation Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[360px] p-0 flex flex-col justify-between"
            >
              <div className="p-6">
                <SheetHeader className="text-left border-b border-border/60 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <SheetTitle className="text-lg font-serif font-normal tracking-tight">
                        PropFlow
                      </SheetTitle>
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Estates &amp; Advisory
                      </span>
                    </div>
                  </div>
                </SheetHeader>

                {/* Navigation Links */}
                <div className="py-6 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 block mb-2">
                    Navigation &amp; Demos
                  </span>
                  <Link
                    href={isHome ? "#features" : "/#features"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <span>Pillars &amp; Solutions</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/showcase?demo=true"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors",
                      isShowcase && "bg-muted font-semibold text-primary"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Film className="h-4 w-4 text-primary" />
                      <span>Client Showroom (Demo)</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/quotations"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors",
                      isQuotations && "bg-muted font-semibold text-primary"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span>Amortization Studio</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href={isHome ? "#calculator" : "/#calculator"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <span>Interactive Pricing Studio</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href={isHome ? "#developers" : "/#developers"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <span>Developer Network</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/deals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      <span>Deals &amp; Maceda Protection</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/inquire"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <span>Public Inquiry Form</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>

              {/* Mobile Drawer Footer CTAs */}
              <div className="border-t border-border/60 p-5 bg-muted/20 space-y-2.5">
                {user ? (
                  <Button
                    className="w-full text-xs gap-2"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/dashboard">
                      <span>Launch Command Center</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full text-xs gap-2 shadow-sm"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/login">
                        <span>Register Free Account</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-xs"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/login">Agent Sign In</Link>
                    </Button>
                  </>
                )}
                <p className="text-[10px] text-center text-muted-foreground pt-1">
                  Compliant with PRC RESA &amp; Maceda Law
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

