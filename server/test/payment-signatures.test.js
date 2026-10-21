import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { describe, it } from 'node:test';
import { verifyCheckoutSignature, verifyWebhookSignature } from '../src/booking/razorpay.js';

describe('Razorpay signature helpers', () => {
  it('validates a checkout HMAC from the trusted order, payment, and secret', () => {
    const orderId = 'order_test_123';
    const paymentId = 'pay_test_456';
    const secret = 'test-secret';
    const signature = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    assert.equal(verifyCheckoutSignature({ orderId, paymentId, signature, secret }), true);
    assert.equal(verifyCheckoutSignature({ orderId, paymentId: 'pay_other', signature, secret }), false);
    assert.equal(verifyCheckoutSignature({ orderId, paymentId, signature: 'not-a-signature', secret }), false);
  });

  it('validates the exact raw webhook body and rejects a changed body', () => {
    const secret = 'webhook-test-secret';
    const rawBody = Buffer.from('{"event":"payment.captured","payload":{}}');
    const signature = createHmac('sha256', secret).update(rawBody).digest('hex');
    assert.equal(verifyWebhookSignature({ rawBody, signature, secret }), true);
    assert.equal(verifyWebhookSignature({ rawBody: Buffer.from(`${rawBody.toString()} `), signature, secret }), false);
  });
});
