// White Rock Station — unit model (rework)
// A "unit" is anything bookable: a cottage, the primitive tent area, or (future) a kayak.

export type UnitType = 'cottage' | 'tent_site' | 'kayak';

// Display grouping on the Cottages page.
export type UnitGroup = 'Allegheny Shore' | 'Riverview Village';

export interface Unit {
  id: string;
  slug: string; // url-friendly, e.g. "allegheny-shore"
  name: string; // "Allegheny Shore Cottage"
  unitType: UnitType;
  group?: UnitGroup | string;
  active: boolean; // false = hidden / not bookable
  placeholder?: boolean; // true = shown as "coming soon", not bookable (e.g. kayaks)

  // Marketing
  tagline?: string; // short one-liner
  shortDescription?: string;
  description?: string;
  location?: string; // "Riverfront", "Trailfront with direct river views"
  photos?: string[]; // image paths served from /public
  amenities?: string[];

  // Specs (cottages)
  bedrooms?: number; // 0 = studio
  beds?: number;
  baths?: number;
  maxGuests?: number;

  // Pricing (all amounts in USD cents)
  weekdayPriceCents?: number; // Sunday–Thursday night
  weekendPriceCents?: number; // Friday–Saturday night
  cleaningFeeCents?: number;
  taxable?: boolean; // 5% Armstrong County lodging tax applies (cottages true, tent camping false)

  // Primitive camping
  capacity?: number; // total tent sites available in the one primitive area

  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CreateUnitRequest {
  slug?: string;
  name: string;
  unitType: UnitType;
  group?: string;
  active?: boolean;
  placeholder?: boolean;
  tagline?: string;
  shortDescription?: string;
  description?: string;
  location?: string;
  photos?: string[];
  amenities?: string[];
  bedrooms?: number;
  beds?: number;
  baths?: number;
  maxGuests?: number;
  weekdayPriceCents?: number;
  weekendPriceCents?: number;
  cleaningFeeCents?: number;
  taxable?: boolean;
  capacity?: number;
}

export type UpdateUnitRequest = Partial<CreateUnitRequest>;

export function isCottage(unit: Pick<Unit, 'unitType'>): boolean {
  return unit.unitType === 'cottage';
}
