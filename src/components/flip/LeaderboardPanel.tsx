"use client";

import { useQuery } from "@tanstack/react-query";

type Score = { rank: number; username: string; finalTimeMs: number };

export default function LeaderboardPanel() {
  const { data, isLoading, isError } = useQuery<{ scores: Score[] }>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to load leaderboard");
      return res.json();
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
  const scores = data?.scores ?? [];

  return (
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
          {isError && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-muted-foreground">Failed to load leaderboard</td>
            </tr>
          )}
          {!isError && isLoading && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-muted-foreground">Loading…</td>
            </tr>
          )}
          {!isError && !isLoading && scores.length === 0 && (
            <tr>
              <td colSpan={3} className="p-6">
                <div className="text-center">
                  <div className="text-sm font-medium">No scores yet</div>
                  <div className="text-xs text-muted-foreground mt-1">Be the first to complete a game and claim the top spot.</div>
                </div>
              </td>
            </tr>
          )}
          {!isError && !isLoading && scores.map((s, i) => (
            <tr key={`${s.username}-${i}`} className="border-t">
              <td className="p-3">{s.rank}</td>
              <td className="p-3">{s.username}</td>
              <td className="p-3">{formatMs(s.finalTimeMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatMs(ms: number) {
  const sec = Math.floor(ms / 1000);
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}


