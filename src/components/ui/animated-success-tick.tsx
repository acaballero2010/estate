"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedSuccessTickProps {
  className?: string;
  size?: number;
}

/**
 * AnimatedSuccessTick Component
 * Strategy 06: Success tick — circle first (0-200ms), then the tick (200-470ms)
 * Total duration: 470ms
 */
export function AnimatedSuccessTick({
  className,
  size = 48,
}: AnimatedSuccessTickProps) {
  return (
    <div
      className={cn("inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Success"
    >
      <svg
        viewBox="0 0 52 52"
        className="w-full h-full text-emerald-500 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Phase 1 (0-200ms): Perimeter circle draws into place */}
        <circle
          cx="26"
          cy="26"
          r="23"
          stroke="currentColor"
          strokeWidth="3"
          className="animate-draw-circle"
          strokeDasharray="150"
          strokeDashoffset="150"
        />
        {/* Phase 2 (200-470ms): Inner checkmark draws through from vertex */}
        <path
          d="M15 27l8 8 15-16"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw-tick"
          strokeDasharray="40"
          strokeDashoffset="40"
        />
      </svg>
    </div>
  );
}

