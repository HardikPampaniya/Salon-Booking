import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  dedupeKey: { type: String, required: true, unique: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  text: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sending', 'accepted', 'mocked', 'manual_review'], required: true, default: 'pending' },
  attempts: { type: Number, required: true, default: 0 },
  nextAttemptAt: { type: Date, required: true, default: Date.now },
  acceptedAt: { type: Date, default: null },
  providerMessageId: { type: String, default: null },
  mockedAt: { type: Date, default: null },
  lastErrorCode: { type: String, default: null },
}, { timestamps: true });

notificationSchema.index({ status: 1, nextAttemptAt: 1 });

export const Notification = mongoose.models.Notification
  || mongoose.model('Notification', notificationSchema);
