import type { Theme } from "@/components/design/theme";
import { hex } from "@/components/design/primitives";

// Small, restrained captain / goalkeeper markers, styled via t.*. Reused in the
// squad list and on the player header. Both can show.
export function PlayerTags({
  t,
  captain,
  goalkeeper,
  size = 9.5,
}: {
  t: Theme;
  captain?: boolean;
  goalkeeper?: boolean;
  size?: number;
}) {
  if (!captain && !goalkeeper) return null;
  const chip = (text: string, color: string, bg: string, border: string) => (
    <span className="num" style={{ display: "inline-flex", alignItems: "center", fontSize: size, fontWeight: 800, letterSpacing: ".04em", padding: "1px 5px", borderRadius: 5, lineHeight: 1.4, color, background: bg, border: `1px solid ${border}` }}>
      {text}
    </span>
  );
  return (
    <span style={{ display: "inline-flex", gap: 4, flexShrink: 0 }}>
      {captain ? chip("C", t.gold, hex(t.gold, 0.14), hex(t.gold, 0.3)) : null}
      {goalkeeper ? chip("GK", t.textDim, t.chip, hex(t.border, 0.7)) : null}
    </span>
  );
}
