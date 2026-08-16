import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import {
  AuthProvider,
  useAuth,
} from "../../src/FRONT/views/components/user/AuthContext.tsx";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null, children);

const baseUser = {
  codUsuario: "USR-001",
  dni: "12345678",
  cuil: null as string | null,
  codSucursal: null as string | null,
  nombre: "Juan",
  apellido: "Pérez",
  telefono: "1122334455",
  email: "juan@example.com",
};

const makeToken = (rol: "client" | "barber" | "admin") => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      codUsuario: baseUser.codUsuario,
      codSucursal: null,
      rol,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  );

  return `${header}.${payload}.signature`;
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: baseUser }),
  }) as unknown as typeof fetch;
});

// ─── Initial state ─────────────────────────────────────────────────────────

describe("AuthProvider — initial state", () => {
  it("starts with no user and unauthenticated", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.userType).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAuthLoading).toBe(false);
  });

  it("hydrates user from the API when sessionStorage has a valid token", async () => {
    sessionStorage.setItem("token", makeToken("client"));
    localStorage.setItem("user", JSON.stringify(baseUser));
    localStorage.setItem("userType", "client");

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.userType).toBe("client");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAuthLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.user).toMatchObject(baseUser);
    });

    expect(result.current.isAuthLoading).toBe(false);
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("userType")).toBeNull();
    expect(sessionStorage.getItem("token")).toBe(makeToken("client"));
    expect(global.fetch).toHaveBeenCalledWith(
      `/usuarios/profiles/${baseUser.codUsuario}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        }),
      }),
    );
  });

  it("ignores legacy corrupted user storage gracefully", () => {
    localStorage.setItem("user", "not-valid-json{{{");
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("clears an invalid stored token", () => {
    sessionStorage.setItem("token", "not-a-jwt");
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.userType).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(sessionStorage.getItem("token")).toBeNull();
  });
});

// ─── login — userType derivation ─────────────────────────────────────────────

describe("AuthProvider — login userType derivation", () => {
  it('assigns "client" when cuil is null', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login({ ...baseUser, cuil: null }, makeToken("client")));
    expect(result.current.userType).toBe("client");
  });

  it('assigns "admin" when cuil is "1"', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login({ ...baseUser, cuil: "1" }, makeToken("admin")));
    expect(result.current.userType).toBe("admin");
  });

  it('assigns "barber" when cuil is a real CUIL string (not "1")', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() =>
      result.current.login(
        { ...baseUser, cuil: "20-12345678-5" },
        makeToken("barber"),
      ),
    );
    expect(result.current.userType).toBe("barber");
  });
});

// ─── login — state & localStorage ────────────────────────────────────────────

describe("AuthProvider — login side effects", () => {
  it("sets the user in state and marks isAuthenticated", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login(baseUser, makeToken("client")));
    expect(result.current.user).toMatchObject(baseUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("persists only the token to sessionStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const token = makeToken("client");
    act(() => result.current.login(baseUser, token));

    expect(sessionStorage.getItem("token")).toBe(token);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("userType")).toBeNull();
  });

  it("overwrites a previous session when login is called again", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const clientToken = makeToken("client");

    act(() =>
      result.current.login({ ...baseUser, cuil: "1" }, makeToken("admin")),
    );
    act(() =>
      result.current.login({ ...baseUser, cuil: null }, clientToken),
    );

    expect(result.current.userType).toBe("client");
    expect(sessionStorage.getItem("token")).toBe(clientToken);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("userType")).toBeNull();
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe("AuthProvider — logout", () => {
  it("clears user and userType from state", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login(baseUser, makeToken("client")));
    act(() => result.current.logout());

    expect(result.current.user).toBeNull();
    expect(result.current.userType).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("removes user and userType from storage and clears the current session token", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login(baseUser, makeToken("client")));
    act(() => result.current.logout());

    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("userType")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
  });
});

// ─── useAuth outside provider ─────────────────────────────────────────────────

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    // Suppress the expected React error boundary console.error output
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");

    spy.mockRestore();
  });
});
