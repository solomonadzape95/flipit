"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Score = { rank: number; username: string; finalTimeMs: number };

export default function LeaderboardPage() {
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        setScores(data.scores || []);
      } catch {}
    })();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <Link href="/" className="text-sm underline">Back to game</Link>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Rank</th>
              <th className="text-left p-3">Player</th>
              <th className="text-left p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s) => (
              <tr key={s.rank} className="border-t">
                <td className="p-3">{s.rank}</td>
                <td className="p-3">{s.username}</td>
                <td className="p-3">{formatMs(s.finalTimeMs)}</td>
              </tr>
            ))}
            {scores.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted-foreground">No scores yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function formatMs(ms: number) {
  const sec = Math.floor(ms / 1000);
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}


