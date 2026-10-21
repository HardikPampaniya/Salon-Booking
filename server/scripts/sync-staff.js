import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { z } from 'zod';
import { services } from '../src/config/salon.js';
import { Staff } from '../src/models/Staff.js';

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const interval = z.object({ open: clock, close: clock }).refine(({ open, close }) => close > open, 'close must be after open');
const timeRange = z.object({ start: clock, end: clock }).refine(({ start, end }) => end > start, 'end must be after start');
const blocked = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), start: clock, end: clock })
  .refine(({ start, end }) => end > start, 'end must be after start');
const employee = z.object({
  staffCode: z.string().trim().min(1).max(40),
  displayName: z.string().trim().min(2).max(80),
  active: z.boolean().default(true),
  serviceIds: z.array(z.string().refine((id) => services.some((service) => service.id === id))).min(1),
  weeklyHours: z.array(z.union([interval, z.null()])).max(7).default([])
    .refine((value) => value.length === 0 || value.length === 7, 'weeklyHours must contain seven weekdays or be empty to use salon hours'),
  breaks: z.array(timeRange).default([]),
  blockedPeriods: z.array(blocked).default([]),
  leaveDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default([]),
});
const rosterSchema = z.array(employee);

const filename = process.argv[2];
const deactivateMissing = process.argv.includes('--deactivate-missing');
if (!filename) {
  console.error('Usage: npm run staff:sync -- path/to/staff.private.json [--deactivate-missing]');
  process.exit(2);
}
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required.');
  process.exit(2);
}

let raw;
try {
  raw = JSON.parse(await readFile(resolve(filename), 'utf8'));
} catch (error) {
  console.error(`Roster file could not be read: ${error.message}`);
  process.exit(2);
}
const parsed = rosterSchema.safeParse(raw);
if (!parsed.success) {
  console.error('Roster validation failed:', parsed.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`).join('; '));
  process.exit(2);
}
const duplicateCodes = parsed.data.map(({ staffCode }) => staffCode.toLowerCase()).filter((code, index, all) => all.indexOf(code) !== index);
if (duplicateCodes.length) {
  console.error(`Duplicate staffCode values: ${[...new Set(duplicateCodes)].join(', ')}`);
  process.exit(2);
}
if (deactivateMissing && parsed.data.length === 0) {
  console.error('Refusing to deactivate every employee from an empty roster file.');
  process.exit(2);
}

try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  await Staff.init();
  for (const record of parsed.data) {
    await Staff.findOneAndUpdate(
      { staffCode: record.staffCode.toLowerCase() },
      { $set: record },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }
  if (deactivateMissing) {
    const codes = parsed.data.map(({ staffCode }) => staffCode.toLowerCase());
    await Staff.updateMany({ staffCode: { $nin: codes } }, { $set: { active: false } });
  }
  console.info(`Staff roster synced: ${parsed.data.length} record(s).`);
} catch (error) {
  console.error(`Roster sync failed: ${error.name}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
