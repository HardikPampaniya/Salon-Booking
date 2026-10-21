import mongoose from 'mongoose';

const slotReservationSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  slotAt: { type: Date, required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  status: { type: String, enum: ['held', 'confirmed'], required: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

// This compound unique index allows parallel bookings for different employees,
// while reserving every 15-minute segment for at most one employee appointment.
slotReservationSchema.index({ staffId: 1, slotAt: 1 }, { unique: true });
slotReservationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: 'held' } },
);
slotReservationSchema.index({ bookingId: 1 });

export const SlotReservation = mongoose.models.SlotReservation
  || mongoose.model('SlotReservation', slotReservationSchema);
