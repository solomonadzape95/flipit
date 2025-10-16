"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface GameState {
  gems: number;
  gemsPerClick: number;
  gemsPerSecond: number;
  strongerClicksLevel: number;
  autoMinerLevel: number;
  isClickFrenzyActive: boolean;
}

export function useGameState() {
  const [gems, setGems] = useState(0);
  const [gemsPerClick, setGemsPerClick] = useState(1);
  const [gemsPerSecond, setGemsPerSecond] = useState(0);
  const [strongerClicksLevel, setStrongerClicksLevel] = useState(0);
  const [autoMinerLevel, setAutoMinerLevel] = useState(0);
  const [isClickFrenzyActive, setIsClickFrenzyActive] = useState(false);

  const incrementGems = useCallback((amount: number) => {
    setGems((g) => g + Math.max(0, Math.floor(amount)));
  }, []);

  // Auto miner loop
  useEffect(() => {
    if (gemsPerSecond <= 0) return;
    const id = setInterval(() => {
      incrementGems(gemsPerSecond);
    }, 1000);
    return () => clearInterval(id);
  }, [gemsPerSecond, incrementGems]);

  // Upgrade costs (simple exponential growth)
  const strongerClicksCost = useMemo(
    () => Math.floor(10 * Math.pow(1.5, strongerClicksLevel)),
    [strongerClicksLevel]
  );
  const autoMinerCost = useMemo(
    () => Math.floor(25 * Math.pow(1.6, autoMinerLevel)),
    [autoMinerLevel]
  );

  const buyStrongerClicks = useCallback(() => {
    if (gems < strongerClicksCost) return false;
    setGems((g) => g - strongerClicksCost);
    setStrongerClicksLevel((l) => l + 1);
    setGemsPerClick((v) => v + 1);
    return true;
  }, [gems, strongerClicksCost]);

  const buyAutoMiner = useCallback(() => {
    if (gems < autoMinerCost) return false;
    setGems((g) => g - autoMinerCost);
    setAutoMinerLevel((l) => l + 1);
    setGemsPerSecond((v) => v + 1);
    return true;
  }, [gems, autoMinerCost]);

  // Power-ups
  const frenzyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activateClickFrenzy = useCallback((durationSeconds: number, multiplier: number) => {
    if (frenzyTimeoutRef.current) clearTimeout(frenzyTimeoutRef.current);
    setIsClickFrenzyActive(true);
    setGemsPerClick((v) => Math.max(v, 1) * multiplier);
    frenzyTimeoutRef.current = setTimeout(() => {
      setIsClickFrenzyActive(false);
      // Reset to base derived from level (1 base + level)
      setGemsPerClick(1 + strongerClicksLevel);
    }, durationSeconds * 1000);
  }, [strongerClicksLevel]);

  const grantGems = useCallback((amount: number) => incrementGems(amount), [incrementGems]);

  return {
    state: {
      gems,
      gemsPerClick,
      gemsPerSecond,
      strongerClicksLevel,
      autoMinerLevel,
      isClickFrenzyActive,
    } as GameState,
    actions: {
      click: () => incrementGems(gemsPerClick),
      buyStrongerClicks,
      buyAutoMiner,
      activateClickFrenzy,
      grantGems,
    },
    costs: { strongerClicksCost, autoMinerCost },
  } as const;
}


