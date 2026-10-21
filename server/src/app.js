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
  processRazorpayWebhook,
  verifyCheckoutPayment,
} from './booking/workflows.js';
import { salon, services } from './config/salon.js';
import { ArrivalReservation } from './models/ArrivalReservation.js';

const availabilityQuerySchema = z.object({
  serviceId: z.string().min(1).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));

function formatClock(minuteOfDay) {
  const hour24 = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
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
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
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
    response.json({ services });
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

  app.post('/api/bookings/cancel', bookingWriteLimit, async (request, response, next) => {
    try { response.set('Cache-Control', 'no-store').json(await cancelManagedBooking(request)); }
    catch (error) { next(error); }
  });

  app.get('/api/availability', async (request, response, next) => {
    const parsed = availabilityQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Provide a serviceId and a date in YYYY-MM-DD format.' } });
    }

    const service = services.find(({ id }) => id === parsed.data.serviceId);
    if (!service) {
      return response.status(404).json({ error: { code: 'SERVICE_NOT_FOUND', message: 'That service is not available.' } });
    }

    try {
      const { date } = parsed.data;
      const schedule = salon.bookingSchedule;
      if (schedule.isPlaceholder || service.bookable !== true || service.needsConfirmation === true
        || !Number.isFinite(service.priceRupees) || service.priceRupees <= 0) {
        return response.status(503).json({ error: { code: 'BOOKING_SETUP_INCOMPLETE', message: 'This service is not yet approved for online booking.' } });
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
      const arrivals = buildArrivalTimes({
        date,
        timezone: salon.timezone,
        weeklyHours: schedule.weeklyHours,
        intervalMinutes: schedule.slotIntervalMinutes,
        after: now,
      });
      const occupied = mongoose.connection.readyState === 1
        ? await ArrivalReservation.find({
          visitDate: date,
          $or: [
            { status: 'confirmed' },
            { status: 'held', expiresAt: { $gt: now } },
          ],
        }).select('slotAt').lean()
        : [];
      const occupiedTimes = new Set(occupied.map(({ slotAt }) => new Date(slotAt).getTime()));
      const availableArrivalTimes = arrivals.slots.filter(({ startAt }) => !occupiedTimes.has(new Date(startAt).getTime()));

      return response.json({
        service: { id: service.id, name: service.name, priceRupees: service.priceRupees },
        date,
        timezone: salon.timezone,
        closed: dailyWindow.closed,
        visitHours: dailyWindow.closed ? null : {
          open: formatClock(dailyWindow.openMinute),
          close: formatClock(dailyWindow.closeMinute),
        },
        slots: availableArrivalTimes,
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
    if (status >= 500) console.error('request_error', { status, name: error.name });
    response.status(status).json({ error: { code: error.code || 'REQUEST_ERROR', message } });
  });

  return app;
}
