import { Notification } from '../models/Notification.js';
import { notificationConfiguration } from './notification-mode.js';

function formatWhen(booking) {
  if (booking.visitDate) {
    const day = new Intl.DateTimeFormat('en-IN', {
      timeZone: booking.salonTimezone,
      dateStyle: 'full',
    }).format(new Date(`${booking.visitDate}T12:00:00.000Z`));
    if (booking.startAt) {
      const arrival = new Intl.DateTimeFormat('en-IN', {
        timeZone: booking.salonTimezone,
        timeStyle: 'short',
      }).format(new Date(booking.startAt));
      return `${day} at ${arrival} (arrival time)`;
    }
    const formatClock = (value) => {
      if (!/^\d{2}:\d{2}$/.test(value || '')) return value || '';
      const [hourText, minute] = value.split(':');
      const hour = Number(hourText);
      return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
    };
    const hours = booking.visitHours;
    return hours ? `${day}, any time from ${formatClock(hours.open)} to ${formatClock(hours.close)}` : `${day}, any time during salon hours`;
  }
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: booking.salonTimezone,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(booking.startAt);
}

function money(paise) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
}

export async function queueBookingEvent(booking, eventType, { session, note = '' } = {}) {
  const salonName = process.env.PUBLIC_SALON_NAME || 'Salon';
  const owner = process.env.OWNER_EMAIL?.trim();
  const customer = booking.customer?.email?.trim();
  const mode = notificationConfiguration();
  const recipients = mode.mockAllowed
    ? [
      { role: 'owner', to: owner || 'mock://owner' },
      { role: 'customer', to: customer || 'mock://customer' },
    ]
    : [
      ...(owner ? [{ role: 'owner', to: owner }] : []),
      ...(customer ? [{ role: 'customer', to: customer }] : []),
    ];
  if (!recipients.length) return;

  const when = formatWhen(booking);
  const statusText = {
    confirmed: 'Visit booking confirmed',
    cancelled: 'Visit booking cancelled',
    refund_processed: 'Advance refund processed',
    refund_manual_review: 'Refund needs review',
    payment_manual_review: 'Payment needs review',
  }[eventType] || eventType;
  const salonAdjustmentPaise = booking.servicePricePaise - booking.advancePaise;
  const salonAdjustmentLine = eventType === 'cancelled' || eventType.startsWith('refund')
    ? 'No additional cash settlement is due for a cancellation before service.'
    : salonAdjustmentPaise < 0
      ? `Cash change to return after service: ${money(Math.abs(salonAdjustmentPaise))}`
      : `Remaining amount to collect at salon: ${money(salonAdjustmentPaise)}`;
  const detailLines = [
    `${statusText} · ${salonName}`,
    `Booking reference: ${booking.reference}`,
    `Customer: ${booking.customer.name}`,
    `Phone: ${booking.customer.phone}`,
    ...(booking.services?.length
      ? ['Services:', ...booking.services.map((service) => `- ${service.serviceName}: ${money(service.pricePaise)}`)]
      : [`Service: ${booking.serviceName}`]),
    ...(booking.staffName ? [`Employee: ${booking.staffName}`] : []),
    `Visit date and arrival time: ${when} (${booking.salonTimezone})`,
    `Service total: ${money(booking.servicePricePaise)}`,
    `Advance paid: ${money(booking.advancePaise)} (credited against the bill)`,
    salonAdjustmentLine,
    ...(eventType.startsWith('refund') ? [`Refund: ${note || 'Status is being checked with the payment provider.'}`] : []),
  ];
  for (const { role, to } of recipients) {
    const notification = {
      dedupeKey: `${booking.id || booking._id}:${eventType}:${role}`,
      bookingId: booking._id || booking.id,
      to,
      subject: `${statusText} · ${booking.reference}`,
      text: [...detailLines, ...(note ? [`Note: ${note}`] : [])].join('\n'),
    };
    await Notification.updateOne(
      { dedupeKey: notification.dedupeKey },
      { $setOnInsert: notification },
      { upsert: true, ...(session ? { session } : {}) },
    );
  }
}

async function sendEmail({ dedupeKey, to, subject, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    const error = new Error('Email provider is not configured.');
    error.code = 'NOTIFICATION_PROVIDER_NOT_CONFIGURED';
    throw error;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': dedupeKey },
    body: JSON.stringify({ from, to: [to], subject, text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const error = new Error('Email provider request failed.');
    error.code = `EMAIL_HTTP_${response.status}`;
    throw error;
  }
  const result = await response.json().catch(() => ({}));
  return { providerMessageId: result.id || null };
}

export async function processNotificationQueue({ limit = 10 } = {}) {
  const abandonedBefore = new Date(Date.now() - 2 * 60_000);
  const idempotencyWindowStart = new Date(Date.now() - 23 * 60 * 60_000);
  await Notification.updateMany(
    { status: 'sending', updatedAt: { $lt: abandonedBefore }, $or: [
      { updatedAt: { $lte: idempotencyWindowStart } },
      { attempts: { $gte: 5 } },
    ] },
    { $set: { status: 'manual_review', lastErrorCode: 'EMAIL_RESULT_UNKNOWN' } },
  );
  await Notification.updateMany(
    { status: 'sending', updatedAt: { $lt: abandonedBefore, $gt: idempotencyWindowStart }, attempts: { $lt: 5 } },
    { $set: { status: 'pending', nextAttemptAt: new Date() } },
  );

  for (let index = 0; index < limit; index += 1) {
    const notification = await Notification.findOneAndUpdate(
      { status: 'pending', nextAttemptAt: { $lte: new Date() } },
      { $set: { status: 'sending' }, $inc: { attempts: 1 } },
      { sort: { createdAt: 1 }, new: true },
    );
    if (!notification) break;
    if (notificationConfiguration().mockAllowed) {
      await Notification.updateOne(
        { _id: notification._id, status: 'sending' },
        { $set: { status: 'mocked', mockedAt: new Date(), lastErrorCode: 'MOCK_MODE_NO_DELIVERY' } },
      );
      console.info('notification_mocked_not_sent', { id: String(notification._id), dedupeKey: notification.dedupeKey });
      continue;
    }
    try {
      const accepted = await sendEmail(notification);
      await Notification.updateOne(
        { _id: notification._id, status: 'sending' },
        { $set: { status: 'accepted', acceptedAt: new Date(), providerMessageId: accepted.providerMessageId, lastErrorCode: null } },
      );
    } catch (error) {
      const exhausted = notification.attempts >= 5;
      const delayMinutes = Math.min(60, 2 ** notification.attempts);
      await Notification.updateOne(
        { _id: notification._id, status: 'sending' },
        {
          $set: {
            status: exhausted ? 'manual_review' : 'pending',
            nextAttemptAt: new Date(Date.now() + delayMinutes * 60_000),
            lastErrorCode: error.code || 'EMAIL_DELIVERY_FAILED',
          },
        },
      );
      console.error('notification_delivery_failed', { code: error.code || 'EMAIL_DELIVERY_FAILED' });
    }
  }
}
