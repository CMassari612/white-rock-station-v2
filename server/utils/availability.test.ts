/**
 * Tests for availability.ts
 * Run with: tsx server/utils/availability.test.ts
 */

import { computeAvailability } from './availability';
import { Booking, BookingStatus } from '../types/booking-request';
import { Unit } from '../types/unit';

// Mock data helpers
function createUnit(id: string, unitType: string): Unit {
  return {
    id,
    name: `Unit ${id}`,
    unitType: unitType as any,
    category: unitType.includes('cabin') ? 'cabin' : unitType.includes('campsite') ? 'campsite' : 'marina',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createBooking(id: string, unitType: string, startDate: string, endDate: string, status: BookingStatus): Booking {
  return {
    id,
    name: 'Test User',
    email: 'test@example.com',
    phone: '555-1234',
    bookingType: unitType.includes('marina') ? 'marina' : 'cabin',
    unitType: unitType as any,
    startDate,
    endDate,
    guests: 1,
    status,
    createdAt: new Date().toISOString(),
  };
}

// Test cases
async function runTests() {
  console.log('Running availability tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: start=2026-07-15 end=2026-07-16 returns exactly ["2026-07-15"]
  console.log('Test 1: Date range should start at start date');
  try {
    const units: Unit[] = Array.from({ length: 20 }, (_, i) => createUnit(`unit-${i}`, 'marina_slip'));
    const bookings: Booking[] = [];
    
    const result = computeAvailability('marina_slip', '2026-07-15', '2026-07-16', bookings, units);
    
    if (result.length === 1 && result[0].date === '2026-07-15') {
      console.log('✅ PASS: Returns exactly ["2026-07-15"]');
      passed++;
    } else {
      console.log(`❌ FAIL: Expected [{date: "2026-07-15"}], got:`, JSON.stringify(result, null, 2));
      failed++;
    }
  } catch (error: any) {
    console.log(`❌ FAIL: Error: ${error.message}`);
    failed++;
  }

  console.log('');

  // Test 2: A confirmed marina booking for 07-15 reduces availability from 20 to 19
  console.log('Test 2: Confirmed booking reduces availability');
  try {
    const units: Unit[] = Array.from({ length: 20 }, (_, i) => createUnit(`unit-${i}`, 'marina_slip'));
    const bookings: Booking[] = [
      createBooking('booking-1', 'marina_slip', '2026-07-15', '2026-07-16', 'confirmed'),
    ];
    
    const result = computeAvailability('marina_slip', '2026-07-15', '2026-07-16', bookings, units);
    
    if (result.length === 1 && result[0].date === '2026-07-15' && result[0].available === 19) {
      console.log('✅ PASS: Confirmed booking reduces availability from 20 to 19');
      passed++;
    } else {
      console.log(`❌ FAIL: Expected [{date: "2026-07-15", available: 19}], got:`, JSON.stringify(result, null, 2));
      failed++;
    }
  } catch (error: any) {
    console.log(`❌ FAIL: Error: ${error.message}`);
    failed++;
  }

  console.log('');

  // Test 3: Pending/expired bookings do not affect availability
  console.log('Test 3: Pending/expired bookings do not affect availability');
  try {
    const units: Unit[] = Array.from({ length: 20 }, (_, i) => createUnit(`unit-${i}`, 'marina_slip'));
    const bookings: Booking[] = [
      createBooking('booking-1', 'marina_slip', '2026-07-15', '2026-07-16', 'pending'),
      createBooking('booking-2', 'marina_slip', '2026-07-15', '2026-07-16', 'expired'),
    ];
    
    const result = computeAvailability('marina_slip', '2026-07-15', '2026-07-16', bookings, units);
    
    if (result.length === 1 && result[0].date === '2026-07-15' && result[0].available === 20) {
      console.log('✅ PASS: Pending/expired bookings do not reduce availability');
      passed++;
    } else {
      console.log(`❌ FAIL: Expected [{date: "2026-07-15", available: 20}], got:`, JSON.stringify(result, null, 2));
      failed++;
    }
  } catch (error: any) {
    console.log(`❌ FAIL: Error: ${error.message}`);
    failed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Tests: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
