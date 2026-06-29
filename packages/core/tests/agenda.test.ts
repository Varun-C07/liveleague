import { describe, it, expect } from "vitest";
import { bucketFor, inAgendaWindow } from "../src/sports/agenda-window";

const ms = (iso: string) => Date.parse(iso);

describe("bucketFor", () => {
  const now = ms("2026-06-15T12:00:00Z");
  it("buckets by day distance from now", () => {
    expect(bucketFor(now, now)).toBe("today");
    expect(bucketFor(ms("2026-06-15T22:00:00Z"), now)).toBe("today"); // same UTC day
    expect(bucketFor(ms("2026-06-16T12:00:00Z"), now)).toBe("week"); // +1d
    expect(bucketFor(ms("2026-06-22T12:00:00Z"), now)).toBe("week"); // +7d
    expect(bucketFor(ms("2026-06-23T12:00:00Z"), now)).toBe("month"); // +8d
    expect(bucketFor(ms("2026-07-16T12:00:00Z"), now)).toBe("month"); // +31d
    expect(bucketFor(ms("2026-07-18T12:00:00Z"), now)).toBeNull(); // +33d, out
  });
  it("counts a just-finished game (last 24h, prior UTC day) as today", () => {
    const n = ms("2026-06-15T01:00:00Z");
    expect(bucketFor(ms("2026-06-14T23:00:00Z"), n)).toBe("today");
    expect(bucketFor(ms("2026-06-13T23:00:00Z"), n)).toBeNull(); // >24h ago
  });
});

describe("inAgendaWindow", () => {
  const now = ms("2026-06-15T12:00:00Z");
  it("always includes live games regardless of start time", () => {
    expect(inAgendaWindow({ status: "live", utc: "2026-06-15T09:00:00Z" }, now)).toBe(true);
  });
  it("includes upcoming within the month and excludes far-future / old finals", () => {
    expect(inAgendaWindow({ status: "sched", utc: "2026-06-20T12:00:00Z" }, now)).toBe(true);
    expect(inAgendaWindow({ status: "sched", utc: "2026-09-01T12:00:00Z" }, now)).toBe(false);
    expect(inAgendaWindow({ status: "final", utc: "2026-06-10T12:00:00Z" }, now)).toBe(false);
  });
});
