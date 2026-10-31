import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { isServiceAvailableOnDate, isServiceCurrentlyAvailable, salon, services } from '../config/salon.js';
import { Booking } from '../models/Booking.js';
import { ArrivalReservation } from '../models/ArrivalReservation.js';
import { Payment } from '../models/Payment.js';
import { Refund } from '../models/Refund.js';
import { SlotReservation } from '../models/SlotReservation.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { getDailyScheduleWindow } from './availability.js';
import { recordAuditEvent } from './audit.js';
import { isCustomerCancellationAllowed, isVisitDateCancellationAllowed } from './cancellation-policy.js';
import { queueBookingEvent } from './notifications.js';
import { notificationConfiguration } from './notification-mode.js';
import {
  createRazorpayOrder,
  createRazorpayRefund,
  fetchRazorpayOrderPayments,
  fetchRazorpayPayment,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from './razorpay.js';

const HOLD_MINUTES = 10;
const ADVANCE_PAISE = 10_000;
const POLICY_VERSION = process.env.BOOKING_POLICY_VERSION || 'draft-v1';
const PRIVACY_POLICY_VERSION = process.env.PRIVACY_POLICY_VERSION || 'draft-v1';
const MAX_BOOKING_DAYS_AHEAD = Number(process.env.MAX_BOOKING_DAYS_AHEAD || 60);

const rawHoldBodySchema = z.object({
  serviceId: z.string().min(1).max(80).optional(),
  serviceIds: z.array(z.string().min(1).max(80)).min(1).max(20).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startAt: z.string().datetime({ offset: true }),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/),
  email: z.string().trim().toLowerCase().email().max(254),
  gender: z.enum(['male', 'female']),
  age: z.number().int().min(1).max(120),
  managementToken: z.string().min(32).max(200),
  policyAccepted: z.literal(true),
});

export const holdBodySchema = rawHoldBodySchema.superRefine((data, context) => {
  const ids = data.serviceIds ?? (data.serviceId ? [data.serviceId] : []);
  if (!ids.length) context.addIssue({ code: 'custom', message: 'Select at least one service.' });
  if (new Set(ids).size !== ids.length) context.addIssue({ code: 'custom', message: 'A service can only be selected once.' });
}).transform((data) => ({ ...data, serviceIds: data.serviceIds ?? [data.serviceId] }));

const checkoutBodySchema = z.object({
  orderId: z.string().min(4).max(100),
  paymentId: z.string().min(4).max(100),
  signature: z.string().regex(/^[a-f0-9]{64}$/i),
});

