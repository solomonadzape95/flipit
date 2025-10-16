"use client";

import { Button } from "@/components/ui/button";
import { STORE_ITEMS } from "@/lib/store";
import { useStorePurchases } from "@/hooks/useStorePurchases";
import { useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

export default function StorePanel(props: {
  isConnected?: boolean;
  onConnect?: () => void;
  onActivateClickFrenzy: (durationSeconds: number, multiplier: number) => void;
  onGrantGems: (amount: number) => void;
}) {
  const { buyItem, state } = useStorePurchases();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: state.txHash });

  if (isConfirmed && state.activePurchase) {
    const item = STORE_ITEMS[state.activePurchase as keyof typeof STORE_ITEMS];
    if (item) {
      if (item.id === "clickFrenzy") {
        props.onActivateClickFrenzy(item.durationSeconds, item.multiplier);
        toast.success("Click Frenzy activated!", { description: `10x for ${item.durationSeconds}s` });
      } else if (item.id === "gemShower") {
        props.onGrantGems(item.grantGems);
        toast.success("Gem Shower!", { description: `+${item.grantGems} Gems` });
      }
    }
    state.reset();
  }

  return (
    <div className="space-y-3">
      {!props.isConnected && (
        <div className="border rounded-lg p-6 text-center">
          <div className="text-sm text-muted-foreground mb-3">
            Sign in with Base to purchase power-ups
          </div>
          <Button onClick={props.onConnect}>
            <Wallet className="h-4 w-4 mr-2" /> Sign in with Base
          </Button>
        </div>
      )}
      {Object.values(STORE_ITEMS).map((item) => (
        <div key={item.id} className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-muted-foreground">{item.description}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm">${item.priceUsd.toFixed(2)}</div>
            <Button
              size="sm"
              disabled={!props.isConnected || state.isPending || isConfirming}
              onClick={() => buyItem(item.id as keyof typeof STORE_ITEMS)}
              title={
                !props.isConnected
                  ? "Sign in with Base"
                  : isConfirming
                    ? "Confirming previous purchase..."
                    : undefined
              }
            >
              {state.isPending && state.activePurchase === item.id
                ? "Buying..."
                : isConfirming && state.activePurchase === item.id
                  ? "Confirming..."
                  : "Buy Now (1-Click)"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}


