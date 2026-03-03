import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request } from "express";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// We reset modules before each test so `securityEvents` starts as an empty
// array and tests do not bleed state into one another.
type SecurityEventType =
  | "rate_limit"
  | "duplicate_request"
  | "validation_error"
  | "auth_failure";

let logSecurityEvent: (
  req: Request,
  type: SecurityEventType,
  message: string,
) => void;
let getSecurityEvents: (limit?: number) => unknown[];

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("../../src/BACK/middleware/securityMonitor.ts");
  logSecurityEvent = mod.logSecurityEvent;
  getSecurityEvents = mod.getSecurityEvents;
});

const mockReq = (ip = "127.0.0.1", path = "/test", method = "POST"): Request =>
  ({
    ip,
    socket: { remoteAddress: ip },
    path,
    method,
  }) as unknown as Request;

// ─── logSecurityEvent ─────────────────────────────────────────────────────────

describe("logSecurityEvent", () => {
  it("starts with an empty events list", () => {
    expect(getSecurityEvents()).toHaveLength(0);
  });

  it("appends an event with the correct shape", () => {
    logSecurityEvent(mockReq(), "auth_failure", "Credenciales inválidas");

    const events = getSecurityEvents() as Array<Record<string, unknown>>;
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      ip: "127.0.0.1",
      endpoint: "/test",
      method: "POST",
      type: "auth_failure",
      message: "Credenciales inválidas",
    });
    expect(events[0].timestamp).toBeInstanceOf(Date);
  });

  it("captures all four event types", () => {
    const types: SecurityEventType[] = [
      "rate_limit",
      "duplicate_request",
      "validation_error",
      "auth_failure",
    ];

    for (const type of types) {
      logSecurityEvent(mockReq(), type, `msg-${type}`);
    }

    const events = getSecurityEvents() as Array<{ type: string }>;
    const recordedTypes = events.map((e) => e.type);
    for (const type of types) {
      expect(recordedTypes).toContain(type);
    }
  });

  it("uses socket.remoteAddress as fallback when req.ip is undefined", () => {
    const req = {
      ip: undefined,
      socket: { remoteAddress: "10.0.0.1" },
      path: "/api",
      method: "GET",
    } as unknown as Request;

    logSecurityEvent(req, "rate_limit", "test");

    const events = getSecurityEvents() as Array<{ ip: string }>;
    expect(events[0].ip).toBe("10.0.0.1");
  });
});

// ─── getSecurityEvents — limit ────────────────────────────────────────────────

describe("getSecurityEvents", () => {
  const addEvents = (n: number) => {
    for (let i = 0; i < n; i++) {
      logSecurityEvent(mockReq(), "validation_error", `event-${i}`);
    }
  };

  it("returns all events when limit exceeds count", () => {
    addEvents(5);
    expect(getSecurityEvents(50)).toHaveLength(5);
  });

  it("returns exactly limit events when there are more than limit", () => {
    addEvents(10);
    expect(getSecurityEvents(3)).toHaveLength(3);
  });

  it("returns the LAST N events (tail of the list)", () => {
    addEvents(5); // event-0 … event-4
    const last2 = getSecurityEvents(2) as Array<{ message: string }>;
    expect(last2[0].message).toBe("event-3");
    expect(last2[1].message).toBe("event-4");
  });

  it("defaults to returning up to 50 events", () => {
    addEvents(60);
    expect(getSecurityEvents()).toHaveLength(50);
  });
});

// ─── MAX_EVENTS cap ───────────────────────────────────────────────────────────

describe("securityEvents ring-buffer cap (MAX_EVENTS = 100)", () => {
  it("never exceeds 100 events and drops the oldest first", () => {
    // Add 101 events
    for (let i = 0; i <= 100; i++) {
      logSecurityEvent(mockReq(), "rate_limit", `event-${i}`);
    }

    // getSecurityEvents with a large limit to see everything
    const all = getSecurityEvents(200) as Array<{ message: string }>;

    expect(all).toHaveLength(100);
    // Oldest event (event-0) was dropped
    expect(all.find((e) => e.message === "event-0")).toBeUndefined();
    // Newest (event-100) is present at the tail
    expect(all[all.length - 1].message).toBe("event-100");
  });

  it("stays at exactly 100 after many additional events", () => {
    for (let i = 0; i < 150; i++) {
      logSecurityEvent(mockReq(), "rate_limit", `msg-${i}`);
    }
    expect(getSecurityEvents(500)).toHaveLength(100);
  });
});
