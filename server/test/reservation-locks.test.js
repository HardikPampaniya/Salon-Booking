import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildReservationSegments } from '../src/booking/reservation-locks.js';

describe('atomic reservation lock buckets', () => {
  it('uses common UTC buckets for overlapping appointment starts on different schedule grids', () => {
    const first = buildReservationSegments('2027-01-04T04:35:00.000Z', '2027-01-04T05:35:00.000Z');
    const second = buildReservationSegments('2027-01-04T04:30:00.000Z', '2027-01-04T05:30:00.000Z');
    assert.ok(first.some((slot) => second.some((other) => slot.getTime() === other.getTime())));
  });

  it('does not lock a following appointment that begins exactly when a service ends', () => {
    const first = buildReservationSegments('2027-01-04T04:30:00.000Z', '2027-01-04T05:30:00.000Z');
    const second = buildReservationSegments('2027-01-04T05:30:00.000Z', '2027-01-04T06:15:00.000Z');
    assert.equal(first.some((slot) => second.some((other) => slot.getTime() === other.getTime())), false);
  });

  it('rejects invalid intervals and bucket sizes', () => {
    assert.throws(() => buildReservationSegments('invalid', '2027-01-04T05:00:00Z'), TypeError);
    assert.throws(() => buildReservationSegments('2027-01-04T04:30:00Z', '2027-01-04T05:00:00Z', 0), TypeError);
  });
});
