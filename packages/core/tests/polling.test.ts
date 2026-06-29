import { describe, it, expect } from "vitest";
import { POLL, intervalFromLive } from "../src/polling";

describe("intervalFromLive", () => {
  it("polls fast when something is live", () => {
    expect(intervalFromLive(2, [])).toBe(POLL.live);
  });
  it("polls medium when a game starts within 30 min", () => {
    const soon = new Date(Date.now() + 10 * 60_000).toISOString();
    expect(intervalFromLive(0, [{ status: "sched", utc: soon }])).toBe(POLL.soon);
  });
  it("polls slow when idle (next game is far off)", () => {
    const later = new Date(Date.now() + 5 * 60 * 60_000).toISOString();
    expect(intervalFromLive(0, [{ status: "sched", utc: later }])).toBe(POLL.idle);
  });
  it("ignores non-scheduled games for the 'soon' check", () => {
    const soon = new Date(Date.now() + 10 * 60_000).toISOString();
    expect(intervalFromLive(0, [{ status: "ft", utc: soon }])).toBe(POLL.idle);
  });
});