function fail(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

async function queueBookingEventSafely(booking, eventType, options) {
  try { await queueBookingEvent(booking, eventType, options); }
  catch (error) { console.error('booking_notification_queue_failed', { name: error.name }); }
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function tokenMatches(token, hash) {
  if (!token || !hash) return false;
  const expected = Buffer.from(hashToken(token), 'hex');
  const actual = Buffer.from(hash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function makeReference() {
  return `SAL-${randomBytes(6).toString('hex').toUpperCase()}`;
}

function bookingHorizonIsValid() {
  return Number.isInteger(MAX_BOOKING_DAYS_AHEAD) && MAX_BOOKING_DAYS_AHEAD >= 1 && MAX_BOOKING_DAYS_AHEAD <= 365;
}

function bookingReady() {
  return process.env.BOOKING_ENABLED === 'true'
    && mongoose.connection.readyState === 1
    && process.env.MONGODB_TRANSACTIONS_SUPPORTED === 'true'
    && salon.bookingSchedule.ownerApproved === true
    && POLICY_VERSION !== 'draft-v1'
    && PRIVACY_POLICY_VERSION !== 'draft-v1'
    && razorpayModeMatches()
    && Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET)
    && bookingHorizonIsValid();
}

function paymentReady() {
  return mongoose.connection.readyState === 1
    && process.env.MONGODB_TRANSACTIONS_SUPPORTED === 'true'
    && razorpayModeMatches()
    && Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function razorpayModeMatches() {
  const mode = process.env.RAZORPAY_MODE || 'test';
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  return (mode === 'test' && keyId.startsWith('rzp_test_'))
    || (mode === 'live' && keyId.startsWith('rzp_live_'));
}

export async function bookingReadiness() {
  const issues = [];
  if (process.env.BOOKING_ENABLED !== 'true') issues.push('booking_disabled');
  if (mongoose.connection.readyState !== 1) issues.push('database_unavailable');
  if (mongoose.connection.readyState === 1 && process.env.MONGODB_TRANSACTIONS_SUPPORTED !== 'true') issues.push('mongodb_replica_set_required');
  if (salon.bookingSchedule.ownerApproved !== true) issues.push('salon_schedule_not_approved');
  if (POLICY_VERSION === 'draft-v1') issues.push('booking_policy_not_approved');
  if (PRIVACY_POLICY_VERSION === 'draft-v1') issues.push('privacy_policy_not_approved');
  const notifications = notificationConfiguration();
  if (!notifications.configured || (notifications.mode !== 'resend' && !notifications.mockAllowed)) {
    issues.push(notifications.issue || 'email_notifications_required');
  }
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || !process.env.RAZORPAY_WEBHOOK_SECRET) issues.push('razorpay_not_configured');
  else if (!razorpayModeMatches()) issues.push('razorpay_mode_mismatch');
  if (!bookingHorizonIsValid()) issues.push('booking_horizon_invalid');
  const eligibleServices = services.filter((service) => service.menuSelectable === true && isServiceCurrentlyAvailable(service));
  if (salon.bookingSchedule.isPlaceholder || eligibleServices.length === 0) issues.push('salon_configuration_incomplete');
  return {
    enabled: bookingReady() && issues.length === 0,
    issues,
  };
}

function salonDateString(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: salon.timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function dateOrdinal(date) {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function cancellationAllowed(booking, now = new Date()) {
  if (booking.startAt) return isCustomerCancellationAllowed(booking.startAt, now);
  if (booking.visitDate) {
    return isVisitDateCancellationAllowed(booking.visitDate, {
      timezone: booking.salonTimezone,
      weeklyHours: salon.bookingSchedule.weeklyHours,
    }, now);
  }
  return false;
}

function buildResponsePayload(booking, payment, managementToken) {
  return {
    booking: {
      reference: booking.reference,
      status: booking.status,
      services: booking.services?.length ? booking.services : [{ serviceId: booking.serviceId, serviceName: booking.serviceName, pricePaise: booking.servicePricePaise }],
      serviceName: booking.serviceName,
      servicePricePaise: booking.servicePricePaise,
      serviceDurationMinutes: booking.serviceDurationMinutes,
      staffName: booking.staffName,
      advancePaise: booking.advancePaise,
      visitDate: booking.visitDate,
      visitHours: booking.visitHours,
      startAt: booking.startAt,
      arrivalWindowEndAt: booking.arrivalWindowEndAt,
      endAt: booking.endAt,
      salonTimezone: booking.salonTimezone,
      holdExpiresAt: booking.holdExpiresAt,
      customer: {
        name: booking.customer.name,
        phone: booking.customer.phone,
        email: booking.customer.email,
        gender: booking.customer.gender,
        age: booking.customer.age,
      },
    },
    payment: payment?.providerOrderId ? {
      provider: 'razorpay',
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: payment.providerOrderId,
      amountPaise: payment.amountPaise,
      currency: payment.currency,
      status: payment.status,
    } : null,
    ...(managementToken ? { managementToken } : {}),
  };
}

async function saveHold({ data, idempotencyKey }) {
  const selectedServices = data.serviceIds.map((id) => services.find((service) => service.id === id));
  if (selectedServices.some((service) => !service)) throw fail(404, 'SERVICE_NOT_FOUND', 'One or more selected services are no longer available.');
  const dateLimitedOffer = selectedServices.find((service) => service.offerValidThrough && data.date > service.offerValidThrough);
  if (dateLimitedOffer) throw fail(400, 'OFFER_EXPIRED', `This Diwali offer is available for arrival dates through ${dateLimitedOffer.offerValidThrough}. Choose an earlier date or remove it from your cart.`);
  if (selectedServices.some((service) => !isServiceAvailableOnDate(service, data.date) || service.menuSelectable !== true || service.needsConfirmation === true
    || !Number.isFinite(service.priceRupees) || service.priceRupees <= 0) || salon.bookingSchedule.isPlaceholder) {
    throw fail(503, 'SALON_CONFIGURATION_INCOMPLETE', 'One or more selected services are not yet approved for online booking.');
  }
  const advancePaise = ADVANCE_PAISE;
  const serviceSnapshots = selectedServices.map((service) => ({
    serviceId: service.id,
    serviceName: service.name,
    pricePaise: Math.round(service.priceRupees * 100),
  }));
  const servicePricePaise = serviceSnapshots.reduce((total, service) => total + service.pricePaise, 0);
  const primaryService = selectedServices[0];
  const serviceName = selectedServices.map((service) => service.name).join(' + ');

  const now = new Date();
  const dailyWindow = getDailyScheduleWindow({
    date: data.date,
    weeklyHours: salon.bookingSchedule.weeklyHours,
    timezone: salon.timezone,
  });
  if (dailyWindow.closed) throw fail(400, 'SALON_CLOSED', 'The studio is closed on that date. Please choose another visit date.');
  const startAtDate = new Date(data.startAt);
  if (!Number.isFinite(startAtDate.getTime()) || salonDateString(startAtDate) !== data.date) {
    throw fail(400, 'INVALID_ARRIVAL_TIME', 'Choose an arrival time on the selected visit date.');
  }
  if (startAtDate <= now) throw fail(400, 'ARRIVAL_TIME_IN_PAST', 'Choose a future arrival time.');
  if (startAtDate < dailyWindow.openingAt || startAtDate >= dailyWindow.closingAt) {
    throw fail(400, 'OUTSIDE_OPENING_HOURS', 'Choose an arrival time during salon opening hours.');
  }
  const localTime = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: salon.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(startAtDate).map(({ type, value }) => [type, value]));
  const minuteOfDay = Number(localTime.hour) * 60 + Number(localTime.minute);
  const interval = salon.bookingSchedule.slotIntervalMinutes;
  if (!Number.isInteger(interval) || interval < 5 || interval > 60 || (minuteOfDay - dailyWindow.openMinute) % interval !== 0) {
    throw fail(400, 'INVALID_ARRIVAL_TIME', 'Choose one of the available arrival times.');
  }
  const arrivalWindowEndAt = new Date(startAtDate.getTime() + interval * 60_000);
  if (arrivalWindowEndAt > dailyWindow.closingAt) {
    throw fail(400, 'OUTSIDE_OPENING_HOURS', 'Choose a full one-hour arrival window during salon opening hours.');
  }
  const today = salonDateString(now);
  if (data.date < today) throw fail(400, 'VISIT_DATE_IN_PAST', 'Choose today or a future visit date.');
  const daysAhead = Math.round((dateOrdinal(data.date) - dateOrdinal(today)) / 86_400_000);
  if (daysAhead > MAX_BOOKING_DAYS_AHEAD) throw fail(400, 'BOOKING_HORIZON_EXCEEDED', 'Choose a date within the booking window.');
  const todayWindow = getDailyScheduleWindow({
    date: today,
    weeklyHours: salon.bookingSchedule.weeklyHours,
    timezone: salon.timezone,
  });
  if (data.date === today && !todayWindow.closed && now >= todayWindow.closingAt) {
    throw fail(400, 'SALON_CLOSED_TODAY', 'The studio is closed for today. Please choose tomorrow or a later visit date.');
  }
  const managementExpiresAt = new Date(now.getTime() + 180 * 86_400_000);
  const holdExpiresAt = new Date(now.getTime() + HOLD_MINUTES * 60_000);
  const reference = makeReference();
  let created = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const existing = await Booking.findOne({ idempotencyKey }).session(session);
        if (existing) {
          if (!tokenMatches(data.managementToken, existing.managementTokenHash)) {
            throw fail(409, 'IDEMPOTENCY_KEY_REUSED', 'This request key was already used. Start a new booking request.');
          }
          const existingServiceIds = existing.services?.length ? existing.services.map((service) => service.serviceId) : [existing.serviceId];
          const sameRequest = JSON.stringify(existingServiceIds) === JSON.stringify(data.serviceIds)
            && existing.startAt?.getTime() === startAtDate.getTime()
            && existing.customer.name === data.name
            && existing.customer.phone === data.phone
            && existing.customer.email === data.email
            && existing.customer.gender === data.gender
            && existing.customer.age === data.age;
          if (!sameRequest) throw fail(409, 'IDEMPOTENCY_KEY_REUSED', 'Booking details changed. Start a new booking request.');
          const existingPayment = await Payment.findOne({ bookingId: existing._id }).session(session);
          created = { booking: existing, payment: existingPayment, isNew: false };
          return;
        }

        await ArrivalReservation.deleteMany({
          visitDate: data.date,
          slotAt: startAtDate,
          status: 'held',
          expiresAt: { $lte: now },
        }).session(session);
        const activeArrival = await ArrivalReservation.findOne({
          visitDate: data.date,
          slotAt: startAtDate,
          $or: [
            { status: 'confirmed' },
            { status: 'held', expiresAt: { $gt: now } },
          ],
        }).session(session).lean();
        const legacyBooking = await Booking.findOne({
          visitDate: data.date,
          startAt: startAtDate,
          $or: [
            { status: { $in: ['confirmed', 'manual_resolution'] } },
            { status: 'held', holdExpiresAt: { $gt: now } },
          ],
        }).session(session).lean();
        if (activeArrival || legacyBooking) {
          throw fail(409, 'ARRIVAL_TIME_UNAVAILABLE', 'That arrival time was just taken. Please choose another time.');
        }

        const booking = await Booking.create([{
          reference,
          idempotencyKey,
          serviceId: primaryService.id,
          serviceName,
          services: serviceSnapshots,
          servicePricePaise,
          advancePaise,
          visitDate: data.date,
          visitHours: {
            open: salon.bookingSchedule.weeklyHours[dailyWindow.dateParts.calendarDate.getUTCDay()].open,
            close: salon.bookingSchedule.weeklyHours[dailyWindow.dateParts.calendarDate.getUTCDay()].close,
          },
          startAt: startAtDate,
          arrivalWindowEndAt,
          status: 'held',
          holdExpiresAt,
          salonTimezone: salon.timezone,
          customer: {
            name: data.name,
            phone: data.phone,
            email: data.email,
            gender: data.gender,
            age: data.age,
          },
          managementTokenHash: hashToken(data.managementToken),
          managementExpiresAt,
          policyVersion: POLICY_VERSION,
        }], { session });
        const bookingDoc = booking[0];
        const paymentDocs = await Payment.create([{
          bookingId: bookingDoc._id,
          provider: 'razorpay',
          providerReceipt: bookingDoc.reference,
          amountPaise: advancePaise,
          currency: 'INR',
          status: 'order_pending',
        }], { session });
        await ArrivalReservation.create([{
          visitDate: data.date,
          slotAt: startAtDate,
          bookingId: bookingDoc._id,
          status: 'held',
          expiresAt: holdExpiresAt,
        }], { session });
        await recordAuditEvent({
          eventKey: `booking:${bookingDoc._id}:hold_created`, bookingId: bookingDoc._id,
          entityType: 'booking', entityId: bookingDoc._id, eventType: 'hold_created',
          fromState: null, toState: 'held', actor: 'system', session,
        });
        created = { booking: bookingDoc, payment: paymentDocs[0], isNew: true };
      }, { readPreference: 'primary' });
      break;
    } catch (error) {
      if (error.code === 11000 && attempt < 5) continue;
      throw error;
    } finally {
      await session.endSession();
    }
  }

  if (!created) throw fail(409, 'BOOKING_RETRY_REQUIRED', 'This visit request is being prepared. Please retry shortly.');
  return created;
}

