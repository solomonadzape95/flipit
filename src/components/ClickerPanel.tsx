"use client";

import { Coins } from "lucide-react";

export default function ClickerPanel(props: {
  gems: number;
  gemsPerClick: number;
  onClick: () => void;
}) {
  return (
    <div className="border border-[#133044] rounded-lg p-8 bg-[#010a12] flex flex-col items-center gap-8 min-w-[340px] min-h-[400px] mx-auto" style={{ boxShadow: "0 0 0 1px #133044" }}>
      <div className="text-4xl md:text-5xl font-mono font-extrabold tracking-tight text-white mb-2 mt-2 text-center">
        Click to Earn!
      </div>
      <button
        className="w-56 h-56 bg-gradient-to-b from-pink-300 to-[#ff2168] shadow-lg hover:scale-105 duration-150 flex items-center justify-center rounded-md border-0 focus:outline-none active:scale-95"
        style={{ boxShadow: "0 8px 0 0 #991b36" }}
        onClick={props.onClick}
        aria-label="Click to earn gems"
      >
        <Coins className="w-[108px] h-[108px] text-white" />
      </button>
      <div className="mt-2 text-center text-slate-400 font-mono text-[15px] tracking-wide">
        +{props.gemsPerClick} gem per click
      </div>
    </div>
  );
}

