import { Notification } from '../models/Notification.js';
import { notificationConfiguration } from './notification-mode.js';

function formatWhen(booking) {
  if (booking.visitDate) {
    const day = new Intl.DateTimeFormat('en-IN', {
      timeZone: booking.salonTimezone,
      dateStyle: 'full',
    }).format(new Date(`${booking.visitDate}T12:00:00.000Z`));
    if (booking.startAt) {
      const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: booking.salonTimezone,
        timeStyle: 'short',
      });
      const arrivalStart = new Date(booking.startAt);
      if (booking.arrivalWindowEndAt) {
        const arrivalEnd = formatter.format(new Date(booking.arrivalWindowEndAt));
        return `${day} between ${formatter.format(arrivalStart)} and ${arrivalEnd} (arrival window)`;
      }
      return `${day} at ${formatter.format(arrivalStart)} (arrival time)`;
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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function bookingEmail({ role, booking, salonName, statusText, eventType, when, services, note }) {
  const isCustomer = role === 'customer';
  const heading = eventType === 'confirmed'
    ? (isCustomer ? 'Your visit is confirmed' : 'A new visit is confirmed')
    : statusText;
  const greeting = isCustomer
    ? `Hello ${booking.customer.name}, your ₹100 advance payment was received and your visit is confirmed.`
    : `A new salon visit is confirmed and the ₹100 advance payment was received. Review the appointment and customer details below.`;
  const intro = eventType === 'confirmed'
    ? greeting
    : `${statusText}.${note ? ` ${note}` : ''}`;
  const serviceRowsHtml = services.map((service) => `<tr>
    <td style="padding:12px 14px;border-bottom:1px solid #eee5dc;color:#403a36;font-size:14px;line-height:1.5">${escapeHtml(service.serviceName || booking.serviceName || 'Salon service')}</td>
    <td style="padding:12px 14px;border-bottom:1px solid #eee5dc;color:#403a36;font-size:14px;text-align:right;white-space:nowrap">${escapeHtml(money(service.pricePaise || 0))}</td>
  </tr>`).join('');
  const ownerRows = isCustomer ? '' : `<tr><td style="padding:8px 0;color:#786d64">Customer</td><td style="padding:8px 0;color:#403a36;font-weight:600">${escapeHtml(booking.customer.name)}</td></tr>
    <tr><td style="padding:8px 0;color:#786d64">Phone</td><td style="padding:8px 0;color:#403a36">${escapeHtml(booking.customer.phone)}</td></tr>
    ${booking.customer.email ? `<tr><td style="padding:8px 0;color:#786d64">Email</td><td style="padding:8px 0;color:#403a36">${escapeHtml(booking.customer.email)}</td></tr>` : ''}
    ${booking.customer.gender ? `<tr><td style="padding:8px 0;color:#786d64">Gender</td><td style="padding:8px 0;color:#403a36">${escapeHtml(booking.customer.gender)}</td></tr>` : ''}
    ${Number.isInteger(booking.customer.age) ? `<tr><td style="padding:8px 0;color:#786d64">Age</td><td style="padding:8px 0;color:#403a36">${booking.customer.age}</td></tr>` : ''}`;
  const settlementLabel = booking.servicePricePaise < booking.advancePaise
    ? 'Cash change to return after service'
    : 'Remaining balance at the salon';
  const settlementAmount = Math.abs(booking.servicePricePaise - booking.advancePaise);
  const safeSalon = escapeHtml(salonName);
  const safeWhen = escapeHtml(when);
  const safeReference = escapeHtml(booking.reference);
  const safeStatus = escapeHtml(statusText);
  const timezoneLabel = booking.salonTimezone === 'Asia/Kolkata' ? 'India time' : booking.salonTimezone;
  const settlementHtml = eventType === 'cancelled' || eventType.startsWith('refund')
    ? `<tr><td style="padding:10px 14px;color:#786d64">Refund status</td><td style="padding:10px 14px;color:#403a36;text-align:right">${escapeHtml(note || 'Being checked with the payment provider')}</td></tr>`
    : `<tr><td style="padding:10px 14px;color:#786d64">${escapeHtml(settlementLabel)}</td><td style="padding:10px 14px;color:#403a36;text-align:right">${escapeHtml(money(settlementAmount))}</td></tr>`;
  const appointmentNotice = isCustomer
    ? '<p style="margin:16px 0 0;color:#786d64;font-size:13px;line-height:1.7">Your selected time is an arrival window. The service may begin when the salon team is available.</p>'
    : '';
  const html = `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f5f1ec;font-family:Arial,Helvetica,sans-serif;color:#403a36">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(intro)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#fffdfa;border:1px solid #e5d9ce">
      <tr><td style="padding:26px 30px;background:#59473e;color:#fffaf5"><p style="margin:0 0 6px;color:#e7c3b4;font-size:11px;letter-spacing:1.5px;text-transform:uppercase">${safeSalon}</p><p style="margin:0;color:#fffaf5;font-size:13px">${safeStatus}</p></td></tr>
      <tr><td style="padding:30px">
        <h1 style="margin:0 0 10px;color:#403a36;font-family:Georgia,serif;font-size:30px;font-weight:400;line-height:1.2">${escapeHtml(heading)}</h1>
        <p style="margin:0;color:#685d55;font-size:14px;line-height:1.7">${escapeHtml(intro)}</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;background:#f8f2eb;border:1px solid #e5d9ce">
          <tr><td style="padding:14px 16px;color:#786d64;font-size:12px">BOOKING REFERENCE</td></tr>
          <tr><td style="padding:0 16px 15px;color:#403a36;font-size:17px;font-weight:700">${safeReference}</td></tr>
          <tr><td style="padding:0 16px 7px;color:#786d64;font-size:12px">DATE AND ARRIVAL TIME (${escapeHtml(timezoneLabel)})</td></tr>
          <tr><td style="padding:0 16px 15px;color:#403a36;font-size:14px;font-weight:600;line-height:1.5">${safeWhen}</td></tr>
        </table>
        ${ownerRows ? `<h2 style="margin:24px 0 8px;color:#403a36;font-family:Georgia,serif;font-size:20px;font-weight:400">Customer details</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-bottom:1px solid #eee5dc">${ownerRows}</table>` : ''}
        <h2 style="margin:24px 0 8px;color:#403a36;font-family:Georgia,serif;font-size:20px;font-weight:400">Services</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eee5dc"><thead><tr style="background:#f8f2eb"><th align="left" style="padding:10px 14px;color:#786d64;font-size:11px;font-weight:600;text-transform:uppercase">Service</th><th align="right" style="padding:10px 14px;color:#786d64;font-size:11px;font-weight:600;text-transform:uppercase">Price</th></tr></thead><tbody>${serviceRowsHtml}</tbody></table>
        <h2 style="margin:24px 0 8px;color:#403a36;font-family:Georgia,serif;font-size:20px;font-weight:400">Payment summary</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbf9f5;border:1px solid #eee5dc">
          <tr><td style="padding:10px 14px;color:#786d64">Service total</td><td style="padding:10px 14px;color:#403a36;text-align:right">${escapeHtml(money(booking.servicePricePaise))}</td></tr>
          <tr><td style="padding:10px 14px;color:#786d64">Advance paid online</td><td style="padding:10px 14px;color:#403a36;text-align:right">${escapeHtml(money(booking.advancePaise))}</td></tr>
          ${settlementHtml}
        </table>
        ${appointmentNotice}
        <p style="margin:26px 0 0;padding-top:16px;border-top:1px solid #eee5dc;color:#91857b;font-size:11px;line-height:1.6">This is an automated message from ${safeSalon}. Please keep the booking reference for your records.</p>
      </td></tr>
    </table>
  </body></html>`;
  const text = [
    salonName,
    heading,
    '',
    intro,
    `Booking reference: ${booking.reference}`,
    `Date and arrival time (${timezoneLabel}): ${when}`,
    ...(!isCustomer ? [
      `Customer: ${booking.customer.name}`,
      `Phone: ${booking.customer.phone}`,
      ...(booking.customer.email ? [`Email: ${booking.customer.email}`] : []),
      ...(booking.customer.gender ? [`Gender: ${booking.customer.gender}`] : []),
      ...(Number.isInteger(booking.customer.age) ? [`Age: ${booking.customer.age}`] : []),
    ] : []),
    '',
    'Services:',
    ...services.map((service) => `- ${service.serviceName || booking.serviceName}: ${money(service.pricePaise || 0)}`),
    `Service total: ${money(booking.servicePricePaise)}`,
    `Advance paid online: ${money(booking.advancePaise)}`,
    eventType === 'cancelled' || eventType.startsWith('refund')
      ? `Refund status: ${note || 'Being checked with the payment provider'}`
      : `${settlementLabel}: ${money(settlementAmount)}`,
    ...(isCustomer ? ['', 'Your selected time is an arrival window. The service may begin when the salon team is available.'] : []),
  ].join('\n');
  return { html, text };
}

function whatsappNumber(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10) digits = `${process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '91'}${digits}`;
  else if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`;
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

function templateParameters(role, booking, when, services, salonAdjustmentLine) {
  if (role === 'customer') {
    return [booking.customer.name, booking.reference, when, services, money(booking.servicePricePaise), money(booking.advancePaise)];
  }
  return [
    booking.reference,
    booking.customer.name,
    booking.customer.phone,
    when,
    services,
    money(booking.servicePricePaise),
    money(booking.advancePaise),
    salonAdjustmentLine,
  ];
}

export async function queueBookingEvent(booking, eventType, { session, note = '' } = {}) {
  const salonName = process.env.PUBLIC_SALON_NAME || 'Salon';
  const owner = process.env.OWNER_EMAIL?.trim();
  const customer = booking.customer?.email?.trim();
  const mode = notificationConfiguration();
  if (mode.mode === 'whatsapp' && eventType !== 'confirmed') return;
  const customerWhatsApp = booking.customer?.whatsappUpdatesOptIn
    ? whatsappNumber(booking.customer.phone)
    : null;
  const ownerWhatsApp = whatsappNumber(process.env.WHATSAPP_OWNER_NUMBER);
  const recipients = mode.mode === 'whatsapp'
    ? [
      ...(ownerWhatsApp ? [{ role: 'owner', to: ownerWhatsApp }] : []),
      ...(customerWhatsApp ? [{ role: 'customer', to: customerWhatsApp }] : []),
    ]
    : mode.mockAllowed
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
  const serviceSummary = (booking.services?.length
    ? booking.services.map((service) => `${service.serviceName} (${money(service.pricePaise)})`)
    : [booking.serviceName]).join('; ').slice(0, 900);
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
    const whatsapp = mode.mode === 'whatsapp';
    const email = whatsapp ? null : bookingEmail({
      role,
      booking,
      salonName,
      statusText,
      eventType,
      when,
      services: booking.services?.length ? booking.services : [{ serviceName: booking.serviceName, pricePaise: booking.servicePricePaise }],
      note,
    });
    const subject = role === 'customer' && eventType === 'confirmed'
      ? `Your salon visit is confirmed · ${booking.reference}`
      : role === 'owner' && eventType === 'confirmed'
        ? `New salon booking · ${booking.reference}`
        : `${statusText} · ${booking.reference}`;
    const notification = {
      dedupeKey: `${booking.id || booking._id}:${eventType}:${whatsapp ? 'whatsapp:' : ''}${role}`,
      bookingId: booking._id || booking.id,
      channel: whatsapp ? 'whatsapp' : 'email',
      to,
      ...(whatsapp ? {
        templateName: role === 'owner' ? process.env.WHATSAPP_OWNER_TEMPLATE : process.env.WHATSAPP_CUSTOMER_TEMPLATE,
        templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE,
        templateParameters: templateParameters(role, booking, when, serviceSummary, salonAdjustmentLine),
      } : {}),
      subject,
      ...(email ? { html: email.html } : {}),
      text: email?.text || [
        ...detailLines,
        ...(role === 'owner' && booking.customer.email ? [`Customer email: ${booking.customer.email}`] : []),
        ...(role === 'owner' && booking.customer.gender ? [`Gender: ${booking.customer.gender}`] : []),
        ...(role === 'owner' && Number.isInteger(booking.customer.age) ? [`Age: ${booking.customer.age}`] : []),
        ...(note ? [`Note: ${note}`] : []),
      ].join('\n'),
    };
    await Notification.updateOne(
      { dedupeKey: notification.dedupeKey },
      { $setOnInsert: notification },
      { upsert: true, ...(session ? { session } : {}) },
    );
  }
}

async function sendEmail({ dedupeKey, to, subject, text, html }) {
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
    body: JSON.stringify({ from, to: [to], subject, text, html: html || `<div style="font-family:Arial,sans-serif;white-space:pre-line">${escapeHtml(text)}</div>` }),
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

async function sendWhatsApp({ to, templateName, templateLanguage, templateParameters: parameters }) {
  const version = process.env.WHATSAPP_GRAPH_API_VERSION;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!version || !phoneNumberId || !accessToken || !templateName || !templateLanguage) {
    const error = new Error('WhatsApp provider is not configured.');
    error.code = 'WHATSAPP_PROVIDER_NOT_CONFIGURED';
    throw error;
  }
  const response = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: [{
          type: 'body',
          parameters: parameters.map((text) => ({ type: 'text', text })),
        }],
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const error = new Error('WhatsApp provider request failed.');
    error.code = `WHATSAPP_HTTP_${response.status}`;
    throw error;
  }
  const result = await response.json().catch(() => ({}));
  return { providerMessageId: result.messages?.[0]?.id || null };
}

