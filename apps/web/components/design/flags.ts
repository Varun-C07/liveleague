// FIFA 3-letter team code → circle-flags slug (ISO 3166-1 alpha-2, or gb-* for
// the UK home nations). Flag emoji are inconsistent across platforms and don't
// render England/Scotland/Wales, so we use the circle-flags SVG set instead:
//   https://github.com/HatScripts/circle-flags  (served via jsDelivr)
// Any code not in this map → flagSlug() returns null and the caller falls back
// to the colored team circle, so a badge is never blank.
const FIFA_TO_ISO: Record<string, string> = {
  MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz",
  CAN: "ca", BIH: "ba", QAT: "qa", SUI: "ch",
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct",
  USA: "us", PAR: "py", AUS: "au", TUR: "tr",
  GER: "de", CUW: "cw", CIV: "ci", ECU: "ec",
  NED: "nl", JPN: "jp", SWE: "se", TUN: "tn",
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  ESP: "es", CPV: "cv", KSA: "sa", URU: "uy",
  FRA: "fr", SEN: "sn", IRQ: "iq", NOR: "no",
  ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  POR: "pt", COD: "cd", UZB: "uz", COL: "co",
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
  // Common home-nation extras (not in the 2026 set but cheap to support):
  WAL: "gb-wls", NIR: "gb-nir",
};

const FLAG_CDN = "https://cdn.jsdelivr.net/gh/HatScripts/circle-flags/flags";

export function flagSlug(code: string | undefined | null): string | null {
  if (!code) return null;
  return FIFA_TO_ISO[code.toUpperCase()] ?? null;
}

export function flagUrl(slug: string): string {
  return `${FLAG_CDN}/${slug}.svg`;
}