async function ensureProviderOrder(booking, payment) {
  if (payment.providerOrderId) return payment;
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: 'order_pending' },
    { $set: { status: 'order_creating' } },
    { new: true },
  );
  if (!claimed) {
    const current = await Payment.findById(payment._id);
    if (current?.providerOrderId) return current;
    throw fail(503, 'PAYMENT_ORDER_PENDING', 'Your booking hold is being prepared. Please retry shortly.');
  }
  try {
    const order = await createRazorpayOrder({
      amountPaise: claimed.amountPaise,
      receipt: booking.reference,
      notes: { booking_reference: booking.reference, booking_id: String(booking._id) },
    });
    return await Payment.findOneAndUpdate(
      { _id: claimed._id, status: 'order_creating' },
      { $set: { providerOrderId: order.id, status: 'created' } },
      { new: true },
    );
  } catch (error) {
    await Payment.updateOne(
      { _id: claimed._id, status: 'order_creating' },
      { $set: { status: 'manual_review', failureCode: error.code || 'RAZORPAY_ORDER_UNKNOWN' } },
    );
    console.error('razorpay_order_setup_failed', { code: error.code || 'RAZORPAY_ORDER_UNKNOWN' });
    try {
      await queueBookingEvent(booking, 'payment_manual_review', { note: 'Payment setup could not be verified. The booking hold will expire without confirming an appointment.' });
    } catch (notificationError) {
      console.error('booking_notification_queue_failed', { name: notificationError.name });
    }
    throw fail(503, 'PAYMENT_ORDER_UNAVAILABLE', 'Payment setup could not be verified. The booking hold will expire automatically.');
  }
}

