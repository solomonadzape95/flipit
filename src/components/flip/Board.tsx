"use client";

import { motion } from "motion/react";
import { type Card } from "@/hooks/useFlipMatch";

export default function Board(props: {
  cards: Card[];
  onFlip: (index: number) => void;
  disabled?: boolean;
  loadingOverlayText?: string | null;
}) {
  return (
    <div className="relative">
      <div className={`grid grid-cols-4 gap-3 sm:gap-4 mx-auto w-full ${props.disabled ? "pointer-events-none opacity-60" : ""}`} style={{ maxWidth: 840 }}>
        {props.cards.map((card, idx) => (
          <CardView key={card.id} card={card} onClick={() => props.onFlip(idx)} />
        ))}
      </div>
      {(props.disabled || props.loadingOverlayText) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {props.loadingOverlayText ? (
            <div className="px-4 py-2 rounded-md bg-black/50 text-white text-sm">{props.loadingOverlayText}</div>
          ) : (
            <div className="absolute inset-0 pointer-events-none" />
          )}
        </div>
      )}
    </div>
  );
}

function CardView({ card, onClick }: { card: Card; onClick: () => void }) {
  const isFaceUp = card.isRevealed || card.isMatched;
  return (
    <button
      className="relative rounded-md border border-sky-900 bg-slate-900/70 focus:outline-none shadow-sm w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28"
      onClick={onClick}
      disabled={card.isMatched || isFaceUp}
      aria-label={card.isMatched ? "Matched" : isFaceUp ? "Revealed" : "Hidden card"}
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ opacity: isFaceUp ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-2xl sm:text-3xl font-extrabold text-white/90">?</span>
      </motion.div>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ opacity: isFaceUp ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-3xl sm:text-4xl md:text-5xl">{symbolFor(card.value)}</span>
      </motion.div>
    </button>
  );
}

function symbolFor(v: number) {
  const symbols = ["🍀", "💎", "🚀", "⭐", "🔥", "😍", "⚽", "🎯"];
  return symbols[v % symbols.length];
}


