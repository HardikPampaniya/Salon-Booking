import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildAvailabilitySlots, buildStaffAvailability } from '../src/booking/availability.js';

const weeklyHours = [
  null,
  { open: '10:00', close: '19:00' },
  { open: '10:00', close: '19:00' },
  { open: '10:00', close: '19:00' },
  { open: '10:00', close: '19:00' },
  { open: '10:00', close: '19:00' },
  { open: '10:00', close: '19:00' },
];

function build(overrides = {}) {
  return buildAvailabilitySlots({
    date: '2027-01-04',
    timezone: 'Asia/Kolkata',
    weeklyHours,
    serviceDurationMinutes: 60,
    ...overrides,
  });
}

describe('salon-local availability calculation', () => {
  it('converts salon wall-clock hours to the correct UTC instants', () => {
    const result = build();
    assert.equal(result.openingAt, '2027-01-04T04:30:00.000Z');
    assert.equal(result.slots[0].time, '10:00 am');
    assert.equal(result.slots[0].endAt, '2027-01-04T05:30:00.000Z');
  });

  it('keeps every service inside salon opening hours', () => {
    const { slots, closingAt } = build();
    assert.ok(slots.length > 0);
    assert.equal(slots.at(-1).endAt, closingAt);
    assert.ok(slots.every((slot) => new Date(slot.endAt) <= new Date(closingAt)));
  });

  it('skips slots that overlap breaks, blocked periods, or existing bookings', () => {
    const result = build({
      breaks: [{ start: '13:00', end: '14:00' }],
      blockedPeriods: [{ date: '2027-01-04', start: '15:00', end: '16:00' }],
      occupiedWindows: [{ startAt: '2027-01-04T06:45:00.000Z', endAt: '2027-01-04T07:45:00.000Z' }],
    });
    const overlaps = (slot, start, end) => new Date(slot.startAt) < new Date(end) && new Date(slot.endAt) > new Date(start);
    assert.ok(result.slots.every((slot) => !overlaps(slot, '2027-01-04T07:30:00.000Z', '2027-01-04T08:30:00.000Z')));
    assert.ok(result.slots.every((slot) => !overlaps(slot, '2027-01-04T09:30:00.000Z', '2027-01-04T10:30:00.000Z')));
    assert.ok(result.slots.every((slot) => !overlaps(slot, '2027-01-04T06:45:00.000Z', '2027-01-04T07:45:00.000Z')));
  });

  it('returns no slots for a closed day', () => {
    const result = build({ date: '2027-01-03' });
    assert.deepEqual(result.slots, []);
    assert.equal(result.openingAt, null);
  });

  it('rejects impossible dates, invalid durations, and invalid schedule times', () => {
    assert.throws(() => build({ date: '2027-02-30' }), { code: 'INVALID_DATE' });
    assert.throws(() => build({ serviceDurationMinutes: 0 }), { code: 'INVALID_SERVICE_DURATION' });
    assert.throws(() => build({ weeklyHours: [null, { open: '18:00', close: '10:00' }] }), { code: 'INVALID_SCHEDULE' });
  });

  it('allows simultaneous appointments for different eligible employees', () => {
    const result = buildStaffAvailability({
      date: '2027-01-04',
      timezone: 'Asia/Kolkata',
      salonWeeklyHours: weeklyHours,
      staffMembers: [
        { id: 'staff-1', displayName: 'Stylist 1', active: true, serviceIds: ['cut-and-style'] },
        { id: 'staff-2', displayName: 'Stylist 2', active: true, serviceIds: ['cut-and-style'] },
        { id: 'staff-3', displayName: 'Facialist', active: true, serviceIds: ['signature-facial'] },
      ],
      serviceId: 'cut-and-style',
      serviceDurationMinutes: 60,
    });
    const firstTime = result.slots.find((slot) => slot.time === '10:00 am');
    assert.equal(firstTime.availableStaffCount, 2);
    assert.equal(firstTime.staffOptions.length, 2);
  });

  it('blocks an occupied employee while preserving another qualified employee at that time', () => {
    const result = buildStaffAvailability({
      date: '2027-01-04',
      timezone: 'Asia/Kolkata',
      salonWeeklyHours: weeklyHours,
      staffMembers: [
        { id: 'staff-1', displayName: 'Stylist 1', active: true, serviceIds: ['cut-and-style'] },
        { id: 'staff-2', displayName: 'Stylist 2', active: true, serviceIds: ['cut-and-style'] },
      ],
      serviceId: 'cut-and-style',
      serviceDurationMinutes: 60,
      occupiedBookings: [{ staffId: 'staff-1', startAt: '2027-01-04T04:30:00.000Z', endAt: '2027-01-04T05:30:00.000Z' }],
    });
    const firstTime = result.slots.find((slot) => slot.time === '10:00 am');
    assert.equal(firstTime.availableStaffCount, 1);
    assert.deepEqual(firstTime.staffOptions.map(({ id }) => id), ['staff-2']);
  });

  it('honours employee schedules, leave, and a requested employee', () => {
    const result = buildStaffAvailability({
      date: '2027-01-04',
      timezone: 'Asia/Kolkata',
      salonWeeklyHours: weeklyHours,
      staffMembers: [
        { id: 'staff-1', displayName: 'Stylist 1', active: true, serviceIds: ['cut-and-style'], leaveDates: ['2027-01-04'] },
        { id: 'staff-2', displayName: 'Stylist 2', active: true, serviceIds: ['cut-and-style'], weeklyHours: [null, { open: '11:00', close: '17:00' }] },
      ],
      serviceId: 'cut-and-style',
      serviceDurationMinutes: 60,
      requestedStaffId: 'staff-2',
    });
    assert.equal(result.slots[0].time, '11:00 am');
    assert.deepEqual(result.slots[0].staffOptions.map(({ id }) => id), ['staff-2']);
  });

  it('keeps employee hours inside the salon opening window', () => {
    const result = buildStaffAvailability({
      date: '2027-01-04',
      timezone: 'Asia/Kolkata',
      salonWeeklyHours: weeklyHours,
      staffMembers: [
        { id: 'staff-1', displayName: 'Stylist 1', active: true, serviceIds: ['cut-and-style'], weeklyHours: [null, { open: '09:00', close: '20:00' }] },
      ],
      serviceId: 'cut-and-style',
      serviceDurationMinutes: 60,
    });
    assert.equal(result.slots[0].time, '10:00 am');
    assert.equal(result.slots.at(-1).time, '6:00 pm');
  });
});
