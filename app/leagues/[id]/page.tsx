"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useLeague, useLeaveOrDeleteLeague } from "@/hooks/useLeagues";

export default function LeagueDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { hasPersonal } = useEntitlements();
  const { data, isLoading, error } = useLeague(id);
  const leave = useLeaveOrDeleteLeague();
  const [copied, setCopied] = useState(false);

  if (isLoading) return <div className="max-w-[680px] mx-auto px-4 py-8 text-dim">…</div>;
  if (error || !data)
    return (
      <div className="max-w-[680px] mx-auto px-4 py-8 text-muted">
        League not found, or you&apos;re not a member.
      </div>
    );

  const { league, leaderboard } = data;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(league.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function leaveOrDelete() {
    const msg = league.isOwner
      ? "Delete this league for everyone?"
      : "Leave this league?";
    if (!window.confirm(msg)) return;
    await leave.mutateAsync(id);
    router.push("/leagues");
  }

  return (
    <div className="max-w-[680px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="ff-cond font-bold uppercase tracking-[0.1em] text-2xl">
          {league.name}
        </h1>
        <button
          onClick={leaveOrDelete}
          className="flex-none rounded-full border border-line2 px-3 py-1.5 ff-cond uppercase tracking-wide font-semibold text-[11px] text-dim hover:text-text"
        >
          {league.isOwner ? "Delete" : "Leave"}
        </button>
      </div>

      {/* Share code */}
      <button
        onClick={copyCode}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line2 px-3 py-2"
        title="Copy join code"
      >
        <span className="text-xs text-muted ff-cond uppercase tracking-wide">
          Invite code
        </span>
        <span className="ff-mono tracking-widest text-lg">{league.joinCode}</span>
        <span className="text-xs text-accent">{copied ? "copied!" : "copy"}</span>
      </button>

      {/* Free-member nudge */}
      {!hasPersonal ? (
        <div className="mt-4 rounded-lg border border-line2 p-3 text-sm text-muted">
          You&apos;re on the board, but you need the{" "}
          <b className="text-text">Personal</b> plan to submit predictions and
          score points.{" "}
          <a href="/account" className="text-accent underline">
            Subscribe to compete
          </a>
          .
        </div>
      ) : null}

      {/* Leaderboard */}
      <div className="mt-6 flex flex-col">
        <div className="flex items-center text-[11px] text-dim ff-cond uppercase tracking-wide px-3 pb-1">
          <span className="w-8">#</span>
          <span className="flex-1">Member</span>
          <span>Pts</span>
        </div>
        {leaderboard.map((r) => (
          <div
            key={r.userId}
            className="flex items-center px-3 py-2 rounded-lg text-sm"
            style={
              r.isMe
                ? {
                    background:
                      "color-mix(in srgb, var(--accent) 12%, transparent)",
                    border: "1px solid var(--accent)",
                  }
                : { borderBottom: "1px solid var(--line)" }
            }
          >
            <span className="w-8 ff-mono text-muted">{r.rank}</span>
            <span className="flex-1 truncate">
              {r.name || "Player"}
              {r.isMe ? <span className="text-accent text-xs"> · you</span> : null}
            </span>
            <span className="ff-mono">{r.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
