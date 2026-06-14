// Timezone-aware formatting. Default zone is US Eastern; the UI can pass
// "local" (browser zone) or "UTC" later via the timezone toggle.

export type TzMode = "ET" | "local" | "UTC";

function zoneFor(mode: TzMode): string | undefined {
  if (mode === "ET") return "America/New_York";
  if (mode === "UTC") return "UTC";
  return undefined; // local => omit timeZone, use the browser's
}

export function etParts(utc: string, mode: TzMode = "ET") {
  const d = new Date(utc);
  const timeZone = zoneFor(mode);
  const day = d.toLocaleString("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleString("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
  return { day, time };
}

export function tzLabel(mode: TzMode): string {
  if (mode === "ET") return "ET";
  if (mode === "UTC") return "UTC";
  // short local zone abbreviation, e.g. "PDT"
  try {
    return (
      new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value || "local"
    );
  } catch {
    return "local";
  }
}
