import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deduplicateRequests } from "../../src/BACK/middleware/deduplication.ts";
import type { Request, Response, NextFunction } from "express";

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _testId = 0;

// Each call to uniqueBody() produces a payload unique to the current test,
// preventing the shared in-memory requestCache from causing cross-test hits.
const uniqueBody = (extra: object = {}) => ({ _testId: ++_testId, ...extra });

const mockReq = (
  overrides: Partial<{ ip: string; method: string; body: unknown }> = {},
): Request =>
  ({
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
    method: "POST",
    body: uniqueBody(),
    ...overrides,
  }) as unknown as Request;

const mockRes = () => {
  const res = {} as Response;
  (res as unknown as Record<string, unknown>).status = vi
    .fn()
    .mockReturnValue(res);
  (res as unknown as Record<string, unknown>).json = vi
    .fn()
    .mockReturnValue(res);
  return res;
};

const mockNext = (): NextFunction => vi.fn() as unknown as NextFunction;

// ─── deduplicateRequests ──────────────────────────────────────────────────────

describe("deduplicateRequests", () => {
  beforeEach(() => {
    // Fake timers let us control Date.now() so timing checks are deterministic.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("passes GET requests through without caching", () => {
    const middleware = deduplicateRequests(3000);
    const req = mockReq({ method: "GET", body: uniqueBody() });
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(
      (res as unknown as Record<string, unknown>).status,
    ).not.toHaveBeenCalled();
  });

  it("passes DELETE requests through without caching", () => {
    const middleware = deduplicateRequests(3000);
    const req = mockReq({ method: "DELETE", body: uniqueBody() });
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("passes the first POST through and stores it in cache", () => {
    const middleware = deduplicateRequests(3000);
    const body = uniqueBody();
    const req = mockReq({ body });
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(
      (res as unknown as Record<string, unknown>).status,
    ).not.toHaveBeenCalled();
  });

  it("blocks an identical POST within the window with status 429", () => {
    const windowMs = 3000;
    const middleware = deduplicateRequests(windowMs);
    const body = uniqueBody();
    const res1 = mockRes();
    const res2 = mockRes();
    const next1 = mockNext();
    const next2 = mockNext();

    // First request — should pass
    middleware(mockReq({ body }), res1, next1);
    expect(next1).toHaveBeenCalledOnce();

    // Advance by less than the window
    vi.advanceTimersByTime(windowMs - 100);

    // Second identical request — should be rejected
    middleware(mockReq({ body }), res2, next2);

    expect(
      (res2 as unknown as Record<string, unknown>).status,
    ).toHaveBeenCalledWith(429);
    expect(
      (res2 as unknown as Record<string, unknown>).json,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        retryAfter: expect.any(Number),
      }),
    );
    expect(next2).not.toHaveBeenCalled();
  });

  it("allows the same request after the window has expired", () => {
    const windowMs = 3000;
    const middleware = deduplicateRequests(windowMs);
    const body = uniqueBody();
    const res1 = mockRes();
    const res2 = mockRes();
    const next1 = mockNext();
    const next2 = mockNext();

    // First request
    middleware(mockReq({ body }), res1, next1);
    expect(next1).toHaveBeenCalledOnce();

    // Advance time past the window
    vi.advanceTimersByTime(windowMs + 1);

    // Same request — window expired, should pass through
    middleware(mockReq({ body }), res2, next2);
    expect(next2).toHaveBeenCalledOnce();
    expect(
      (res2 as unknown as Record<string, unknown>).status,
    ).not.toHaveBeenCalled();
  });

  it("allows two requests with different bodies from the same IP", () => {
    const middleware = deduplicateRequests(3000);
    const ip = "127.0.0.1";
    const res1 = mockRes();
    const res2 = mockRes();
    const next1 = mockNext();
    const next2 = mockNext();

    middleware(mockReq({ ip, body: uniqueBody({ action: "a" }) }), res1, next1);
    middleware(mockReq({ ip, body: uniqueBody({ action: "b" }) }), res2, next2);

    expect(next1).toHaveBeenCalledOnce();
    expect(next2).toHaveBeenCalledOnce();
  });

  it("allows the same body from two different IPs", () => {
    const middleware = deduplicateRequests(3000);
    const sharedBody = uniqueBody({ shared: true });
    const res1 = mockRes();
    const res2 = mockRes();
    const next1 = mockNext();
    const next2 = mockNext();

    middleware(mockReq({ ip: "192.168.1.1", body: sharedBody }), res1, next1);
    middleware(mockReq({ ip: "192.168.1.2", body: sharedBody }), res2, next2);

    expect(next1).toHaveBeenCalledOnce();
    expect(next2).toHaveBeenCalledOnce();
  });

  it("passes PUT and PATCH methods through the same dedup logic", () => {
    const middleware = deduplicateRequests(3000);
    const body = uniqueBody();

    for (const method of ["PUT", "PATCH"] as const) {
      const res1 = mockRes();
      const res2 = mockRes();
      const next1 = mockNext();
      const next2 = mockNext();

      // Each method gets its own unique body to avoid colliding with each other
      const methodBody = { ...body, method };
      middleware(mockReq({ method, body: methodBody }), res1, next1);
      middleware(mockReq({ method, body: methodBody }), res2, next2);

      expect(next1).toHaveBeenCalledOnce();
      expect(
        (res2 as unknown as Record<string, unknown>).status,
      ).toHaveBeenCalledWith(429);
    }
  });
});
