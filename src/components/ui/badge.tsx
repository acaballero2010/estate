import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        new: "border-transparent bg-pipeline-new/15 text-pipeline-new",
        contacted: "border-transparent bg-pipeline-contacted/15 text-pipeline-contacted",
        tripping: "border-transparent bg-pipeline-tripping/15 text-pipeline-tripping",
        proposal: "border-transparent bg-pipeline-proposal/15 text-pipeline-proposal",
        reservation: "border-transparent bg-pipeline-reservation/15 text-pipeline-reservation",
        won: "border-transparent bg-pipeline-won/15 text-pipeline-won",
        lost: "border-transparent bg-pipeline-lost/15 text-pipeline-lost",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

