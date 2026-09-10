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

  it("hydrates user from the API when sessionStorage has a valid session", async () => {
    sessionStorage.setItem(
      "auth_user",
      JSON.stringify({ codUsuario: baseUser.codUsuario, codSucursal: null, rol: "client" }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.userType).toBe("client");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAuthLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.user).toMatchObject(baseUser);
    });

    expect(result.current.isAuthLoading).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/usuarios/profiles/${baseUser.codUsuario}`),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("ignores legacy corrupted user storage gracefully", () => {
    localStorage.setItem("user", "not-valid-json{{{");
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("clears invalid session data and ignores it", () => {
    sessionStorage.setItem("auth_user", "not-valid-json{{{");
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.userType).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

// ─── login — userType derivation ─────────────────────────────────────────────

describe("AuthProvider — login userType derivation", () => {
  it('assigns "client" when role is "client"', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() =>
      result.current.login({ ...baseUser, cuil: null }, "client"),
    );
    expect(result.current.userType).toBe("client");
  });

  it('assigns "admin" when role is "admin"', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() =>
      result.current.login({ ...baseUser, cuil: "1" }, "admin"),
    );
    expect(result.current.userType).toBe("admin");
  });

  it('assigns "barber" when role is "barber"', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() =>
      result.current.login(
        { ...baseUser, cuil: "20-12345678-5" },
        "barber",
      ),
    );
    expect(result.current.userType).toBe("barber");
  });
});

// ─── login — state & sessionStorage ──────────────────────────────────────────

describe("AuthProvider — login side effects", () => {
  it("sets the user in state and marks isAuthenticated", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login(baseUser, "client"));
    expect(result.current.user).toMatchObject(baseUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("persists session metadata to sessionStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login(baseUser, "client"));

    const stored = JSON.parse(sessionStorage.getItem("auth_user") ?? "null");
    expect(stored).toEqual({
      codUsuario: baseUser.codUsuario,
      codSucursal: null,
      rol: "client",
    });
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("overwrites a previous session when login is called again", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() =>
      result.current.login({ ...baseUser, cuil: "1" }, "admin"),
    );
    act(() => result.current.login({ ...baseUser, cuil: null }, "client"));

    expect(result.current.userType).toBe("client");
    const stored = JSON.parse(sessionStorage.getItem("auth_user") ?? "null");
    expect(stored.rol).toBe("client");
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe("AuthProvider — logout", () => {
  it("clears user and userType from state", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login(baseUser, "client"));
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.userType).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("clears session storage and calls backend logout", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login(baseUser, "client"));
    await act(async () => {
      await result.current.logout();
    });

    expect(sessionStorage.getItem("auth_user")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("userType")).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/usuarios/logout"),
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});

// ─── useAuth outside provider ─────────────────────────────────────────────────

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow();

    spy.mockRestore();
  });
});
