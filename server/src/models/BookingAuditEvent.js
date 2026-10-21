import mongoose from 'mongoose';

const bookingAuditEventSchema = new mongoose.Schema({
  eventKey: { type: String, required: true, unique: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  entityType: { type: String, enum: ['booking', 'payment', 'refund'], required: true },
  entityId: { type: String, required: true },
  eventType: { type: String, required: true, maxlength: 80 },
  fromState: { type: String, default: null, maxlength: 40 },
  toState: { type: String, default: null, maxlength: 40 },
  actor: { type: String, enum: ['system', 'customer', 'payment_provider'], required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

bookingAuditEventSchema.index({ bookingId: 1, createdAt: -1 });
bookingAuditEventSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const BookingAuditEvent = mongoose.models.BookingAuditEvent
  || mongoose.model('BookingAuditEvent', bookingAuditEventSchema);
