"use client";
import { useState } from "react";
import { CalendarPlus, Share2, Check } from "lucide-react";
import type { ApiMatch } from "@liveleague/core/api-shape";
import { downloadICS } from "@/lib/ics";

export function ShareMenu({ match }: { match: ApiMatch }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const title =
      match.home.real && match.away.real
        ? `${match.home.name} vs ${match.away.name}`
        : `${match.home.code} vs ${match.away.code}`;
    const url = `${location.origin}${location.pathname}#match-${match.n}`;
    const text = `${title} — ${match.stage}, World Cup 2026`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); downloadICS(match); }}
        className="p-1 rounded text-dim hover:text-green hover:bg-panel2 transition"
        aria-label="Add to calendar"
        title="Add to calendar"
      >
        <CalendarPlus size={15} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); share(); }}
        className="p-1 rounded text-dim hover:text-green hover:bg-panel2 transition"
        aria-label="Share match"
        title="Share"
      >
        {copied ? <Check size={15} className="text-green" /> : <Share2 size={15} />}
      </button>
    </div>
  );
}
