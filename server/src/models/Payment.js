import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  provider: { type: String, enum: ['razorpay'], required: true, default: 'razorpay' },
  providerOrderId: { type: String, default: undefined, unique: true, sparse: true },
  providerReceipt: { type: String, required: true, unique: true },
  providerPaymentId: { type: String, default: undefined, unique: true, sparse: true },
  amountPaise: { type: Number, required: true, min: 1 },
  capturedAmountPaise: { type: Number, default: null, min: 0 },
  currency: { type: String, required: true, default: 'INR' },
  status: {
    type: String,
    enum: ['order_pending', 'order_creating', 'created', 'authorized', 'captured', 'failed', 'refund_pending', 'refunded', 'refund_failed', 'manual_review'],
    required: true,
    default: 'order_pending',
  },
  capturedAt: { type: Date, default: null },
  failureCode: { type: String, default: null },
}, { timestamps: true });

paymentSchema.index({ status: 1, updatedAt: 1 });

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
