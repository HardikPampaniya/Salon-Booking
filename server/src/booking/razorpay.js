import { createHmac, timingSafeEqual } from 'node:crypto';

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    const error = new Error('Razorpay is not configured.');
    error.code = 'PAYMENTS_NOT_CONFIGURED';
    throw error;
  }
  return { keyId, keySecret };
}

function equalHexDigest(expected, provided) {
  if (typeof provided !== 'string' || !/^[a-f0-9]{64}$/i.test(provided)) return false;
  const expectedBytes = Buffer.from(expected, 'hex');
  const providedBytes = Buffer.from(provided, 'hex');
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

export function verifyCheckoutSignature({ orderId, paymentId, signature, secret = process.env.RAZORPAY_KEY_SECRET }) {
  if (!orderId || !paymentId || !secret) return false;
  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return equalHexDigest(expected, signature);
}

export function verifyWebhookSignature({ rawBody, signature, secret = process.env.RAZORPAY_WEBHOOK_SECRET }) {
  if (!rawBody || !secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return equalHexDigest(expected, signature);
}

export async function razorpayRequest(path, { method = 'GET', body } = {}) {
  const { keyId, keySecret } = credentials();
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${authorization}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('Razorpay request failed.');
    error.code = payload?.error?.code || `RAZORPAY_HTTP_${response.status}`;
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function createRazorpayOrder({ amountPaise, receipt, notes }) {
  return razorpayRequest('/orders', {
    method: 'POST',
    body: { amount: amountPaise, currency: 'INR', receipt, notes },
  });
}

export function fetchRazorpayPayment(paymentId) {
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
}

export function fetchRazorpayOrderPayments(orderId) {
  return razorpayRequest(`/orders/${encodeURIComponent(orderId)}/payments`);
}

export function createRazorpayRefund({ paymentId, amountPaise, bookingReference, refundKey }) {
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST',
    body: {
      amount: amountPaise,
      notes: { booking_reference: bookingReference, refund_key: refundKey },
    },
  });
}
