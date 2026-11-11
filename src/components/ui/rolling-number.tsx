"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RollingNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  compact?: boolean;
  className?: string;
}

/**
 * RollingNumber Component
 * Strategy 03: Rolling number — digits roll into place, 100 ms apart with deceleration
 */
export function RollingNumber({
  value,
  duration = 900,
  prefix = "₱",
  suffix = "",
  compact = false,
  className,
}: RollingNumberProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const prevValueRef = React.useRef(0);

  React.useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = value;
    const diff = endVal - startVal;
    if (diff === 0) {
      setDisplayValue(endVal);
      return;
    }

    const startTime = performance.now();

    let frameId: number;
    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Apple decelerate ease-out curve: 1 - Math.pow(1 - progress, 3)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + diff * ease;

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      } else {
        prevValueRef.current = endVal;
        setDisplayValue(endVal);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  const formatted = React.useMemo(() => {
    if (compact) {
      if (displayValue >= 1_000_000_000) {
        return `${(displayValue / 1_000_000_000).toFixed(1)}B`;
      }
      if (displayValue >= 1_000_000) {
        return `${(displayValue / 1_000_000).toFixed(1)}M`;
      }
      if (displayValue >= 1_000) {
        return `${(displayValue / 1_000).toFixed(1)}K`;
      }
      return Math.round(displayValue).toString();
    }
    return Math.round(displayValue).toLocaleString("en-PH");
  }, [displayValue, compact]);

  return (
    <span className={cn("tabular-nums font-mono tracking-tight inline-flex items-center", className)}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <span>{formatted}</span>
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  );
}

