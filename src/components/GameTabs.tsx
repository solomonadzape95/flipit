"use client";

import { useState } from "react";
import UpgradesPanel from "@/components/UpgradesPanel";
import StorePanel from "@/components/StorePanel";
import { Button } from "@/components/ui/button";

export default function GameTabs(props: {
  // Upgrades props
  gems: number;
  gemsPerSecond: number;
  strongerClicksLevel: number;
  autoMinerLevel: number;
  strongerClicksCost: number;
  autoMinerCost: number;
  onBuyStrongerClicks: () => void;
  onBuyAutoMiner: () => void;
  // Store props
  isConnected: boolean;
  onConnect?: () => void;
  onActivateClickFrenzy: (durationSeconds: number, multiplier: number) => void;
  onGrantGems: (amount: number) => void;
}) {
  const [tab, setTab] = useState<"upgrades" | "store" | "skins">("upgrades");

  return (
    <div className="mt-6">
      <div className="flex gap-2">
        <Button
          variant={tab === "upgrades" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("upgrades")}
        >
          Upgrades
        </Button>
        <Button
          variant={tab === "store" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("store")}
        >
          Power-Ups
        </Button>
        <Button variant="outline" size="sm" onClick={() => setTab("skins")} disabled>
          Skins
        </Button>
      </div>

      <div className="mt-4">
        {tab === "upgrades" && (
          <UpgradesPanel
            gems={props.gems}
            gemsPerSecond={props.gemsPerSecond}
            strongerClicksLevel={props.strongerClicksLevel}
            autoMinerLevel={props.autoMinerLevel}
            strongerClicksCost={props.strongerClicksCost}
            autoMinerCost={props.autoMinerCost}
            onBuyStrongerClicks={props.onBuyStrongerClicks}
            onBuyAutoMiner={props.onBuyAutoMiner}
          />
        )}

        {tab === "store" && (
          <StorePanel
            isConnected={props.isConnected}
            onConnect={props.onConnect}
            onActivateClickFrenzy={props.onActivateClickFrenzy}
            onGrantGems={props.onGrantGems}
          />
        )}

        {tab === "skins" && (
          <div className="border rounded-lg p-6 text-center text-muted-foreground">
            Skins coming soon
          </div>
        )}
      </div>
    </div>
  );
}