export async function createBookingHold({ rawBody, idempotencyKey }) {
  if (!(await bookingReadiness()).enabled) throw fail(503, 'BOOKING_NOT_READY', 'Online booking is not available yet.');
  const parsed = holdBodySchema.safeParse(rawBody);
  if (!parsed.success) throw fail(400, 'VALIDATION_ERROR', 'Check the booking details and consent, then try again.');
  if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 100) {
    throw fail(400, 'IDEMPOTENCY_KEY_REQUIRED', 'A valid booking request key is required.');
  }

  const { booking, payment } = await saveHold({ data: parsed.data, idempotencyKey });
  if (booking.status === 'confirmed') return buildResponsePayload(booking, payment, parsed.data.managementToken);
  if (booking.status !== 'held' || booking.holdExpiresAt <= new Date()) {
    throw fail(409, 'HOLD_EXPIRED', 'This booking hold is no longer active. Choose an available time again.');
  }
  const providerPayment = await ensureProviderOrder(booking, payment);
  return buildResponsePayload(booking, providerPayment, parsed.data.managementToken);
}

async function makeRefundForCapturedPayment({ booking, payment, reason, session }) {
  const key = `${reason}:${payment._id}`;
  let refund = await Refund.findOne({ idempotencyKey: key }).session(session);
  if (!refund) {
    [refund] = await Refund.create([{
      bookingId: booking._id,
      paymentId: payment._id,
      idempotencyKey: key,
      amountPaise: payment.amountPaise,
      reason,
      status: 'pending',
    }], { session });
  }
  await Payment.updateOne({ _id: payment._id }, { $set: { status: 'refund_pending' } }, { session });
  await recordAuditEvent({
    eventKey: `refund:${refund._id}:requested`, bookingId: booking._id,
    entityType: 'refund', entityId: refund._id, eventType: 'refund_requested',
    fromState: null, toState: 'pending', actor: reason === 'customer_cancellation' ? 'customer' : 'system', session,
  });
  return refund;
}

async function submitRefund(refundId) {
  const refund = await Refund.findOneAndUpdate(
    { _id: refundId, status: 'pending' },
    { $set: { status: 'submitting', attemptedAt: new Date() } },
    { new: true },
  );
  if (!refund) return;
  await recordAuditEvent({
    eventKey: `refund:${refund._id}:submitting`, bookingId: refund.bookingId,
    entityType: 'refund', entityId: refund._id, eventType: 'refund_submission_started',
    fromState: 'pending', toState: 'submitting', actor: 'system',
  });
  const [booking, payment] = await Promise.all([
    Booking.findById(refund.bookingId),
    Payment.findById(refund.paymentId),
  ]);
  if (!booking || !payment?.providerPaymentId) {
    await Refund.updateOne({ _id: refund._id, status: 'submitting' }, { $set: { status: 'manual_review', lastErrorCode: 'PAYMENT_REFERENCE_MISSING' } });
    if (payment) await Payment.updateOne({ _id: payment._id }, { $set: { status: 'manual_review' } });
    if (booking) await queueBookingEventSafely(booking, 'refund_manual_review', { note: 'The payment reference is missing. The salon must reconcile this refund in Razorpay.' });
    return;
  }

  try {
    const response = await createRazorpayRefund({
      paymentId: payment.providerPaymentId,
      amountPaise: refund.amountPaise,
      bookingReference: booking.reference,
      refundKey: refund.idempotencyKey,
    });
    if (typeof response.id !== 'string' || !response.id) {
      const error = new Error('Razorpay did not return a refund identifier.');
      error.code = 'RAZORPAY_REFUND_ID_MISSING';
      throw error;
    }
    const processed = response.status === 'processed';
    const failed = response.status === 'failed';
    await Refund.updateOne(
      { _id: refund._id, status: 'submitting' },
      { $set: {
        providerRefundId: response.id,
        providerStatus: response.status || 'pending',
        status: processed ? 'processed' : failed ? 'failed' : 'processing',
        processedAt: processed ? new Date() : null,
      } },
    );
    await recordAuditEvent({
      eventKey: `refund:${refund._id}:provider_${response.status || 'processing'}`, bookingId: refund.bookingId,
      entityType: 'refund', entityId: refund._id, eventType: 'refund_provider_response',
      fromState: 'submitting', toState: processed ? 'processed' : failed ? 'failed' : 'processing', actor: 'payment_provider',
    });
    await Payment.updateOne({ _id: payment._id }, { $set: { status: processed ? 'refunded' : failed ? 'refund_failed' : 'refund_pending' } });
    if (processed) await queueBookingEventSafely(booking, 'refund_processed', { note: 'Refund status confirmed by the payment provider.' });
    if (failed) await queueBookingEventSafely(booking, 'refund_manual_review', { note: 'The provider reported a refund failure. The salon will review it.' });
  } catch (error) {
    // An uncertain network result must not be retried automatically: the provider may have accepted it.
    const uncertain = !error.status || error.status >= 500;
    const status = uncertain ? 'manual_review' : 'failed';
    await Refund.updateOne(
      { _id: refund._id, status: 'submitting' },
      { $set: { status, lastErrorCode: error.code || 'RAZORPAY_REFUND_UNKNOWN' } },
    );
    await recordAuditEvent({
      eventKey: `refund:${refund._id}:submission_${status}`, bookingId: refund.bookingId,
      entityType: 'refund', entityId: refund._id, eventType: 'refund_submission_result',
      fromState: 'submitting', toState: status, actor: 'system',
    });
    await Payment.updateOne({ _id: payment._id }, { $set: { status: uncertain ? 'manual_review' : 'refund_failed' } });
    console.error('razorpay_refund_submission_failed', { code: error.code || 'RAZORPAY_REFUND_UNKNOWN', status });
    await queueBookingEventSafely(booking, 'refund_manual_review', {
      note: uncertain
        ? 'The provider response was uncertain. Verify the refund in the Razorpay Dashboard before retrying.'
        : 'The provider rejected the refund request. The salon will review it before taking further action.',
    });
  }
}

