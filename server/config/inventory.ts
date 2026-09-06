export const INVENTORY = {
  small_cabin: 8,
  large_cabin: 4,
  campsite: 40,
  marina_slip: 20,
} as const;

export type UnitType = keyof typeof INVENTORY;


