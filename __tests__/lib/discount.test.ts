import { describe, it, expect } from "vitest";
import {
  getDiscountCycle,
  isThisTurnEligible,
  turnsUntilNextDiscount,
  applyDiscountIfEligible,
} from "../../src/BACK/lib/discount";

describe("discount helper", () => {
  describe("getDiscountCycle", () => {
    it("returns null for unknown category", () => {
      expect(getDiscountCycle(null)).toBeNull();
      expect(getDiscountCycle("Inicial")).toBeNull();
    });

    it("returns correct cycle for Medium and Premium", () => {
      expect(getDiscountCycle("Medium")).toBe(4);
      expect(getDiscountCycle("Premium")).toBe(6);
    });
  });

  describe("isThisTurnEligible", () => {
    it("returns true when (count+1) is multiple of cycle", () => {
      expect(isThisTurnEligible(3, 4)).toBe(true); // 4th
      expect(isThisTurnEligible(4, 6)).toBe(false);
      expect(isThisTurnEligible(5, 6)).toBe(true); // 6th
      expect(isThisTurnEligible(11, 6)).toBe(true); // 12th
    });
  });

  describe("turnsUntilNextDiscount", () => {
    it("calculates remaining turns correctly", () => {
      expect(turnsUntilNextDiscount(3, 4)).toBe(0);
      expect(turnsUntilNextDiscount(2, 4)).toBe(1);
      expect(turnsUntilNextDiscount(0, 4)).toBe(3);
    });
  });

  describe("applyDiscountIfEligible", () => {
    it("applies discount when eligible and returns applied=true", () => {
      const res = applyDiscountIfEligible(100, 20, 3, 4);
      expect(res.applied).toBe(true);
      expect(res.precioFinal).toBeCloseTo(80);
    });

    it("does not apply discount when not eligible", () => {
      const res = applyDiscountIfEligible(100, 20, 2, 4);
      expect(res.applied).toBe(false);
      expect(res.precioFinal).toBe(100);
    });

    it("handles 100% discount as zero price", () => {
      const res = applyDiscountIfEligible(150, 100, 3, 4);
      expect(res.applied).toBe(true);
      expect(res.precioFinal).toBe(0);
    });
  });
});
