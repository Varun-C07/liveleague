"use client";
import { useEffect, useState } from "react";

export function Countdown({ utc }: { utc: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = new Date(utc).getTime() - now;
  if (diff <= 0) {
    return <span className="text-green font-bold">KICK OFF</span>;
  }
  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  const s = Math.floor((diff % 6e4) / 1e3);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span>
      <b className="text-green">{d}</b>d <b className="text-green">{pad(h)}</b>h{" "}
      <b className="text-green">{pad(m)}</b>m <b className="text-green">{pad(s)}</b>s
    </span>
  );
}