export async function verifyCheckoutPayment(rawBody) {
  if (!paymentReady()) throw fail(503, 'PAYMENT_VERIFICATION_UNAVAILABLE', 'Payment verification is temporarily unavailable.');
  const parsed = checkoutBodySchema.safeParse(rawBody);
  if (!parsed.success) throw fail(400, 'PAYMENT_SIGNATURE_INVALID', 'Payment could not be verified.');
  const payment = await Payment.findOne({ providerOrderId: parsed.data.orderId });
  if (!payment) throw fail(404, 'PAYMENT_NOT_FOUND', 'This payment does not match a booking.');
  if (!verifyCheckoutSignature({
    orderId: payment.providerOrderId,
    paymentId: parsed.data.paymentId,
    signature: parsed.data.signature,
  })) throw fail(400, 'PAYMENT_SIGNATURE_INVALID', 'Payment could not be verified.');
  const providerPayment = await fetchRazorpayPayment(parsed.data.paymentId);
  if (providerPayment.order_id !== payment.providerOrderId) throw fail(400, 'PAYMENT_DETAILS_MISMATCH', 'Payment details do not match this booking.');
  if (providerPayment.amount !== payment.amountPaise || providerPayment.currency !== payment.currency) {
    if (providerPayment.status === 'captured') await handleCapturedPayment(providerPayment);
    throw fail(400, 'PAYMENT_DETAILS_MISMATCH', 'Payment details do not match this booking.');
  }

  if (providerPayment.status === 'captured') {
    await handleCapturedPayment(providerPayment);
  } else if (providerPayment.status === 'authorized') {
    await Payment.updateOne(
      { _id: payment._id, status: { $nin: ['captured', 'refund_pending', 'refunded', 'refund_failed', 'manual_review'] } },
      { $set: { providerPaymentId: providerPayment.id, status: 'authorized' } },
    );
  } else if (providerPayment.status === 'failed') {
    await Payment.updateOne(
      { _id: payment._id, status: { $nin: ['captured', 'refund_pending', 'refunded', 'refund_failed', 'manual_review'] } },
      { $set: { providerPaymentId: providerPayment.id, status: 'failed', failureCode: providerPayment.error_code || null } },
    );
  }

  const booking = await Booking.findById(payment.bookingId).lean();
  const currentPayment = await Payment.findById(payment._id).lean();
  const refund = await Refund.findOne({ bookingId: booking._id }).sort({ createdAt: -1 }).lean();
  return {
    booking: {
      reference: booking.reference,
      status: booking.status,
      services: booking.services?.length ? booking.services : [{ serviceId: booking.serviceId, serviceName: booking.serviceName, pricePaise: booking.servicePricePaise }],
      serviceName: booking.serviceName,
      servicePricePaise: booking.servicePricePaise,
      serviceDurationMinutes: booking.serviceDurationMinutes,
      staffName: booking.staffName,
      advancePaise: booking.advancePaise,
      visitDate: booking.visitDate,
      visitHours: booking.visitHours,
      startAt: booking.startAt,
      arrivalWindowEndAt: booking.arrivalWindowEndAt,
      salonTimezone: booking.salonTimezone,
      cancellationAllowed: ['held', 'confirmed'].includes(booking.status) && cancellationAllowed(booking),
    },
    payment: { status: currentPayment.status, amountPaise: currentPayment.amountPaise },
    refund: refund ? { status: refund.status, amountPaise: refund.amountPaise } : null,
  };
}

export async function reconcileManagedPayment(request) {
  if (!paymentReady()) throw fail(503, 'PAYMENT_VERIFICATION_UNAVAILABLE', 'Payment verification is temporarily unavailable.');
  const booking = await findManagedBooking(request);
  const payment = await Payment.findOne({ bookingId: booking._id }).lean();
  if (!payment?.providerOrderId) throw fail(404, 'PAYMENT_NOT_FOUND', 'This booking has no payment order to check.');
  if (['captured', 'refund_pending', 'refunded', 'refund_failed', 'manual_review'].includes(payment.status)) {
    return getManagedBooking(request);
  }

  const result = await fetchRazorpayOrderPayments(payment.providerOrderId);
  const orderPayments = (result.items || []).filter((item) => item.order_id === payment.providerOrderId);
  const capturedPayment = orderPayments.find((item) => item.status === 'captured');
  if (capturedPayment) await handleCapturedPayment(capturedPayment);
  else {
    const unresolvedPayment = orderPayments.find((item) => item.status === 'authorized')
      || orderPayments.find((item) => item.status === 'failed');
    const currentPayment = unresolvedPayment
      ? { ...unresolvedPayment, status: unresolvedPayment.currency === payment.currency && unresolvedPayment.amount === payment.amountPaise ? unresolvedPayment.status : 'manual_review' }
      : null;
    if (currentPayment) {
      await Payment.updateOne(
        { _id: payment._id, status: { $nin: ['captured', 'refund_pending', 'refunded', 'refund_failed', 'manual_review'] } },
        { $set: { providerPaymentId: currentPayment.id, status: currentPayment.status } },
      );
    }
  }
  return getManagedBooking(request);
}

