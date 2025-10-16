"use client";

import { Button } from "@/components/ui/button";
import { useStorePurchases } from "@/hooks/useStorePurchases";
import { useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";

export default function PowerUpsPanel(props: {
  isConnected?: boolean;
  onConnect?: () => void;
  onPeek: () => void; // immediate use mid-game
  onAutoMatch: () => void; // immediate use mid-game
  isInGame?: boolean; // if true, buys are used instantly; else added to inventory
  inventory?: { peek: number; autoMatch: number };
  onUseInventory?: (type: "peek" | "autoMatch") => void;
  onAddToInventory?: (type: "peek" | "autoMatch") => void;
  playId?: string | null;
  userId?: string | null;
}) {
  const { buyItem, state } = useStorePurchases();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: state.txHash });

  if (isSuccess && state.activePurchase) {
    if (props.isInGame) {
      if (state.activePurchase === "peek") {
        props.onPeek();
        toast.success("Peek activated", { description: "All cards revealed for 2s (+5s)" });
      } else if (state.activePurchase === "autoMatch") {
        props.onAutoMatch();
        toast.success("Auto-Match used", { description: "One pair matched instantly (+5s)" });
      }
      if (props.playId) {
        fetch("/api/game/buy-powerup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playId: props.playId, powerupType: state.activePurchase, source: "store" }),
        }).catch(() => {});
      }
    } else if (props.onAddToInventory) {
      props.onAddToInventory(state.activePurchase as any);
      // Persist to user inventory when not in-game
      if (props.userId) {
        const body =
          state.activePurchase === "peek"
            ? { userId: props.userId, peekDelta: 1 }
            : { userId: props.userId, autoMatchDelta: 1 };
        fetch("/api/users/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).catch(() => {});
      }
      toast.success("Added to collection", { description: `${state.activePurchase} saved` });
    }
    state.reset();
  }

  return (
    <div className="space-y-3">
      {!props.isConnected && (
        <div className="border rounded-lg p-4 text-center">
          <div className="text-sm text-muted-foreground mb-2">Sign in with Base to buy power-ups</div>
          <Button size="sm" onClick={props.onConnect}>Connect</Button>
        </div>
      )}
      <div className="border rounded-lg p-4 flex items-center justify-between">
        <div>
          <div className="font-medium">Peek 👀</div>
          <div className="text-sm text-muted-foreground">Reveal all cards for 2s (+5s penalty)</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm">$0.50</div>
          <Button size="sm" disabled={!props.isConnected || state.isPending || isConfirming} onClick={() => buyItem("peek" as any)}>
            {state.isPending && state.activePurchase === "peek" ? "Buying..." : isConfirming && state.activePurchase === "peek" ? "Confirming..." : "Buy"}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-4 flex items-center justify-between">
        <div>
          <div className="font-medium">Auto-Match ⚡</div>
          <div className="text-sm text-muted-foreground">Instants match one pair (+5s penalty)</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm">$0.50</div>
          <Button size="sm" disabled={!props.isConnected || state.isPending || isConfirming} onClick={() => buyItem("autoMatch" as any)}>
            {state.isPending && state.activePurchase === "autoMatch" ? "Buying..." : isConfirming && state.activePurchase === "autoMatch" ? "Confirming..." : "Buy"}
          </Button>
        </div>
      </div>

      {props.inventory && props.onUseInventory && (
        <div className="border rounded-lg p-4">
          <div className="text-sm font-medium mb-2">Your Collection</div>
          <div className="flex items-center justify-between py-1">
            <div className="text-sm">👀 Peek x{props.inventory.peek}</div>
            <Button
              size="sm"
              variant="outline"
              disabled={props.inventory.peek <= 0}
              onClick={() => {
                props.onUseInventory!("peek");
                // Log inventory use and decrement DB immediately
                if (props.playId) {
                  fetch("/api/game/buy-powerup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ playId: props.playId, powerupType: "peek", source: "inventory" }),
                  }).catch(() => {});
                }
                if (props.userId) {
                  fetch("/api/users/inventory", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: props.userId, peekDelta: -1 }),
                  }).catch(() => {});
                }
              }}
            >
              Use
            </Button>
          </div>
          <div className="flex items-center justify-between py-1">
            <div className="text-sm">⚡ Auto-Match x{props.inventory.autoMatch}</div>
            <Button
              size="sm"
              variant="outline"
              disabled={props.inventory.autoMatch <= 0}
              onClick={() => {
                props.onUseInventory!("autoMatch");
                if (props.playId) {
                  fetch("/api/game/buy-powerup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ playId: props.playId, powerupType: "autoMatch", source: "inventory" }),
                  }).catch(() => {});
                }
                if (props.userId) {
                  fetch("/api/users/inventory", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: props.userId, autoMatchDelta: -1 }),
                  }).catch(() => {});
                }
              }}
            >
              Use
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


