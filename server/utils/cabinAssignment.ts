import { Booking } from '../types/booking-request';
import { Unit, UnitType } from '../types/unit';

type CabinUnitType = Extract<UnitType, 'small_cabin' | 'large_cabin'>;

function isCabinUnitType(unitType: UnitType): unitType is CabinUnitType {
  return unitType === 'small_cabin' || unitType === 'large_cabin';
}

function unitTypeLabel(unitType: CabinUnitType): string {
  return unitType === 'small_cabin' ? 'Small Cabin' : 'Large Cabin';
}

function parseUnitNumberFromName(name: string): number | null {
  const m = name.match(/(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function addDaysYMD(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(n => Number(n));
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  // Dates are YYYY-MM-DD; treat as [start, end) ranges.
  return aStart < bEnd && bStart < aEnd;
}

function bookingSortKey(b: Booking): number {
  const ts = b.paidAt || b.createdAt;
  const t = new Date(ts).getTime();
  return Number.isFinite(t) ? t : 0;
}

export interface CabinAssignment {
  assignedUnitId: string;
  assignedUnitNumber: number;
  assignedUnitLabel: string;
}

/**
 * Assign cabin units (physical cabins) to confirmed bookings.
 *
 * Rules:
 * - Only for unitType small_cabin / large_cabin
 * - Only assign for status === 'confirmed'
 * - First-come-first-serve by paidAt (fallback createdAt)
 * - Stable/idempotent: if booking already has assignedUnitId, we keep it
 *
 * Returns a new bookings array (with assignments filled where possible).
 */
export function assignCabinsForConfirmedBookings(
  allBookings: Booking[],
  allUnits: Unit[],
  unitType: UnitType
): { updatedBookings: Booking[]; assignmentsByBookingId: Map<string, CabinAssignment> } {
  const assignmentsByBookingId = new Map<string, CabinAssignment>();
  if (!isCabinUnitType(unitType)) {
    return { updatedBookings: allBookings, assignmentsByBookingId };
  }

  const cabinUnits = allUnits
    .filter(u => u.active && u.unitType === unitType)
    .slice()
    .sort((a, b) => {
      const na = parseUnitNumberFromName(a.name);
      const nb = parseUnitNumberFromName(b.name);
      if (na !== null && nb !== null) return na - nb;
      if (na !== null) return -1;
      if (nb !== null) return 1;
      return a.name.localeCompare(b.name);
    });

  const confirmedCabinBookings = allBookings
    .filter(b => b.unitType === unitType && b.status === 'confirmed')
    .slice()
    .sort((a, b) => bookingSortKey(a) - bookingSortKey(b) || a.id.localeCompare(b.id));

  // occupancy: unitId -> list of assigned booking ranges
  const occupancy = new Map<string, Array<{ startDate: string; endDate: string; bookingId: string }>>();

  const updatedBookings = allBookings.slice();
  const byId = new Map(updatedBookings.map(b => [b.id, b] as const));

  function recordOccupancy(unitId: string, booking: Booking) {
    const list = occupancy.get(unitId) || [];
    // Cleaning buffer day rule (cabins only):
    // Treat the day after the last night (i.e. endDate in our [start, end) model) as blocked.
    // We achieve this by extending the occupied interval by +1 day.
    const endWithCleaningBuffer = addDaysYMD(booking.endDate, 1);
    list.push({ startDate: booking.startDate, endDate: endWithCleaningBuffer, bookingId: booking.id });
    occupancy.set(unitId, list);
  }

  // First, record existing assignments (stable)
  for (const b of confirmedCabinBookings) {
    if (!b.assignedUnitId) continue;
    recordOccupancy(b.assignedUnitId, b);
    if (b.assignedUnitNumber && b.assignedUnitLabel) {
      assignmentsByBookingId.set(b.id, {
        assignedUnitId: b.assignedUnitId,
        assignedUnitNumber: b.assignedUnitNumber,
        assignedUnitLabel: b.assignedUnitLabel,
      });
    }
  }

  // Then, assign missing ones in chronological order
  for (const b of confirmedCabinBookings) {
    const target = byId.get(b.id);
    if (!target) continue;

    if (target.assignedUnitId) {
      // Keep stable assignment
      if (target.assignedUnitNumber && target.assignedUnitLabel) {
        assignmentsByBookingId.set(target.id, {
          assignedUnitId: target.assignedUnitId,
          assignedUnitNumber: target.assignedUnitNumber,
          assignedUnitLabel: target.assignedUnitLabel,
        });
      }
      continue;
    }

    let chosen: Unit | null = null;
    for (const unit of cabinUnits) {
      const occ = occupancy.get(unit.id) || [];
      const conflict = occ.some(o => overlaps(o.startDate, o.endDate, target.startDate, target.endDate));
      if (!conflict) {
        chosen = unit;
        break;
      }
    }

    if (!chosen) {
      // No physical unit available. Do NOT assign here.
      continue;
    }

    const n = parseUnitNumberFromName(chosen.name) ?? 0;
    target.assignedUnitId = chosen.id;
    target.assignedUnitNumber = n;
    target.assignedUnitLabel = `${unitTypeLabel(unitType)} #${n}`;

    recordOccupancy(chosen.id, target);
    assignmentsByBookingId.set(target.id, {
      assignedUnitId: chosen.id,
      assignedUnitNumber: n,
      assignedUnitLabel: target.assignedUnitLabel,
    });
  }

  return { updatedBookings, assignmentsByBookingId };
}

/**
 * Find an available physical cabin unit for a booking (based on existing assigned confirmed bookings).
 * Does not mutate bookings; just computes the best available unit assignment.
 */
export function findCabinAssignmentForBooking(
  booking: Booking,
  allBookings: Booking[],
  allUnits: Unit[]
): CabinAssignment | null {
  if (!isCabinUnitType(booking.unitType)) return null;

  const cabinUnits = allUnits
    .filter(u => u.active && u.unitType === booking.unitType)
    .slice()
    .sort((a, b) => {
      const na = parseUnitNumberFromName(a.name);
      const nb = parseUnitNumberFromName(b.name);
      if (na !== null && nb !== null) return na - nb;
      if (na !== null) return -1;
      if (nb !== null) return 1;
      return a.name.localeCompare(b.name);
    });

  const assignedConfirmed = allBookings.filter(
    b =>
      b.status === 'confirmed' &&
      b.unitType === booking.unitType &&
      !!b.assignedUnitId
  );

  // New booking's stay also blocks its cleaning day; extend its interval by +1 day for conflict checks.
  const bookingEndWithCleaningBuffer = addDaysYMD(booking.endDate, 1);

  for (const unit of cabinUnits) {
    const conflict = assignedConfirmed.some(b => {
      if (b.assignedUnitId !== unit.id) return false;
      const existingEndWithCleaningBuffer = addDaysYMD(b.endDate, 1);
      return overlaps(b.startDate, existingEndWithCleaningBuffer, booking.startDate, bookingEndWithCleaningBuffer);
    });
    if (!conflict) {
      const n = parseUnitNumberFromName(unit.name) ?? 0;
      return {
        assignedUnitId: unit.id,
        assignedUnitNumber: n,
        assignedUnitLabel: `${unitTypeLabel(booking.unitType)} #${n}`,
      };
    }
  }

  return null;
}

