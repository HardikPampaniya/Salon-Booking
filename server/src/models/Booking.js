import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  idempotencyKey: { type: String, required: true, unique: true },
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  services: [{
    _id: false,
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    pricePaise: { type: Number, required: true, min: 0 },
    // Kept optional for legacy records; arrival bookings do not use duration.
    durationMinutes: { type: Number, min: 1 },
  }],
  servicePricePaise: { type: Number, required: true, min: 0 },
  serviceDurationMinutes: { type: Number, min: 1 },
  advancePaise: { type: Number, required: true, min: 1 },
  // Optional for legacy records; every new booking sets this in the workflow.
  visitDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
  visitHours: {
    open: { type: String, match: /^\d{2}:\d{2}$/ },
    close: { type: String, match: /^\d{2}:\d{2}$/ },
  },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  staffName: { type: String },
  startAt: { type: Date },
  arrivalWindowEndAt: { type: Date },
  endAt: { type: Date },
  status: {
    type: String,
    enum: ['held', 'confirmed', 'cancelled', 'expired', 'manual_resolution'],
    required: true,
    default: 'held',
  },
  holdExpiresAt: { type: Date, default: null },
  salonTimezone: { type: String, required: true },
  customer: {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    gender: { type: String, enum: ['male', 'female'] },
    age: { type: Number, min: 1, max: 120, validate: Number.isInteger },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    whatsappUpdatesOptIn: { type: Boolean, required: true, default: false },
    whatsappUpdatesOptInAt: { type: Date, default: null },
    whatsappConsentVersion: { type: String, default: null, maxlength: 80 },
  },
  managementTokenHash: { type: String, required: true, select: false },
  managementExpiresAt: { type: Date, required: true },
  policyVersion: { type: String, required: true },
}, { timestamps: true });

bookingSchema.index({ staffId: 1, status: 1, startAt: 1, endAt: 1 });
bookingSchema.index({ status: 1, holdExpiresAt: 1 });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
