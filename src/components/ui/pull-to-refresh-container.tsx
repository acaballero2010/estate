"use client";

import * as React from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePullToRefresh } from "@/lib/hooks/use-pull-to-refresh";

interface PullToRefreshContainerProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  className?: string;
}

/**
 * PullToRefreshContainer Component
 * Strategy 02: Pull to refresh — finger moves 100%, list only 35% with spring indicator
 */
export function PullToRefreshContainer({
  children,
  onRefresh,
  className,
}: PullToRefreshContainerProps) {
  const {
    pullDistance,
    isRefreshing,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = usePullToRefresh({ onRefresh, threshold: 55, friction: 0.35 });

  const isTriggerReady = pullDistance >= 50;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn("relative min-h-full", className)}
    >
      {/* Elastic Pull Indicator */}
      <div
        className={cn(
          "pointer-events-none absolute left-0 right-0 top-0 flex items-center justify-center transition-opacity z-20",
          pullDistance > 5 ? "opacity-100" : "opacity-0"
        )}
        style={{
          height: `${pullDistance}px`,
          transform: `translateY(-${Math.max(0, 40 - pullDistance)}px)`,
        }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-md">
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <ArrowDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-150",
                isTriggerReady && "rotate-180 text-primary"
              )}
            />
          )}
        </div>
      </div>

      {/* Content translated by 35% rubber-band distance */}
      <div
        style={{
          transform: `translate3d(0, ${pullDistance}px, 0)`,
          transition: pullDistance === 0 ? "transform 250ms cubic-bezier(0.16, 1, 0.3, 1)" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