export async function handleCapturedPayment(providerPayment) {
  const session = await mongoose.startSession();
  let refundToSubmit = null;
  let bookingForNotice = null;
  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({ providerOrderId: providerPayment.order_id }).session(session);
      if (!payment) return;
      const booking = await Booking.findById(payment.bookingId).session(session);
      if (!booking) return;
      bookingForNotice = booking;
      if (providerPayment.amount !== payment.amountPaise || providerPayment.currency !== payment.currency) {
        const priorPaymentStatus = payment.status;
        payment.providerPaymentId = providerPayment.id;
        payment.capturedAmountPaise = providerPayment.amount;
        payment.capturedAt ||= new Date();
        payment.status = 'manual_review';
        payment.failureCode = 'CAPTURE_AMOUNT_MISMATCH';
        await payment.save({ session });
        await recordAuditEvent({
          eventKey: `payment:${payment._id}:amount_mismatch`, bookingId: booking._id,
          entityType: 'payment', entityId: payment._id, eventType: 'payment_manual_review',
          fromState: priorPaymentStatus, toState: 'manual_review', actor: 'payment_provider', session,
        });
        await queueBookingEvent(booking, 'payment_manual_review', {
          session,
          note: 'The provider amount did not match the booking advance. Verify the payment and any refund.',
        });
        return;
      }
      const wasCaptured = Boolean(payment.capturedAt)
        || ['captured', 'refund_pending', 'refunded', 'refund_failed'].includes(payment.status);
      payment.providerPaymentId = providerPayment.id;
      payment.capturedAmountPaise = providerPayment.amount;
      payment.capturedAt ||= new Date();
      if (wasCaptured) return;
      if (booking.status === 'held' && booking.holdExpiresAt > new Date()) {
        const priorBookingStatus = booking.status;
        const priorPaymentStatus = payment.status;
        booking.status = 'confirmed';
        booking.holdExpiresAt = null;
        await booking.save({ session });
        payment.status = 'captured';
        await payment.save({ session });
        await recordAuditEvent({
          eventKey: `booking:${booking._id}:confirmed`, bookingId: booking._id,
          entityType: 'booking', entityId: booking._id, eventType: 'booking_confirmed',
          fromState: priorBookingStatus, toState: 'confirmed', actor: 'payment_provider', session,
        });
        await recordAuditEvent({
          eventKey: `payment:${payment._id}:captured`, bookingId: booking._id,
          entityType: 'payment', entityId: payment._id, eventType: 'payment_captured',
          fromState: priorPaymentStatus, toState: 'captured', actor: 'payment_provider', session,
        });
        await SlotReservation.updateMany({ bookingId: booking._id, status: 'held' }, { $set: { status: 'confirmed', expiresAt: null } }, { session });
        await ArrivalReservation.updateMany({ bookingId: booking._id, status: 'held' }, { $set: { status: 'confirmed', expiresAt: null } }, { session });
        await queueBookingEvent(booking, 'confirmed', { session });
      } else {
        if (booking.status === 'held') {
          const priorBookingStatus = booking.status;
          booking.status = 'expired';
          booking.holdExpiresAt = null;
          await booking.save({ session });
          await recordAuditEvent({
            eventKey: `booking:${booking._id}:expired`, bookingId: booking._id,
            entityType: 'booking', entityId: booking._id, eventType: 'hold_expired_before_capture',
            fromState: priorBookingStatus, toState: 'expired', actor: 'system', session,
          });
          await SlotReservation.deleteMany({ bookingId: booking._id }, { session });
          await ArrivalReservation.deleteMany({ bookingId: booking._id }, { session });
        }
        const priorPaymentStatus = payment.status;
        payment.status = 'refund_pending';
        await payment.save({ session });
        await recordAuditEvent({
          eventKey: `payment:${payment._id}:late_capture`, bookingId: booking._id,
          entityType: 'payment', entityId: payment._id, eventType: 'late_capture_refund_required',
          fromState: priorPaymentStatus, toState: 'refund_pending', actor: 'payment_provider', session,
        });
        refundToSubmit = await makeRefundForCapturedPayment({ booking, payment, reason: 'late_payment', session });
      }
    }, { readPreference: 'primary' });
  } finally {
    await session.endSession();
  }
  if (refundToSubmit) await submitRefund(refundToSubmit._id);
  return bookingForNotice;
}

export async function handlePaymentFailure(providerPayment) {
  const payment = await Payment.findOne({ providerOrderId: providerPayment.order_id });
  if (!payment || ['captured', 'refund_pending', 'refunded', 'refund_failed', 'manual_review'].includes(payment.status)) return;
  const priorStatus = payment.status;
  const result = await Payment.updateOne(
    { _id: payment._id, status: { $nin: ['captured', 'refund_pending', 'refunded', 'refund_failed', 'manual_review'] } },
    { $set: { providerPaymentId: providerPayment.id, status: 'failed', failureCode: providerPayment.error_code || null } },
  );
  if (result.modifiedCount) await recordAuditEvent({
    eventKey: `payment:${payment._id}:failed`, bookingId: payment.bookingId,
    entityType: 'payment', entityId: payment._id, eventType: 'payment_failed',
    fromState: priorStatus, toState: 'failed', actor: 'payment_provider',
  });
}

