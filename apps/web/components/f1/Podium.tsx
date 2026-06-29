import type { F1Driver } from "@/data/snapshots/f1";

// Rostrum: P2 · P1 · P3, heights stepped, each step tinted by its medal but
// bordered/labelled in the driver's constructor color (ported from the board).
const STEP = {
  P1: { h: 30, tint: "rgba(240,198,74,0.14)" },
  P2: { h: 22, tint: "rgba(196,202,212,0.12)" },
  P3: { h: 15, tint: "rgba(207,130,70,0.14)" },
} as const;

export function Podium({ podium }: { podium: [F1Driver, F1Driver, F1Driver] | null }) {
  if (!podium) {
    return <div className="ff-mono text-[12px] text-dim w-full text-center sm:text-left">— awaiting result —</div>;
  }
  const [p1, p2, p3] = podium;
  const order: [F1Driver, keyof typeof STEP][] = [
    [p2, "P2"],
    [p1, "P1"],
    [p3, "P3"],
  ];
  return (
    <div className="flex items-end justify-center sm:justify-start gap-1.5 h-16">
      {order.map(([dr, step]) => (
        <div key={step} className="flex flex-col items-center justify-end w-10 h-16">
          <span className="ff-mono font-bold text-[10px] leading-none mb-1" style={{ color: dr.color }}>
            {dr.code}
          </span>
          <span
            className="w-full rounded-t-[3px] border-t-2"
            style={{ height: STEP[step].h, background: STEP[step].tint, borderColor: dr.color }}
          />
          <span className="ff-cond text-[9px] leading-none text-dim mt-1 tracking-wider">{step}</span>
        </div>
      ))}
    </div>
  );
}
