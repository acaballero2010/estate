"use client";

import * as React from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  friction?: number;
}

/**
 * usePullToRefresh Hook
 * Strategy 02: Pull to refresh — finger moves 100%, the list only 35% (friction = 0.35)
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 60,
  friction = 0.35,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const startYRef = React.useRef(0);
  const isPullingRef = React.useRef(false);

  const onTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (typeof window !== "undefined" && window.scrollY <= 2 && e.touches[0]) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, []);

  const onTouchMove = React.useCallback(
    (e: React.TouchEvent) => {
      if (!isPullingRef.current || isRefreshing || !e.touches[0]) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;
      if (diff > 0 && typeof window !== "undefined" && window.scrollY <= 2) {
        // Apply 35% resistance physics (finger moves 100%, list moves 35%)
        const distance = Math.min(diff * friction, 90);
        setPullDistance(distance);
      } else {
        setPullDistance(0);
      }
    },
    [friction, isRefreshing]
  );

  const onTouchEnd = React.useCallback(async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(45); // snap to spinner height
      try {
        await Promise.resolve(onRefresh());
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