async function handleRefundEvent(refundEntity, finalStatus) {
  let refund = refundEntity.id ? await Refund.findOne({ providerRefundId: refundEntity.id }) : null;
  if (!refund && refundEntity.notes?.refund_key) refund = await Refund.findOne({ idempotencyKey: refundEntity.notes.refund_key });
  if (!refund) return;
  const final = finalStatus === 'processed' ? 'processed' : 'failed';
  const priorStatus = refund.status;
  await Refund.updateOne(
    { _id: refund._id },
    { $set: { providerRefundId: refundEntity.id || refund.providerRefundId, providerStatus: finalStatus, status: final, processedAt: final === 'processed' ? new Date() : null } },
  );
  await recordAuditEvent({
    eventKey: `refund:${refund._id}:webhook_${final}`, bookingId: refund.bookingId,
    entityType: 'refund', entityId: refund._id, eventType: 'refund_webhook_status',
    fromState: priorStatus, toState: final, actor: 'payment_provider',
  });
  const payment = await Payment.findById(refund.paymentId);
  const booking = await Booking.findById(refund.bookingId);
  if (payment) await Payment.updateOne({ _id: payment._id }, { $set: { status: final === 'processed' ? 'refunded' : 'refund_failed' } });
  if (booking && final === 'processed') await queueBookingEvent(booking, 'refund_processed', { note: 'Refund status confirmed by the payment provider.' });
  if (booking && final === 'failed') await queueBookingEvent(booking, 'refund_manual_review', { note: 'The payment provider reported a refund failure. The salon will review it.' });
}

export async function processRazorpayWebhook({ rawBody, signature, eventIdHeader }) {
  if (mongoose.connection.readyState !== 1) throw fail(503, 'BOOKING_DATABASE_UNAVAILABLE', 'Webhook processing is temporarily unavailable.');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const valid = secret && rawBody && signature;
  if (!valid || !verifyWebhookSignature({ rawBody, signature, secret })) {
    throw fail(400, 'WEBHOOK_SIGNATURE_INVALID', 'Webhook signature is invalid.');
  }
  let event;
  try { event = JSON.parse(rawBody.toString('utf8')); } catch { throw fail(400, 'WEBHOOK_BODY_INVALID', 'Webhook body is invalid.'); }
  const eventId = eventIdHeader?.slice(0, 200) || createHash('sha256').update(rawBody).digest('hex');
  const eventType = String(event.event || 'unknown').slice(0, 100);
  try {
    await WebhookEvent.create({ eventId, eventType, status: 'processing' });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await WebhookEvent.findOne({ eventId });
    if (existing?.status === 'processed') return { received: true, duplicate: true, retryAfter: false };
    const staleBefore = new Date(Date.now() - 2 * 60_000);
    if (existing?.status === 'processing' && existing.updatedAt > staleBefore) {
      return { received: true, duplicate: true, retryAfter: true };
    }
    const retry = await WebhookEvent.updateOne({
      eventId,
      $or: [
        { status: 'failed' },
        { status: 'processing', updatedAt: { $lte: staleBefore } },
      ],
    }, { $set: { status: 'processing', eventType, receivedAt: new Date() } });
    if (!retry.modifiedCount) return { received: true, duplicate: true, retryAfter: true };
  }

  try {
    const paymentEntity = event.payload?.payment?.entity;
    const refundEntity = event.payload?.refund?.entity;
    if (eventType === 'payment.captured' && paymentEntity) await handleCapturedPayment(paymentEntity);
    else if (eventType === 'payment.failed' && paymentEntity) await handlePaymentFailure(paymentEntity);
    else if (eventType === 'payment.authorized' && paymentEntity) {
      await Payment.updateOne(
        { providerOrderId: paymentEntity.order_id, status: { $nin: ['captured', 'refund_pending', 'refunded', 'refund_failed', 'manual_review'] } },
        { $set: { providerPaymentId: paymentEntity.id, status: 'authorized' } },
      );
    } else if (eventType === 'refund.processed' && refundEntity) await handleRefundEvent(refundEntity, 'processed');
    else if (eventType === 'refund.failed' && refundEntity) await handleRefundEvent(refundEntity, 'failed');
    await WebhookEvent.updateOne({ eventId }, { $set: { status: 'processed', processedAt: new Date() } });
    return { received: true, duplicate: false };
  } catch (error) {
    await WebhookEvent.updateOne({ eventId }, { $set: { status: 'failed' } });
    throw error;
  }
}

