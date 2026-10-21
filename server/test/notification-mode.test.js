import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { notificationConfiguration } from '../src/booking/notification-mode.js';

describe('notification transport mode', () => {
  it('allows an explicitly marked mock only in development/test with Razorpay test mode', () => {
    assert.deepEqual(notificationConfiguration({ NOTIFICATIONS_MODE: 'mock', NODE_ENV: 'development', RAZORPAY_MODE: 'test' }), {
      mode: 'mock', mockAllowed: true, configured: true, issue: null,
    });
    assert.equal(notificationConfiguration({ NOTIFICATIONS_MODE: 'mock', NODE_ENV: 'test', RAZORPAY_MODE: 'test' }).configured, true);
  });

  it('rejects mock delivery in production and with live payments', () => {
    assert.equal(notificationConfiguration({ NOTIFICATIONS_MODE: 'mock', NODE_ENV: 'production', RAZORPAY_MODE: 'test' }).issue, 'notification_mock_not_allowed');
    assert.equal(notificationConfiguration({ NOTIFICATIONS_MODE: 'mock', NODE_ENV: 'development', RAZORPAY_MODE: 'live' }).issue, 'notification_mock_not_allowed');
  });

  it('requires all Resend sender and owner settings in provider mode', () => {
    const env = { NOTIFICATIONS_MODE: 'resend', RESEND_API_KEY: 'key', EMAIL_FROM: 'salon@example.com', OWNER_EMAIL: 'owner@example.com' };
    assert.equal(notificationConfiguration(env).configured, true);
    assert.equal(notificationConfiguration({ ...env, OWNER_EMAIL: '' }).issue, 'email_notifications_not_configured');
  });

  it('rejects unknown notification transports', () => {
    assert.equal(notificationConfiguration({ NOTIFICATIONS_MODE: 'whatsapp', NODE_ENV: 'development' }).issue, 'notification_mode_invalid');
  });
});
