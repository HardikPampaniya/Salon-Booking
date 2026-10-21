import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';

function salonDate(daysAhead = 0) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.SALON_TIMEZONE || 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const day = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + daysAhead));
  return day.toISOString().slice(0, 10);
}

describe('public API foundation', () => {
  const app = createApp();

  it('reports API, database, and payment readiness without leaking secrets', async () => {
    const response = await request(app).get('/api/health').expect(200);
    assert.equal(response.body.status, 'ok');
    assert.ok(['configured', 'not_configured'].includes(response.body.database));
    assert.ok(!JSON.stringify(response.body).includes(process.env.RAZORPAY_KEY_SECRET || 'never-log-this'));
  });

  it('lists the configured service catalog', async () => {
    const response = await request(app).get('/api/services').expect(200);
    assert.ok(Array.isArray(response.body.services));
    assert.ok(response.body.services.length > 0);
    assert.ok(response.body.services.every((service) => service.id && service.name
      && service.bookable === (Number.isFinite(service.priceRupees) && service.priceRupees > 0 && service.needsConfirmation !== true)));
    assert.equal(response.body.services.length, 200);
    assert.equal(response.body.services.find((service) => service.id === 'beauty-brazilian-full-face-wax').priceRupees, 550);
    assert.equal(response.body.services.find((service) => service.id === 'women-temporary-curls').priceRupees, 800);
  });

  it('validates availability queries and returns arrival times without service durations', async () => {
    await request(app).get('/api/availability').expect(400);
    await request(app).get(`/api/availability?serviceId=unknown&date=${salonDate(1)}`).expect(404);
    const response = await request(app).get(`/api/availability?serviceId=women-hair-wash-blowdry&date=${salonDate(1)}`).expect(200);
    assert.equal(response.body.service.id, 'women-hair-wash-blowdry');
    assert.equal(response.body.closed, false);
    assert.ok(Array.isArray(response.body.slots));
  });

  it('shows schedule-based arrival choices when checkout infrastructure is unavailable', async () => {
    const response = await request(app).get(`/api/availability?serviceId=women-hair-wash-blowdry&date=${salonDate(1)}`).expect(200);
    assert.ok(response.body.slots.length > 0);
    assert.equal(response.body.slots[0].time.length > 0, true);
  });

  it('returns editable public salon configuration', async () => {
    const response = await request(app).get('/api/config').expect(200);
    assert.equal(response.body.salon.name, 'The Dream Beauty Unisex Studio');
    assert.equal(response.body.salon.staffSelection.customerMayChoose, false);
    assert.equal(response.body.salon.hours.length, 7);
    assert.equal(typeof response.body.salon.name, 'string');
    assert.equal(response.body.salon.timezone, process.env.SALON_TIMEZONE || 'Asia/Kolkata');
  });

  it('uses a consistent JSON response for missing API routes', async () => {
    const response = await request(app).get('/api/missing').expect(404);
    assert.equal(response.body.error.code, 'NOT_FOUND');
  });

  it('keeps booking disabled until infrastructure and salon setup are present', async () => {
    const response = await request(app).get('/api/booking/readiness').expect(200);
    assert.equal(response.body.enabled, false);
    assert.ok(response.body.issues.includes('booking_disabled'));
    assert.ok(response.body.issues.includes('database_unavailable'));
    assert.ok(response.body.issues.includes('razorpay_not_configured'));
    await request(app).post('/api/bookings/holds').send({}).expect(503);
    await request(app).post('/api/bookings/manage').send({ reference: 'SAL-UNKNOWN' }).expect(503);
  });

  it('does not expose public booking reads or admin endpoints', async () => {
    await request(app).get('/api/bookings').expect(404);
    await request(app).get('/api/admin/bookings').expect(404);
  });

  it('sets common security headers', async () => {
    const response = await request(app).get('/api/services').expect(200);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['x-powered-by'], undefined);
  });
});
