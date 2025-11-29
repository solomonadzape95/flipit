"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Card = {
  id: number; // unique per position 0..15
  value: number; // 0..7 pair id
  isRevealed: boolean;
  isMatched: boolean;
};

export type PowerupType = "peek" | "autoMatch";

export interface FlipMatchState {
  board: Card[];
  isRunning: boolean;
  isComplete: boolean;
  elapsedMs: number; // without penalties
  penaltiesMs: number; // accumulated
  firstFlipHappened: boolean;
  flipsThisTurn: number; // 0,1 when player has flipped one card
  pairsMatched: number; // 0..8
  inventory: { peek: number; autoMatch: number };
  hasEntryPaid: boolean;
}

export interface FlipMatchActions {
  reset: () => void;
  flipCard: (index: number) => void;
  usePeek: () => void; // adds 3s penalty mid-game
  useAutoMatch: () => void; // adds 10s penalty mid-game
  addToInventory: (type: PowerupType, count?: number) => void;
  useFromInventory: (type: PowerupType) => void;
  markEntryPaid: () => void;
  setInventoryCounts: (peek: number, autoMatch: number) => void;
}

function generateShuffledBoard(seed?: number): Card[] {
  const values = Array.from({ length: 16 }, (_, i) => Math.floor(i / 2)); // 0..7 each twice
  // simple shuffle
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values.map((v, i) => ({ id: i, value: v, isRevealed: false, isMatched: false }));
}

