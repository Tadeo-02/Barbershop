import { describe, it, expect } from "vitest";
import {
  passwordRequirements,
  getPasswordMissing,
} from "../../src/FRONT/views/lib/passwordRules.ts";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "../../src/FRONT/views/lib/passwordConstants.ts";

describe("passwordRequirements", () => {
  describe("minLength rule", () => {
    it("fails when password is shorter than the minimum", () => {
      const short = "A1a!".slice(0, PASSWORD_MIN_LENGTH - 1);
      const rule = passwordRequirements.find((r) => r.key === "minLength")!;
      expect(rule.test("Ab1!efg")).toBe(false);
    });

    it("passes when password meets the minimum length", () => {
      const valid = "Abcde12345!".padEnd(PASSWORD_MIN_LENGTH, "x");
      const rule = passwordRequirements.find((r) => r.key === "minLength")!;
      expect(rule.test(valid)).toBe(true);
    });

    it("fails when password exceeds the maximum length", () => {
      const tooLong = "A1a!".repeat(PASSWORD_MAX_LENGTH); // way over max
      const rule = passwordRequirements.find((r) => r.key === "minLength")!;
      expect(rule.test(tooLong)).toBe(false);
    });
  });

  describe("lower rule", () => {
    it("fails when there is no lowercase letter", () => {
      const rule = passwordRequirements.find((r) => r.key === "lower")!;
      expect(rule.test("ABC123!DEF")).toBe(false);
    });

    it("passes when there is at least one lowercase letter", () => {
      const rule = passwordRequirements.find((r) => r.key === "lower")!;
      expect(rule.test("ABCd123!EF")).toBe(true);
    });
  });

  describe("upper rule", () => {
    it("fails when there is no uppercase letter", () => {
      const rule = passwordRequirements.find((r) => r.key === "upper")!;
      expect(rule.test("abc123!def")).toBe(false);
    });

    it("passes when there is at least one uppercase letter", () => {
      const rule = passwordRequirements.find((r) => r.key === "upper")!;
      expect(rule.test("abcD123!ef")).toBe(true);
    });
  });

  describe("number rule", () => {
    it("fails when there is no digit", () => {
      const rule = passwordRequirements.find((r) => r.key === "number")!;
      expect(rule.test("AbcDef!ghi")).toBe(false);
    });

    it("passes when there is at least one digit", () => {
      const rule = passwordRequirements.find((r) => r.key === "number")!;
      expect(rule.test("AbcDef1!gh")).toBe(true);
    });
  });

  describe("symbol rule", () => {
    it("fails when there is no symbol", () => {
      const rule = passwordRequirements.find((r) => r.key === "symbol")!;
      expect(rule.test("AbcDef1234")).toBe(false);
    });

    it("passes when there is at least one symbol", () => {
      const rule = passwordRequirements.find((r) => r.key === "symbol")!;
      expect(rule.test("AbcDef123!")).toBe(true);
    });
  });
});

describe("getPasswordMissing", () => {
  it("returns all missing labels for an empty string", () => {
    const missing = getPasswordMissing("");
    expect(missing).toHaveLength(passwordRequirements.length);
  });

  it("returns no missing labels for a fully valid password", () => {
    const strong = "StrongPass1!";
    const missing = getPasswordMissing(strong);
    expect(missing).toHaveLength(0);
  });

  it("returns only the 'minLength' label for a too-short password with all character types", () => {
    // 5 chars: has upper, lower, number, symbol but too short
    const short = "Aa1!x";
    const missing = getPasswordMissing(short);
    expect(missing).toContain(`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`);
    expect(missing).not.toContain("Una minúscula");
    expect(missing).not.toContain("Una mayúscula");
    expect(missing).not.toContain("Un número");
    expect(missing).not.toContain("Un símbolo");
  });

  it("returns correct missing labels when only lowercase and symbol are present", () => {
    const value = "abcdefghi!"; // 10 chars, lower + symbol, no upper, no number
    const missing = getPasswordMissing(value);
    expect(missing).toContain("Una mayúscula");
    expect(missing).toContain("Un número");
    expect(missing).not.toContain("Una minúscula");
    expect(missing).not.toContain("Un símbolo");
  });
});
