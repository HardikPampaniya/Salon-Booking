import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { z } from 'zod';
import { buildArrivalTimes, getDailyScheduleWindow } from './booking/availability.js';
import {
  bookingReadiness,
  cancelManagedBooking,
  createBookingHold,
  getManagedBooking,
  reconcileManagedPayment,
  processRazorpayWebhook,
  verifyCheckoutPayment,
} from './booking/workflows.js';
import { salon, serviceMenuGroups, services } from './config/salon.js';
import { ArrivalReservation } from './models/ArrivalReservation.js';
import { Booking } from './models/Booking.js';

const availabilityQuerySchema = z.object({
  serviceId: z.string().min(1).max(80).optional(),
  serviceIds: z.union([
    z.string().min(1).max(80),
    z.array(z.string().min(1).max(80)).min(1).max(20),
  ]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).superRefine((value, context) => {
  const ids = value.serviceIds === undefined ? [] : Array.isArray(value.serviceIds) ? value.serviceIds : [value.serviceIds];
  if (!ids.length && !value.serviceId) context.addIssue({ code: 'custom', message: 'Select at least one service.' });
  if (ids.length && value.serviceId) context.addIssue({ code: 'custom', message: 'Use serviceId or serviceIds, not both.' });
  if (new Set(ids.length ? ids : value.serviceId ? [value.serviceId] : []).size !== (ids.length || (value.serviceId ? 1 : 0))) {
    context.addIssue({ code: 'custom', message: 'A service can only be selected once.' });
  }
}).transform(({ serviceId, serviceIds, date }) => ({
  serviceIds: serviceIds === undefined ? [serviceId] : Array.isArray(serviceIds) ? serviceIds : [serviceIds],
  date,
}));

const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));

