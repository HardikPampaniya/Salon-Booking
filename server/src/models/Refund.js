import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  idempotencyKey: { type: String, required: true, unique: true },
  providerRefundId: { type: String, default: undefined, unique: true, sparse: true },
  amountPaise: { type: Number, required: true, min: 1 },
  reason: { type: String, enum: ['customer_cancellation', 'late_payment', 'manual'], required: true },
  status: {
    type: String,
    enum: ['pending', 'submitting', 'processing', 'processed', 'failed', 'manual_review'],
    required: true,
    default: 'pending',
  },
  providerStatus: { type: String, default: null },
  lastErrorCode: { type: String, default: null },
  attemptedAt: { type: Date, default: null },
  processedAt: { type: Date, default: null },
}, { timestamps: true });

refundSchema.index({ bookingId: 1, status: 1 });

export const Refund = mongoose.models.Refund || mongoose.model('Refund', refundSchema);
