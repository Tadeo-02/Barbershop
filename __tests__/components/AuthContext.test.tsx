import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import {
  AuthProvider,
  useAuth,
} from "../../src/FRONT/views/components/login/AuthContext.tsx";

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
});

// ─── Initial state ─────────────────────────────────────────────────────────

describe("AuthProvider — initial state", () => {
  it("starts with no user and unauthenticated", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.userType).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("hydrates user and userType from localStorage on first render", () => {
    const storedUser = { ...baseUser };
    localStorage.setItem("user", JSON.stringify(storedUser));
    localStorage.setItem("userType", "client");

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toMatchObject(storedUser);
    expect(result.current.userType).toBe("client");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("handles corrupted localStorage gracefully (stays null)", () => {
    localStorage.setItem("user", "not-valid-json{{{");
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });
});

// ─── login — userType derivation ─────────────────────────────────────────────

describe("AuthProvider — login userType derivation", () => {
  it('assigns "client" when cuil is null', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login({ ...baseUser, cuil: null }));
    expect(result.current.userType).toBe("client");
  });

  it('assigns "admin" when cuil is "1"', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login({ ...baseUser, cuil: "1" }));
    expect(result.current.userType).toBe("admin");
  });

  it('assigns "barber" when cuil is a real CUIL string (not "1")', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login({ ...baseUser, cuil: "20-12345678-5" }));
    expect(result.current.userType).toBe("barber");
  });
});

// ─── login — state & localStorage ────────────────────────────────────────────

describe("AuthProvider — login side effects", () => {
  it("sets the user in state and marks isAuthenticated", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login(baseUser));
    expect(result.current.user).toMatchObject(baseUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("persists user and userType to localStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login(baseUser));

    expect(JSON.parse(localStorage.getItem("user")!)).toMatchObject(baseUser);
    expect(localStorage.getItem("userType")).toBe("client");
  });

  it("overwrites a previous session when login is called again", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login({ ...baseUser, cuil: "1" })); // admin
    act(() => result.current.login({ ...baseUser, cuil: null })); // client

    expect(result.current.userType).toBe("client");
    expect(localStorage.getItem("userType")).toBe("client");
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe("AuthProvider — logout", () => {
  it("clears user and userType from state", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login(baseUser));
    act(() => result.current.logout());

    expect(result.current.user).toBeNull();
    expect(result.current.userType).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("removes user and userType from localStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.login(baseUser));
    act(() => result.current.logout());

    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("userType")).toBeNull();
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
