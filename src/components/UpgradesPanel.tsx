"use client";

import { Button } from "@/components/ui/button";
import { Zap, Bot } from "lucide-react";

export default function UpgradesPanel(props: {
  gems: number;
  gemsPerSecond: number;
  strongerClicksLevel: number;
  autoMinerLevel: number;
  strongerClicksCost: number;
  autoMinerCost: number;
  onBuyStrongerClicks: () => void;
  onBuyAutoMiner: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="border rounded-lg p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 font-medium">
            <Zap className="h-4 w-4" />
            <span>Stronger Clicks (Level {props.strongerClicksLevel})</span>
          </div>
          <div className="text-sm text-muted-foreground">+1 gem per click</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm">{props.strongerClicksCost} Gems</div>
          <Button size="sm" disabled={props.gems < props.strongerClicksCost} onClick={props.onBuyStrongerClicks}>
            Buy
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 font-medium">
            <Bot className="h-4 w-4" />
            <span>Auto-Miner Bot (Level {props.autoMinerLevel})</span>
          </div>
          <div className="text-sm text-muted-foreground">+1 gem/sec (Current: {props.gemsPerSecond}/sec)</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm">{props.autoMinerCost} Gems</div>
          <Button size="sm" disabled={props.gems < props.autoMinerCost} onClick={props.onBuyAutoMiner}>
            Buy
          </Button>
        </div>
      </div>
    </div>
  );
}


