"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  useMyLeagues,
  useCreateLeague,
  useJoinLeague,
} from "@/hooks/useLeagues";

export default function LeaguesPage() {
  const { user, configured, loading, signInWithGoogle } = useAuth();
  const { hasPersonal } = useEntitlements();
  const { data: leagues } = useMyLeagues();
  const create = useCreateLeague();
  const join = useJoinLeague();
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function doCreate() {
    setErr(null);
    try {
      const league = await create.mutateAsync(name.trim());
      setName("");
      router.push(`/leagues/${league.id}`);
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  async function doJoin() {
    setErr(null);
    try {
      const league = await join.mutateAsync(code);
      setCode("");
      router.push(`/leagues/${league.id}`);
    } catch (e) {
      setErr((e as Error).message === "not_found" ? "No league with that code." : (e as Error).message);
    }
  }

  return (
    <div className="max-w-[680px] mx-auto px-4 py-8">
      <h1 className="ff-cond font-bold uppercase tracking-[0.12em] text-2xl">
        Friend leagues
      </h1>

      {!configured ? (
        <p className="mt-6 text-muted">Backend not configured.</p>
      ) : loading ? (
        <p className="mt-6 text-dim">…</p>
      ) : !user ? (
        <button
          onClick={signInWithGoogle}
          className="mt-6 rounded-full border px-4 py-2 ff-cond uppercase tracking-wide font-semibold text-sm"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
        >
          Sign in to play
        </button>
      ) : (
        <>
          {err ? <p className="mt-4 text-sm text-red">{err}</p> : null}

          {/* My leagues */}
          <div className="mt-6 flex flex-col gap-2">
            {(leagues ?? []).length === 0 ? (
              <p className="text-muted text-sm">
                You&apos;re not in any leagues yet.
              </p>
            ) : (
              (leagues ?? []).map((l) => (
                <Link
                  key={l.id}
                  href={`/leagues/${l.id}`}
                  className="rounded-lg border border-line2 px-3 py-2 flex items-center justify-between hover:border-line"
                >
                  <span className="ff-cond font-semibold">{l.name}</span>
                  <span className="text-xs text-muted">
                    {l.isOwner ? "owner · " : ""}
                    {l.myPoints} pts
                  </span>
                </Link>
              ))
            )}
          </div>

          {/* Join */}
          <div className="mt-8">
            <h2 className="ff-cond uppercase tracking-wide text-sm text-muted">
              Join with a code
            </h2>
            <div className="mt-2 flex gap-2">
              <input
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
                }
                placeholder="K7QF9P"
                className="ff-mono tracking-widest rounded border border-line2 bg-transparent px-3 py-2 w-36"
              />
              <button
                onClick={doJoin}
                disabled={join.isPending || code.length !== 6}
                className="rounded-full border px-4 py-2 ff-cond uppercase tracking-wide font-semibold text-[12px] disabled:opacity-50"
                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
              >
                {join.isPending ? "…" : "Join"}
              </button>
            </div>
          </div>

          {/* Create (Personal only) */}
          <div className="mt-8">
            <h2 className="ff-cond uppercase tracking-wide text-sm text-muted">
              Create a league
            </h2>
            {hasPersonal ? (
              <div className="mt-2 flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 60))}
                  placeholder="The Office WC Pool"
                  className="rounded border border-line2 bg-transparent px-3 py-2 flex-1"
                />
                <button
                  onClick={doCreate}
                  disabled={create.isPending || name.trim().length === 0}
                  className="rounded-full border px-4 py-2 ff-cond uppercase tracking-wide font-semibold text-[12px] disabled:opacity-50"
                  style={{
                    borderColor: "var(--accent)",
                    color: "var(--accent)",
                    background: "color-mix(in srgb, var(--accent) 14%, transparent)",
                  }}
                >
                  {create.isPending ? "…" : "Create"}
                </button>
              </div>
            ) : (
              <div className="mt-2 rounded-lg border border-line2 p-3 text-sm text-muted">
                Creating a league needs the <b className="text-text">Personal</b>{" "}
                plan.{" "}
                <a href="/account" className="text-accent underline">
                  Unlock it
                </a>
                . (You can still join any league with a code.)
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
