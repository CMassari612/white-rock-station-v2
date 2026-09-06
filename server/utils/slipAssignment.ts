import { Booking } from '../types/booking-request';
import { Unit } from '../types/unit';

function parseNumberFromName(name: string): number | null {
  const m = name.match(/(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  // [start, end) ranges
  return aStart < bEnd && bStart < aEnd;
}

export interface SlipAssignment {
  assignedUnitId: string;
  assignedUnitNumber: number;
  assignedUnitLabel: string; // e.g. "Slip 16"
}

function getDailySlipPool(allUnits: Unit[]) {
  // Pool: Slip 16-20 reserved for DAILY bookings
  return allUnits
    .filter(u => u.active && u.unitType === 'marina_slip')
    .filter(u => {
      const n = parseNumberFromName(u.name);
      return n !== null && n >= 16 && n <= 20;
    })
    .sort((a, b) => (parseNumberFromName(a.name)! - parseNumberFromName(b.name)!));
}

function getSeasonSlipPool(allUnits: Unit[]) {
  // Pool: Slip 1-15 reserved for SEASON leases
  return allUnits
    .filter(u => u.active && u.unitType === 'marina_slip')
    .filter(u => {
      const n = parseNumberFromName(u.name);
      return n !== null && n >= 1 && n <= 15;
    })
    .sort((a, b) => (parseNumberFromName(a.name)! - parseNumberFromName(b.name)!));
}

export function findDailySlipAssignment(booking: Booking, allBookings: Booking[], allUnits: Unit[]): SlipAssignment | null {
  if (booking.unitType !== 'marina_slip') return null;
  if (!(booking.bookingType === 'marina_daily' || booking.bookingType === 'marina')) return null;

  const pool = getDailySlipPool(allUnits);
  const assignedConfirmed = allBookings.filter(
    b =>
      b.status === 'confirmed' &&
      b.unitType === 'marina_slip' &&
      (b.bookingType === 'marina_daily' || b.bookingType === 'marina') &&
      !!b.assignedUnitId
  );

  const requested = typeof booking.requestedSlipNumber === 'number' ? booking.requestedSlipNumber : null;
  if (requested !== null) {
    const requestedUnit = pool.find(u => (parseNumberFromName(u.name) ?? -1) === requested) || null;
    if (!requestedUnit) return null;

    const conflict = assignedConfirmed.some(b => {
      if (b.assignedUnitId !== requestedUnit.id) return false;
      return overlaps(b.startDate, b.endDate, booking.startDate, booking.endDate);
    });
    if (conflict) return null;

    const n = parseNumberFromName(requestedUnit.name) ?? 0;
    return { assignedUnitId: requestedUnit.id, assignedUnitNumber: n, assignedUnitLabel: `Slip ${n}` };
  }

  for (const unit of pool) {
    const conflict = assignedConfirmed.some(b => {
      if (b.assignedUnitId !== unit.id) return false;
      return overlaps(b.startDate, b.endDate, booking.startDate, booking.endDate);
    });
    if (!conflict) {
      const n = parseNumberFromName(unit.name) ?? 0;
      return { assignedUnitId: unit.id, assignedUnitNumber: n, assignedUnitLabel: `Slip ${n}` };
    }
  }
  return null;
}

export function findSeasonSlipAssignment(booking: Booking, allBookings: Booking[], allUnits: Unit[]): SlipAssignment | null {
  if (booking.unitType !== 'marina_slip') return null;
  if (booking.bookingType !== 'season_slip') return null;

  const pool = getSeasonSlipPool(allUnits);
  const assignedConfirmed = allBookings.filter(
    b => b.status === 'confirmed' && b.bookingType === 'season_slip' && !!b.assignedUnitId
  );
  const used = new Set(assignedConfirmed.map(b => b.assignedUnitId));

  const requested = typeof booking.requestedSlipNumber === 'number' ? booking.requestedSlipNumber : null;
  if (requested !== null) {
    const requestedUnit = pool.find(u => (parseNumberFromName(u.name) ?? -1) === requested) || null;
    if (!requestedUnit) return null;
    if (used.has(requestedUnit.id)) return null;
    const n = parseNumberFromName(requestedUnit.name) ?? 0;
    return { assignedUnitId: requestedUnit.id, assignedUnitNumber: n, assignedUnitLabel: `Slip ${n}` };
  }

  for (const unit of pool) {
    if (used.has(unit.id)) continue;
    const n = parseNumberFromName(unit.name) ?? 0;
    return { assignedUnitId: unit.id, assignedUnitNumber: n, assignedUnitLabel: `Slip ${n}` };
  }

  return null;
}