function authorizationFrom(request) {
  const value = request.get('authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}

async function findManagedBooking(request) {
  const reference = String(request.body?.reference || '').trim().toUpperCase();
  const token = authorizationFrom(request) || request.body?.managementToken;
  if (!reference || typeof token !== 'string') throw fail(404, 'BOOKING_NOT_FOUND', 'Booking was not found.');
  const booking = await Booking.findOne({ reference }).select('+managementTokenHash');
  if (!booking || booking.managementExpiresAt < new Date() || !tokenMatches(token, booking.managementTokenHash)) {
    throw fail(404, 'BOOKING_NOT_FOUND', 'Booking was not found.');
  }
  return booking;
}

export async function getManagedBooking(request) {
  if (mongoose.connection.readyState !== 1) throw fail(503, 'BOOKING_DATABASE_UNAVAILABLE', 'Booking management is temporarily unavailable.');
  const booking = await findManagedBooking(request);
  const payment = await Payment.findOne({ bookingId: booking._id }).lean();
  const refund = await Refund.findOne({ bookingId: booking._id }).sort({ createdAt: -1 }).lean();
  return {
    booking: {
      reference: booking.reference,
      status: booking.status,
      services: booking.services?.length ? booking.services : [{ serviceId: booking.serviceId, serviceName: booking.serviceName, pricePaise: booking.servicePricePaise }],
      serviceName: booking.serviceName,
      servicePricePaise: booking.servicePricePaise,
      serviceDurationMinutes: booking.serviceDurationMinutes,
      staffName: booking.staffName,
      advancePaise: booking.advancePaise,
      visitDate: booking.visitDate,
      visitHours: booking.visitHours,
      startAt: booking.startAt,
      arrivalWindowEndAt: booking.arrivalWindowEndAt,
      endAt: booking.endAt,
      salonTimezone: booking.salonTimezone,
      customer: {
        name: booking.customer.name,
        phone: booking.customer.phone,
        email: booking.customer.email,
        gender: booking.customer.gender,
        age: booking.customer.age,
      },
      cancellationAllowed: ['held', 'confirmed'].includes(booking.status) && cancellationAllowed(booking),
    },
    payment: payment ? { status: payment.status, amountPaise: payment.amountPaise } : null,
    refund: refund ? { status: refund.status, amountPaise: refund.amountPaise, providerStatus: refund.providerStatus } : null,
  };
}

export async function cancelManagedBooking(request) {
  if (mongoose.connection.readyState !== 1) throw fail(503, 'BOOKING_DATABASE_UNAVAILABLE', 'Booking management is temporarily unavailable.');
  const booking = await findManagedBooking(request);
  if (booking.status === 'cancelled') return getManagedBooking(request);
  if (['expired', 'manual_resolution'].includes(booking.status)) throw fail(409, 'BOOKING_CANNOT_BE_CANCELLED', 'This booking needs help from the salon.');
  let refundToSubmit = null;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const current = await Booking.findById(booking._id).session(session);
      if (current.status === 'cancelled') return;
      if (!['held', 'confirmed'].includes(current.status)) throw fail(409, 'BOOKING_CANNOT_BE_CANCELLED', 'This booking needs help from the salon.');
      if (!cancellationAllowed(current)) {
        throw fail(409, 'CANCELLATION_WINDOW_CLOSED', 'Online cancellation closes one hour before your selected arrival time. Please contact the salon for help.');
      }
      const priorBookingStatus = current.status;
      current.status = 'cancelled';
      current.holdExpiresAt = null;
      await current.save({ session });
      await recordAuditEvent({
        eventKey: `booking:${current._id}:cancelled`, bookingId: current._id,
        entityType: 'booking', entityId: current._id, eventType: 'customer_cancellation',
        fromState: priorBookingStatus, toState: 'cancelled', actor: 'customer', session,
      });
      await SlotReservation.deleteMany({ bookingId: current._id }, { session });
      await ArrivalReservation.deleteMany({ bookingId: current._id }, { session });
      const payment = await Payment.findOne({ bookingId: current._id }).session(session);
      if (payment?.status === 'captured') {
        refundToSubmit = await makeRefundForCapturedPayment({ booking: current, payment, reason: 'customer_cancellation', session });
      }
      await queueBookingEvent(current, 'cancelled', { session });
    }, { readPreference: 'primary' });
  } finally {
    await session.endSession();
  }
  if (refundToSubmit) await submitRefund(refundToSubmit._id);
  return getManagedBooking(request);
}

export async function expireStaleHolds({ limit = 50 } = {}) {
  if (mongoose.connection.readyState !== 1) return 0;
  const stale = await Booking.find({ status: 'held', holdExpiresAt: { $lte: new Date() } }).select('_id').limit(limit).lean();
  let expiredCount = 0;
  for (const item of stale) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const result = await Booking.updateOne(
          { _id: item._id, status: 'held', holdExpiresAt: { $lte: new Date() } },
          { $set: { status: 'expired', holdExpiresAt: null } },
          { session },
        );
        if (!result.modifiedCount) return;
        await recordAuditEvent({
          eventKey: `booking:${item._id}:expired`, bookingId: item._id,
          entityType: 'booking', entityId: item._id, eventType: 'hold_expired',
          fromState: 'held', toState: 'expired', actor: 'system', session,
        });
        await SlotReservation.deleteMany({ bookingId: item._id }, { session });
        await ArrivalReservation.deleteMany({ bookingId: item._id }, { session });
        expiredCount += 1;
      });
    } finally {
      await session.endSession();
    }
  }
  return expiredCount;
}

export async function reconcileStaleProviderWork({ limit = 25 } = {}) {
  if (mongoose.connection.readyState !== 1) return;
  const cutoff = new Date(Date.now() - 2 * 60_000);
  await WebhookEvent.updateMany(
    { status: 'processing', updatedAt: { $lte: cutoff } },
    { $set: { status: 'failed' } },
  );
  const staleRefunds = await Refund.find({ status: 'submitting', updatedAt: { $lte: cutoff } })
    .sort({ updatedAt: 1 }).limit(limit).select('_id bookingId paymentId').lean();
  for (const refund of staleRefunds) {
    const result = await Refund.updateOne(
      { _id: refund._id, status: 'submitting', updatedAt: { $lte: cutoff } },
      { $set: { status: 'manual_review', lastErrorCode: 'REFUND_RESULT_UNKNOWN' } },
    );
    if (!result.modifiedCount) continue;
    await Payment.updateOne({ _id: refund.paymentId }, { $set: { status: 'manual_review' } });
    const booking = await Booking.findById(refund.bookingId);
    if (booking) await queueBookingEvent(booking, 'refund_manual_review', { note: 'The server restarted during a refund request. Verify the refund in Razorpay before retrying it.' });
  }

  const staleOrders = await Payment.find({ status: 'order_creating', updatedAt: { $lte: cutoff } })
    .sort({ updatedAt: 1 }).limit(limit).select('_id bookingId').lean();
  for (const payment of staleOrders) {
    const result = await Payment.updateOne(
      { _id: payment._id, status: 'order_creating', updatedAt: { $lte: cutoff } },
      { $set: { status: 'manual_review', failureCode: 'ORDER_RESULT_UNKNOWN' } },
    );
    if (!result.modifiedCount) continue;
    const booking = await Booking.findById(payment.bookingId);
    if (booking) await queueBookingEvent(booking, 'payment_manual_review', { note: 'Payment setup did not return a verifiable order. The hold will expire automatically.' });
  }
}

export async function processPendingRefunds({ limit = 10 } = {}) {
  if (mongoose.connection.readyState !== 1) return 0;
  const pending = await Refund.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .select('_id')
    .lean();
  for (const item of pending) await submitRefund(item._id);
  return pending.length;
}
