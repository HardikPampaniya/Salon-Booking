import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CANCELLATION_CUTOFF_MINUTES, isCustomerCancellationAllowed } from '../src/booking/cancellation-policy.js';

describe('customer cancellation window', () => {
  const now = new Date('2026-10-13T12:00:00.000Z');

  it('allows cancellation exactly one hour before the service', () => {
    const startAt = new Date(now.getTime() + CANCELLATION_CUTOFF_MINUTES * 60_000);
    assert.equal(isCustomerCancellationAllowed(startAt, now), true);
  });

  it('closes cancellation inside the final hour', () => {
    const startAt = new Date(now.getTime() + CANCELLATION_CUTOFF_MINUTES * 60_000 - 1);
    assert.equal(isCustomerCancellationAllowed(startAt, now), false);
  });

  it('rejects appointments that have already started', () => {
    const startAt = new Date(now.getTime() - 1);
    assert.equal(isCustomerCancellationAllowed(startAt, now), false);
  });
});