export function useFlipMatch() {
  const [board, setBoard] = useState<Card[]>(() => generateShuffledBoard());
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [penaltiesMs, setPenaltiesMs] = useState(0);
  const [firstFlipHappened, setFirstFlipHappened] = useState(false);
  const [flipsThisTurn, setFlipsThisTurn] = useState(0);
  const [pairsMatched, setPairsMatched] = useState(0);
  const [inventory, setInventory] = useState<{ peek: number; autoMatch: number }>({ peek: 0, autoMatch: 0 });
  const [hasEntryPaid, setHasEntryPaid] = useState(false);

  const startTimestampRef = useRef<number | null>(null);
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockRef = useRef<boolean>(false); // prevent actions during mismatch delay

  const reset = useCallback(() => {
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    setBoard(generateShuffledBoard());
    setIsRunning(false);
    setIsComplete(false);
    setElapsedMs(0);
    setPenaltiesMs(0);
    setFirstFlipHappened(false);
    setFlipsThisTurn(0);
    setPairsMatched(0);
    setInventory({ peek: 0, autoMatch: 0 });
    setHasEntryPaid(false);
    startTimestampRef.current = null;
    lockRef.current = false;
  }, []);

  // timer loop
  useEffect(() => {
    if (!isRunning || isComplete) return;
    timerIdRef.current = setInterval(() => {
      if (startTimestampRef.current !== null) {
        setElapsedMs(Date.now() - startTimestampRef.current);
      }
    }, 50);
    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    };
  }, [isRunning, isComplete]);

  const currentRevealedUnmatched = useMemo(
    () => board.filter((c) => c.isRevealed && !c.isMatched),
    [board]
  );

  const finishIfDone = useCallback((nextBoard: Card[]) => {
    const matched = nextBoard.filter((c) => c.isMatched).length / 2;
    if (matched === 8) {
      setIsComplete(true);
      setIsRunning(false);
    }
    setPairsMatched(matched);
  }, []);

  const flipCard = useCallback(
    (index: number) => {
      if (lockRef.current) return;
      if (isComplete) return;
      setBoard((prev) => {
        const card = prev[index];
        if (!card || card.isMatched || card.isRevealed) return prev;

        const next = prev.map((c, i) => (i === index ? { ...c, isRevealed: true } : c));

        // start timer on very first flip
        if (!firstFlipHappened) {
          setFirstFlipHappened(true);
          setIsRunning(true);
          startTimestampRef.current = Date.now();
          // Notify server about actual start time if a play exists (caller can pass in)
        }

        const revealed = next.filter((c) => c.isRevealed && !c.isMatched);
        if (revealed.length === 2) {
          setFlipsThisTurn(0);
          const [a, b] = revealed;
          if (a.value === b.value) {
            // match
            const matchedBoard = next.map((c) =>
              c.isRevealed && !c.isMatched ? { ...c, isMatched: true } : c
            );
            // Keep matched revealed
            finishIfDone(matchedBoard);
            return matchedBoard;
          } else {
            // mismatch -> hide after delay
            lockRef.current = true;
            setTimeout(() => {
              setBoard((cur) =>
                cur.map((c) => (c.isRevealed && !c.isMatched ? { ...c, isRevealed: false } : c))
              );
              lockRef.current = false;
            }, 1000);
            return next;
          }
        } else {
          setFlipsThisTurn(1);
          return next;
        }
      });
    },
    [firstFlipHappened, isComplete, finishIfDone]
  );

  const usePeek = useCallback(() => {
    if (isComplete) return;
    // reveal all briefly and add penalty if mid-game
    setBoard((prev) => prev.map((c) => ({ ...c, isRevealed: true })));
    if (firstFlipHappened) setPenaltiesMs((p) => p + 5000);
    lockRef.current = true;
    setTimeout(() => {
      setBoard((cur) => cur.map((c) => (c.isMatched ? c : { ...c, isRevealed: false })));
      lockRef.current = false;
    }, 2000);
  }, [firstFlipHappened, isComplete, finishIfDone]);

  const useAutoMatch = useCallback(() => {
    if (isComplete) return;
    // find a random unmatched value and mark both as matched
    setBoard((prev) => {
      const unmatched = prev.filter((c) => !c.isMatched);
      if (unmatched.length < 2) return prev;
      const values = Array.from(new Set(unmatched.map((c) => c.value)));
      const pick = values[Math.floor(Math.random() * values.length)];
      let pickedCount = 0;
      const next = prev.map((c) => {
        if (!c.isMatched && c.value === pick && pickedCount < 2) {
          pickedCount += 1;
          return { ...c, isMatched: true, isRevealed: true };
        }
        return c;
      });
      finishIfDone(next);
      return next;
    });
    if (firstFlipHappened) setPenaltiesMs((p) => p + 5000);
  }, [firstFlipHappened, isComplete]);

  const addToInventory = useCallback((type: PowerupType, count: number = 1) => {
    setInventory((inv) => ({ ...inv, [type]: Math.max(0, (inv as any)[type] + count) }));
  }, []);

  const useFromInventory = useCallback((type: PowerupType) => {
    setInventory((inv) => {
      const current = (inv as any)[type] as number;
      if (current <= 0) return inv;
      const next = { ...inv, [type]: current - 1 } as typeof inv;
      // trigger effect
      if (type === "peek") {
        usePeek();
      } else {
        useAutoMatch();
      }
      return next;
    });
  }, [usePeek, useAutoMatch]);

  const setInventoryCounts = useCallback((peek: number, autoMatch: number) => {
    setInventory({ peek: Math.max(0, Math.floor(peek)), autoMatch: Math.max(0, Math.floor(autoMatch)) });
  }, []);

  const finalTimeMs = elapsedMs + penaltiesMs;

  return {
    state: {
      board,
      isRunning,
      isComplete,
      elapsedMs,
      penaltiesMs,
      firstFlipHappened,
      flipsThisTurn,
      pairsMatched,
      inventory,
      hasEntryPaid,
    } as FlipMatchState,
    actions: {
      reset,
      flipCard,
      usePeek,
      useAutoMatch,
      addToInventory,
      useFromInventory,
      markEntryPaid: () => setHasEntryPaid(true),
      setInventoryCounts,
    } as FlipMatchActions,
    derived: {
      finalTimeMs,
    },
  } as const;
}


