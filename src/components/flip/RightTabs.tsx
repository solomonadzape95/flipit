"use client";

import { useState } from "react";
import PowerUpsPanel from "@/components/flip/PowerUpsPanel";
import LeaderboardPanel from "@/components/flip/LeaderboardPanel";

export default function RightTabs(props: {
  // Power-up props
  isConnected?: boolean;
  onConnect?: () => void;
  onPeek: () => void;
  onAutoMatch: () => void;
  isInGame?: boolean;
  inventory?: { peek: number; autoMatch: number };
  onUseInventory?: (t: "peek" | "autoMatch") => void;
  onAddToInventory?: (t: "peek" | "autoMatch") => void;
  playId?: string | null;
  userId?: string | null;
}) {
  const [tab, setTab] = useState<"store" | "leaderboard">("store");

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          className={`px-3 py-1.5 rounded-md border text-sm ${tab === "store" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}
          onClick={() => setTab("store")}
        >
          Store
        </button>
        <button
          className={`px-3 py-1.5 rounded-md border text-sm ${tab === "leaderboard" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}
          onClick={() => setTab("leaderboard")}
        >
          Leaderboard
        </button>
      </div>

      <div>
        {tab === "store" ? (
          <PowerUpsPanel
            isConnected={props.isConnected}
            onConnect={props.onConnect}
            onPeek={props.onPeek}
            onAutoMatch={props.onAutoMatch}
            isInGame={props.isInGame}
            inventory={props.inventory}
            onUseInventory={props.onUseInventory}
            onAddToInventory={props.onAddToInventory}
            playId={props.playId}
            userId={props.userId}
          />
        ) : (
          <LeaderboardPanel />
        )}
      </div>
    </div>
  );
}


