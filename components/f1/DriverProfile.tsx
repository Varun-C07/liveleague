import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { DriverProfile as DP } from "@/lib/sports/f1-driver";

function posColor(p: number | null): string {
  if (p == null) return "var(--dim)";
  if (p === 1) return "var(--gold)";
  if (p <= 3) return "var(--accent)";
  if (p <= 10) return "var(--text)";
  return "var(--muted)";
}

export function DriverProfile({ p }: { p: DP }) {
  return (
    <div className="max-w-[1180px] mx-auto px-3.5 pt-5 pb-16">
      <Link href="/f1" className="inline-flex items-center gap-1 ff-mono text-[12px] text-muted hover:text-text mb-3">
        <ChevronLeft size={14} /> Back to F1
      </Link>

      <header className="relative overflow-hidden rounded-2xl border border-line glass p-5">
        <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: p.color }} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="ff-cond tracking-[0.28em] text-[12px] font-bold uppercase" style={{ color: p.color }}>
              {p.constructor || "Formula 1"}
            </div>
            <h1 className="ff-cond font-bold uppercase leading-[0.92] tracking-tight mt-1" style={{ fontSize: "clamp(30px,7vw,60px)" }}>
              {p.name} <span className="ff-mono text-dim align-middle" style={{ fontSize: "0.4em" }}>{p.code}</span>
            </h1>
          </div>
          <div className="flex gap-2.5">
            <Stat k="Champ">P{p.rank}</Stat>
            <Stat k="Points">{p.points}</Stat>
            <Stat k="Wins">{p.wins}</Stat>
          </div>
        </div>
      </header>

      <div className="grid gap-3 mt-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
        <Panel title="Title picture">
          {p.rank === 1 ? (
            <>
              <Big sub="championship leader">P1</Big>
              <p className="text-muted text-[12.5px] mt-1.5">
                Up to <b className="text-text">{p.maxRemaining}</b> pts still in play over {p.racesLeft} rounds.
              </p>
            </>
          ) : (
            <>
              <Big sub={`pts behind ${p.leaderCode}`}>{p.gapToLeader}</Big>
              <p className="text-muted text-[12.5px] mt-1.5">
                {p.canWinTitle ? (
                  <>
                    <b style={{ color: "var(--accent)" }}>Can still win</b> — {p.maxRemaining} pts available across {p.racesLeft} rounds.
                  </>
                ) : (
                  <>Out of title contention — only {p.maxRemaining} pts remain.</>
                )}
              </p>
            </>
          )}
        </Panel>

        {p.ahead && (
          <Panel title={`Catching P${p.rank - 1}`}>
            <Big sub={`pts to ${p.ahead.code}`}>{p.ahead.gap}</Big>
            <p className="text-muted text-[12.5px] mt-1.5">
              {p.ahead.canCatch ? "Reachable with the points still on the table." : "Mathematically can't be caught."}
            </p>
          </Panel>
        )}

        <Panel title="Season remaining">
          <Big sub="rounds left">{p.racesLeft}</Big>
          <p className="text-muted text-[12.5px] mt-1.5">
            {p.sprintsLeft} sprint{p.sprintsLeft === 1 ? "" : "s"} · up to <b className="text-text">{p.maxRemaining}</b> pts available.
          </p>
        </Panel>
      </div>

      <div className="mt-5">
        <h2 className="ff-cond uppercase tracking-[0.16em] text-[12px] text-muted font-bold mb-2.5">2026 Results</h2>
        {p.results.length ? (
          <div className="flex flex-wrap gap-1.5">
            {p.results.map((r) => (
              <div key={r.round} className="border border-line2 rounded-md bg-panel2 px-2 py-1.5 text-center min-w-[46px]">
                <div className="ff-mono text-[9px] text-dim">
                  R{r.round}
                  {r.sprint ? "·S" : ""}
                </div>
                <div className="ff-cond font-bold text-[17px]" style={{ color: posColor(r.position) }}>
                  {r.position ?? "–"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ff-mono text-[12px] text-dim">No completed rounds yet.</div>
        )}
      </div>
    </div>
  );
}

function Stat({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="border border-line2 rounded-xl bg-panel2 px-3 py-2 text-center min-w-[72px]">
      <div className="ff-cond text-[10px] tracking-[0.16em] text-muted uppercase">{k}</div>
      <div className="ff-cond font-bold text-[24px] leading-none mt-0.5">{children}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-line2 rounded-xl bg-panel px-4 py-3.5">
      <div className="ff-cond uppercase tracking-[0.16em] text-[11px] text-dim mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function Big({ children, sub }: { children: React.ReactNode; sub: string }) {
  return (
    <div className="ff-cond font-bold text-[34px] leading-none">
      {children}
      <span className="text-[13px] text-dim font-semibold ml-1.5">{sub}</span>
    </div>
  );
}
