import type { ReactNode, SVGProps } from "react";

// Inline lucide-style icons (ported from the design prototype — drop-in, no dep).
type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  color?: string;
  sw?: number;
};

export const Ico = ({
  size = 24,
  color = "currentColor",
  sw = 2,
  children,
  ...rest
}: IconProps & { children?: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {children}
  </svg>
);

export const Radio = (p: IconProps) => <Ico {...p}><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2a7 7 0 0 1 0-8.4" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8a7 7 0 0 1 0 8.4" /><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" /></Ico>;
export const Trophy = (p: IconProps) => <Ico {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></Ico>;
export const Bell = (p: IconProps) => <Ico {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Ico>;
export const Users = (p: IconProps) => <Ico {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Ico>;
export const Share2 = (p: IconProps) => <Ico {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></Ico>;
export const Lock = (p: IconProps) => <Ico {...p}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Ico>;
export const Check = (p: IconProps) => <Ico {...p}><polyline points="20 6 9 17 4 12" /></Ico>;
export const ChevronRight = (p: IconProps) => <Ico {...p}><polyline points="9 18 15 12 9 6" /></Ico>;
export const Plus = (p: IconProps) => <Ico {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Ico>;
export const Minus = (p: IconProps) => <Ico {...p}><line x1="5" y1="12" x2="19" y2="12" /></Ico>;
export const Star = (p: IconProps) => <Ico {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Ico>;
export const MapPin = (p: IconProps) => <Ico {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Ico>;
export const TrendingUp = (p: IconProps) => <Ico {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></Ico>;
export const Crown = (p: IconProps) => <Ico {...p}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" /><path d="M5 20h14" /></Ico>;
export const Zap = (p: IconProps) => <Ico {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Ico>;
export const Calendar = (p: IconProps) => <Ico {...p}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></Ico>;
export const ChevronDown = (p: IconProps) => <Ico {...p}><polyline points="6 9 12 15 18 9" /></Ico>;
export const Circle = (p: IconProps) => <Ico {...p}><circle cx="12" cy="12" r="10" /></Ico>;
export const Palette = (p: IconProps) => <Ico {...p}><circle cx="13.5" cy="6.5" r=".9" fill="currentColor" stroke="none" /><circle cx="17.5" cy="10.5" r=".9" fill="currentColor" stroke="none" /><circle cx="8.5" cy="7.5" r=".9" fill="currentColor" stroke="none" /><circle cx="6.5" cy="12.5" r=".9" fill="currentColor" stroke="none" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1.1a1.6 1.6 0 0 1 1.6-1.6H16c3 0 5.5-2.5 5.5-5.6C22 6 17.5 2 12 2z" /></Ico>;
export const X = (p: IconProps) => <Ico {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Ico>;

export function IconF1({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" style={{ transform: "skewX(-9deg)" }}>
      <path d="M2 18h20" strokeDasharray="14 4 2" strokeWidth="2" />
      <path d="M5 14l2-3h4l5 3h2l1 1H4z" />
      <path d="M4 14V9h3l-1 2" />
      <circle cx="7" cy="15" r="2.5" fill="var(--bg, #08090B)" stroke={color} strokeWidth="1.5" />
      <circle cx="16" cy="15" r="2.5" fill="var(--bg, #08090B)" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// Crisp checkered flag — motorsport identity at small sizes (the race-car
// lozenge smudged). Filled alternating cells read as "checkered" on transparent.
export function CheckeredFlag({ size = 24, color = "currentColor", sw = 2 }: { size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v18" />
      <rect x="5" y="4" width="15" height="8" />
      <path fill={color} stroke="none" d="M5 4h3.75v4H5z M12.5 4h3.75v4H12.5z M8.75 8h3.75v4H8.75z M16.25 8h3.75v4h-3.75z" />
    </svg>
  );
}

export function IconSoccer({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
      <path d="M12 7.5l3.5 5h-7z" />
      <path d="M12 7.5V3" />
      <path d="M15.5 12.5l4.5 2.5" />
      <path d="M8.5 12.5L4 15" />
      <path d="M12 16.5v4.5" />
      <path d="M8.5 12.5l3.5 4h0l3.5-4" />
    </svg>
  );
}
