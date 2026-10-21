import mongoose from 'mongoose';

const clockRangeSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, required: true },
}, { _id: false });

const staffSchema = new mongoose.Schema({
  staffCode: { type: String, required: true, trim: true, lowercase: true, unique: true },
  displayName: { type: String, required: true, trim: true, maxlength: 80 },
  active: { type: Boolean, default: true, index: true },
  serviceIds: { type: [String], required: true, index: true },
  weeklyHours: { type: [mongoose.Schema.Types.Mixed], default: [] },
  breaks: { type: [clockRangeSchema], default: [] },
  blockedPeriods: [{ date: String, start: String, end: String }],
  leaveDates: { type: [String], default: [] },
}, { timestamps: true });

staffSchema.index({ active: 1, serviceIds: 1 });

export const Staff = mongoose.models.Staff || mongoose.model('Staff', staffSchema);
