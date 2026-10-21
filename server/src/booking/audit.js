import { BookingAuditEvent } from '../models/BookingAuditEvent.js';

export async function recordAuditEvent({ eventKey, bookingId, entityType, entityId, eventType, fromState = null, toState = null, actor = 'system', session }) {
  await BookingAuditEvent.updateOne(
    { eventKey },
    { $setOnInsert: { eventKey, bookingId, entityType, entityId: String(entityId), eventType, fromState, toState, actor } },
    { upsert: true, ...(session ? { session } : {}) },
  );
}