export async function processNotificationQueue({ limit = 10 } = {}) {
  const abandonedBefore = new Date(Date.now() - 2 * 60_000);
  const idempotencyWindowStart = new Date(Date.now() - 23 * 60 * 60_000);
  await Notification.updateMany(
    { status: 'sending', channel: 'whatsapp', updatedAt: { $lt: abandonedBefore } },
    { $set: { status: 'manual_review', lastErrorCode: 'WHATSAPP_RESULT_UNKNOWN' } },
  );
  await Notification.updateMany(
    { status: 'sending', channel: { $ne: 'whatsapp' }, updatedAt: { $lt: abandonedBefore }, $or: [
      { updatedAt: { $lte: idempotencyWindowStart } },
      { attempts: { $gte: 5 } },
    ] },
    { $set: { status: 'manual_review', lastErrorCode: 'EMAIL_RESULT_UNKNOWN' } },
  );
  await Notification.updateMany(
    { status: 'sending', channel: { $ne: 'whatsapp' }, updatedAt: { $lt: abandonedBefore, $gt: idempotencyWindowStart }, attempts: { $lt: 5 } },
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
      const accepted = notification.channel === 'whatsapp'
        ? await sendWhatsApp(notification)
        : await sendEmail(notification);
      await Notification.updateOne(
        { _id: notification._id, status: 'sending' },
        { $set: { status: 'accepted', acceptedAt: new Date(), providerMessageId: accepted.providerMessageId, lastErrorCode: null } },
      );
    } catch (error) {
      if (notification.channel === 'whatsapp') {
        await Notification.updateOne(
          { _id: notification._id, status: 'sending' },
          { $set: { status: 'manual_review', lastErrorCode: error.code || 'WHATSAPP_RESULT_UNKNOWN' } },
        );
        console.error('whatsapp_delivery_needs_review', { code: error.code || 'WHATSAPP_RESULT_UNKNOWN' });
        continue;
      }
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
