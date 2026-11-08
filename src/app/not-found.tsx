import Link from "next/link";
import { Building2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
        <Building2 className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-serif font-normal tracking-tight text-foreground sm:text-3xl">
        Page or Property Unit Not Found
      </h1>
      <p className="mt-1.5 max-w-md text-xs text-muted-foreground sm:text-sm">
        The requested CRM route or property quotation link could not be found. Return to the Command Center to browse active leads and units.
      </p>
      <Button size="sm" className="mt-5 gap-1.5 text-xs" asChild>
        <Link href="/">
          <Home className="h-3.5 w-3.5" />
          Back to Command Center
        </Link>
      </Button>
    </div>
  );
}

