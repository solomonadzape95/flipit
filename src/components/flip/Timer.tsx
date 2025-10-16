"use client";

export default function Timer(props: {
  elapsedMs: number;
  penaltiesMs: number;
  isRunning: boolean;
}) {
  const total = props.elapsedMs + props.penaltiesMs;
  return (
    <div className="text-center mb-4">
      <div className="text-sm text-muted-foreground">Time</div>
      <div className="text-4xl font-mono font-extrabold tracking-tight">
        {formatMs(total)}
      </div>
      {props.penaltiesMs > 0 && (
        <div className="text-xs text-muted-foreground mt-1">+{formatMs(props.penaltiesMs)} penalties</div>
      )}
    </div>
  );
}

function formatMs(ms: number) {
  const sec = Math.floor(ms / 1000);
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}


