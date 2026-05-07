export const getDiscountCycle = (nombreCategoria: string | null | undefined): number | null => {
  if (!nombreCategoria) return null;
  if (nombreCategoria === "Medium") return 4;
  if (nombreCategoria === "Premium") return 6;
  return null;
};

export const isThisTurnEligible = (countSinceStart: number, cycle: number | null): boolean => {
  if (!cycle || cycle <= 0) return false;
  return ((countSinceStart + 1) % cycle) === 0;
};

export const turnsUntilNextDiscount = (countSinceStart: number, cycle: number | null): number | null => {
  if (!cycle || cycle <= 0) return null;
  return (cycle - ((countSinceStart + 1) % cycle)) % cycle;
};

export const applyDiscountIfEligible = (
  precioBase: number,
  descuentoCorte: number,
  countSinceStart: number,
  cycle: number | null,
): { precioFinal: number; applied: boolean } => {
  if (!cycle || cycle <= 0) return { precioFinal: precioBase, applied: false };
  const eligible = isThisTurnEligible(countSinceStart, cycle);
  if (!eligible) return { precioFinal: precioBase, applied: false };
  const precioFinal = descuentoCorte >= 100 ? 0 : precioBase * (1 - descuentoCorte / 100);
  return { precioFinal, applied: true };
};

export default {
  getDiscountCycle,
  isThisTurnEligible,
  turnsUntilNextDiscount,
  applyDiscountIfEligible,
};
