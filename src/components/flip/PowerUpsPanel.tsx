"use client";

import { Button } from "@/components/ui/button";
import { useStorePurchases } from "@/hooks/useStorePurchases";
import { useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";

import { useEffect } from "react";

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
  onSyncInventory?: () => void;
}) {
  const { buyItem, state } = useStorePurchases();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: state.txHash });
  useEffect(() => {
    if (!isSuccess || !state.activePurchase) return;

    const activePurchase = state.activePurchase;
    if (props.isInGame) {
      if (activePurchase === "peek") {
        props.onPeek();
        toast.success("Peek activated", { description: "All cards revealed for 2s (+5s)" });
      } else if (activePurchase === "autoMatch") {
        props.onAutoMatch();
        toast.success("Auto-Match used", { description: "One pair matched instantly (+5s)" });
      }
      if (props.playId) {
        fetch("/api/game/buy-powerup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playId: props.playId, powerupType: activePurchase, source: "store" }),
        }).catch(() => {});
      }
    } else if (props.onAddToInventory) {
      props.onAddToInventory(activePurchase as any);
      if (props.userId) {
        const body =
          activePurchase === "peek"
            ? { userId: props.userId, peekDelta: 1 }
            : { userId: props.userId, autoMatchDelta: 1 };
        const bodyJson = JSON.stringify(body);
        let tries = 0;
        const postInv = () =>
          fetch("/api/users/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: bodyJson,
          }).catch(() => {
            if (++tries < 3) setTimeout(postInv, 400 * tries);
          });
        postInv();
      }
      toast.success("Added to collection", { description: `${activePurchase} saved` });
    }

    props.onSyncInventory?.();
    state.reset();
  }, [
    isSuccess,
    state.activePurchase,
    state.reset,
    props.isInGame,
    props.onPeek,
    props.onAutoMatch,
    props.playId,
    props.onAddToInventory,
    props.userId,
    props.onSyncInventory,
  ]);

  return (
    <div className="space-y-3">
      {!props.isConnected && (
        <div className="border rounded-lg p-4 text-center">
          <div className="text-sm text-muted-foreground mb-2">Sign in with Celo to buy power-ups</div>
          <Button size="sm" onClick={props.onConnect}>Sign in</Button>
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


