import mongoose from 'mongoose';

const arrivalReservationSchema = new mongoose.Schema({
  visitDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  slotAt: { type: Date, required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  status: { type: String, enum: ['held', 'confirmed'], required: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

arrivalReservationSchema.index({ visitDate: 1, slotAt: 1 }, { unique: true });
arrivalReservationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: 'held' } },
);
arrivalReservationSchema.index({ bookingId: 1 });

export const ArrivalReservation = mongoose.models.ArrivalReservation
  || mongoose.model('ArrivalReservation', arrivalReservationSchema);
