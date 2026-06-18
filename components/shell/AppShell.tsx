"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SPORT_META } from "@/lib/sports/meta";
import { AuthControl } from "@/components/shell/AuthControl";

function sportFromPath(path: string): string {
  if (!path || path === "/") return "home";
  const seg = path.split("/")[1];
  if (seg === "agenda") return "agenda";
  return SPORT_META.some((s) => s.id === seg) ? seg : "home";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const active = sportFromPath(path);

  return (
    // data-sport drives var(--accent) for everything beneath it (see globals.css)
    <div data-sport={active} className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-line glass">
        <nav className="max-w-[1180px] mx-auto px-3.5 h-[54px] flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 flex-none group" aria-label="Live League home">
            <span
              className="w-2.5 h-2.5 rounded-sm rotate-45 anim-accent-pulse"
              style={{ background: "var(--accent)" }}
            />
            <span className="ff-cond font-bold uppercase tracking-[0.18em] text-[15px] leading-none">
              Live<span className="text-dim">League</span>
            </span>
          </Link>

          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar justify-end">
            <NavPill href="/" label="Home" emoji="◎" active={active === "home"} />
            <NavPill href="/agenda" label="Agenda" emoji="🗓️" active={active === "agenda"} />
            {SPORT_META.map((s) => (
              <NavPill
                key={s.id}
                href={s.basePath}
                label={s.short}
                emoji={s.emoji}
                accentVar={s.accentVar}
                active={active === s.id}
              />
            ))}
          </div>

          <AuthControl />
        </nav>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}

function NavPill({
  href,
  label,
  emoji,
  accentVar,
  active,
}: {
  href: string;
  label: string;
  emoji: string;
  accentVar?: string;
  active: boolean;
}) {
  // Each pill tints to its OWN sport accent (so the nav reads as a palette),
  // and the active one fills in.
  const color = accentVar ? `var(${accentVar})` : "var(--accent)";
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="flex-none flex items-center gap-1.5 rounded-full border px-3 py-1.5 ff-cond uppercase tracking-wide font-semibold text-[12px] transition"
      style={
        active
          ? { borderColor: color, color, background: `color-mix(in srgb, ${color} 14%, transparent)` }
          : { borderColor: "var(--line2)", color: "var(--muted)" }
      }
    >
      <span className="text-[12px] leading-none" aria-hidden>
        {emoji}
      </span>
      {label}
    </Link>
  );
}