function formatClock(minuteOfDay) {
  const hour24 = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

function formatLocalTime(date, timezone) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function salonDateString(date, timezone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 0));
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        formAction: ["'self'", 'https://*.razorpay.com'],
        frameAncestors: ["'self'"],
        frameSrc: ["'self'", 'https://*.razorpay.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://*.razorpay.com'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", 'https://checkout.razorpay.com', 'https://cdn.razorpay.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        connectSrc: ["'self'", 'https://*.razorpay.com'],
      },
    },
  }));

  const configuredOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());
  const allowedOrigins = [...new Set([
    ...configuredOrigins,
    process.env.RENDER_EXTERNAL_URL,
  ].filter(Boolean))];
  app.use(cors({
    origin(origin, callback) {
      let isLocalDevelopmentOrigin = false;
      if (process.env.NODE_ENV === 'development' && origin) {
        try {
          const parsedOrigin = new URL(origin);
          isLocalDevelopmentOrigin = ['http:', 'https:'].includes(parsedOrigin.protocol)
            && ['localhost', '127.0.0.1'].includes(parsedOrigin.hostname);
        } catch {}
      }
      if (!origin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS.'));
    },
  }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.post('/api/webhooks/razorpay', express.raw({ type: 'application/json', limit: '100kb' }), async (request, response, next) => {
    try {
      const result = await processRazorpayWebhook({
        rawBody: request.body,
        signature: request.get('x-razorpay-signature'),
        eventIdHeader: request.get('x-razorpay-event-id'),
      });
      if (result.retryAfter) return response.status(503).json({ error: { code: 'WEBHOOK_PROCESSING', message: 'Webhook is still processing. Retry delivery.' } });
      response.json(result);
    } catch (error) { next(error); }
  });
  app.use(express.json({ limit: '20kb' }));

  app.get('/api/health', async (_request, response) => {
    response.json({
      status: 'ok',
      database: process.env.MONGODB_URI ? 'configured' : 'not_configured',
      payments: process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? 'configured' : 'not_configured',
      booking: await bookingReadiness(),
    });
  });

  app.get('/api/booking/readiness', async (_request, response) => {
    response.json(await bookingReadiness());
  });

  app.get('/api/config', (_request, response) => {
    response.json({ salon });
  });

  app.get('/api/services', (_request, response) => {
    response.json({ services, groups: serviceMenuGroups });
  });

  const bookingWriteLimit = rateLimit({ windowMs: 60_000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false });
  app.post('/api/bookings/holds', bookingWriteLimit, async (request, response, next) => {
    try {
      const result = await createBookingHold({
        rawBody: request.body,
        idempotencyKey: request.get('idempotency-key'),
      });
      response.status(201).json(result);
    } catch (error) { next(error); }
  });

  app.post('/api/bookings/verify-payment', bookingWriteLimit, async (request, response, next) => {
    try { response.json(await verifyCheckoutPayment(request.body)); }
    catch (error) { next(error); }
  });

  app.post('/api/bookings/manage', bookingWriteLimit, async (request, response, next) => {
    try { response.set('Cache-Control', 'no-store').json(await getManagedBooking(request)); }
    catch (error) { next(error); }
  });

  app.post('/api/bookings/reconcile-payment', bookingWriteLimit, async (request, response, next) => {
    try { response.set('Cache-Control', 'no-store').json(await reconcileManagedPayment(request)); }
    catch (error) { next(error); }
  });

  app.post('/api/bookings/cancel', bookingWriteLimit, async (request, response, next) => {
    try { response.set('Cache-Control', 'no-store').json(await cancelManagedBooking(request)); }
    catch (error) { next(error); }
  });

  app.get('/api/availability', async (request, response, next) => {
    const parsed = availabilityQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Provide a serviceId and a date in YYYY-MM-DD format.' } });
    }

    const selectedServices = parsed.data.serviceIds.map((id) => services.find((service) => service.id === id));
    if (selectedServices.some((service) => !service)) {
      return response.status(404).json({ error: { code: 'SERVICE_NOT_FOUND', message: 'One or more selected services are not available.' } });
    }

    try {
      const { date } = parsed.data;
      const schedule = salon.bookingSchedule;
      if (schedule.isPlaceholder || schedule.ownerApproved !== true || selectedServices.some((service) => service.active !== true || service.menuSelectable !== true
        || service.needsConfirmation === true || !Number.isFinite(service.priceRupees) || service.priceRupees <= 0)) {
        return response.status(503).json({ error: { code: 'BOOKING_SETUP_INCOMPLETE', message: 'One or more selected services are not yet approved for online booking.' } });
      }
      const databaseAvailable = mongoose.connection.readyState === 1;
      if (!databaseAvailable && process.env.BOOKING_ENABLED === 'true') {
        return response.status(503).json({ error: { code: 'BOOKING_DATABASE_UNAVAILABLE', message: 'Arrival times cannot be checked right now.' } });
      }
      const now = new Date();
      const today = salonDateString(now, salon.timezone);
      const maxDaysAhead = Number(process.env.MAX_BOOKING_DAYS_AHEAD || 60);
      const daysAhead = (Date.parse(`${date}T00:00:00.000Z`) - Date.parse(`${today}T00:00:00.000Z`)) / 86_400_000;
      if (daysAhead < 0) {
        return response.status(400).json({ error: { code: 'VISIT_DATE_IN_PAST', message: 'Choose today or a future visit date.' } });
      }
      if (!Number.isInteger(maxDaysAhead) || maxDaysAhead < 1 || daysAhead > maxDaysAhead) {
        return response.status(400).json({ error: { code: 'BOOKING_HORIZON_EXCEEDED', message: 'Choose a date within the booking window.' } });
      }
      const dailyWindow = getDailyScheduleWindow({
        date,
        weeklyHours: schedule.weeklyHours,
        timezone: salon.timezone,
      });
      if (dailyWindow.closed) {
        return response.json({
          services: selectedServices.map(({ id, name, priceRupees }) => ({ id, name, priceRupees })),
          date,
          timezone: salon.timezone,
          closed: true,
          visitHours: null,
          slots: [],
          isPlaceholderSchedule: schedule.isPlaceholder,
        });
      }
      const intervalMinutes = schedule.slotIntervalMinutes || 60;
      const availability = buildArrivalTimes({
        date,
        timezone: salon.timezone,
        weeklyHours: schedule.weeklyHours,
        intervalMinutes,
        after: now,
      });
      const [arrivalRows, legacyBookings] = databaseAvailable ? await Promise.all([
        ArrivalReservation.find({
          visitDate: date,
          slotAt: { $gte: dailyWindow.openingAt, $lt: dailyWindow.closingAt },
          $or: [
            { status: 'confirmed' },
            { status: 'held', expiresAt: { $gt: now } },
          ],
        }).select('slotAt').lean(),
        Booking.find({
          visitDate: date,
          startAt: { $gte: dailyWindow.openingAt, $lt: dailyWindow.closingAt },
          $or: [
            { status: { $in: ['confirmed', 'manual_resolution'] } },
            { status: 'held', holdExpiresAt: { $gt: now } },
          ],
        }).select('startAt').lean(),
      ]) : [[], []];
      const occupied = new Set([
        ...arrivalRows.map(({ slotAt }) => new Date(slotAt).toISOString()),
        ...legacyBookings.map(({ startAt }) => new Date(startAt).toISOString()),
      ]);
      const availableSlots = availability.slots
        .filter((slot) => !occupied.has(slot.startAt))
        .map((slot) => {
          const arrivalWindowEndAt = new Date(new Date(slot.startAt).getTime() + intervalMinutes * 60_000);
          return {
            ...slot,
            arrivalWindowEndAt: arrivalWindowEndAt.toISOString(),
            time: `${formatLocalTime(new Date(slot.startAt), salon.timezone)} to ${formatLocalTime(arrivalWindowEndAt, salon.timezone)}`,
          };
        });

      return response.json({
        services: selectedServices.map(({ id, name, priceRupees }) => ({ id, name, priceRupees })),
        date,
        timezone: salon.timezone,
        closed: false,
        visitHours: {
          open: formatClock(dailyWindow.openMinute),
          close: formatClock(dailyWindow.closeMinute),
        },
        intervalMinutes,
        slots: availableSlots,
        isPlaceholderSchedule: schedule.isPlaceholder,
      });
    } catch (error) {
      if (['INVALID_DATE', 'INVALID_SCHEDULE', 'INVALID_LOCAL_TIME'].includes(error.code)) {
        return response.status(400).json({ error: { code: error.code, message: error.message } });
      }
      return next(error);
    }
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: { code: 'NOT_FOUND', message: 'API route not found.' } });
  });

  if (existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false, maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));
    app.use((request, response, next) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') return next();
      response.sendFile(path.join(clientDist, 'index.html'), (error) => {
        if (error) next(error);
      });
    });
  }

  app.use((error, _request, response, _next) => {
    const status = error.code === 11000 ? 409 : (error.status || error.statusCode || 500);
    const message = error.code === 11000
      ? 'That booking request could not be completed. Please choose another time.'
      : status >= 500 ? 'An unexpected server error occurred.' : error.message;
    if (status >= 500) {
      const diagnostic = { status, name: error.name };
      if (process.env.NODE_ENV !== 'production') {
        if (typeof error.code === 'string' || typeof error.code === 'number') diagnostic.code = error.code;
        if (typeof error.cause?.code === 'string' || typeof error.cause?.code === 'number') diagnostic.causeCode = error.cause.code;
        diagnostic.stack = error.stack?.split('\n').slice(1, 6).map((line) => line.trim());
      }
      console.error('request_error', diagnostic);
    }
    response.status(status).json({ error: { code: error.code || 'REQUEST_ERROR', message } });
  });

  return app;
}
