import './load-env.js';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { expireStaleHolds, processPendingRefunds, reconcileStaleProviderWork } from './booking/workflows.js';
import { processNotificationQueue } from './booking/notifications.js';
import { ArrivalReservation } from './models/ArrivalReservation.js';
import { Booking } from './models/Booking.js';
import { BookingAuditEvent } from './models/BookingAuditEvent.js';
import { Notification } from './models/Notification.js';
import { Payment } from './models/Payment.js';
import { Refund } from './models/Refund.js';
import { SlotReservation } from './models/SlotReservation.js';
import { Staff } from './models/Staff.js';
import { WebhookEvent } from './models/WebhookEvent.js';

const port = Number(process.env.PORT || 5000);
const app = createApp();

if (process.env.MONGODB_URI) {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    process.env.MONGODB_TRANSACTIONS_SUPPORTED = String(Boolean(hello.setName || hello.msg === 'isdbgrid'));
    await Promise.all([
      ArrivalReservation.init(),
      Booking.init(),
      BookingAuditEvent.init(),
      Notification.init(),
      Payment.init(),
      Refund.init(),
      SlotReservation.init(),
      Staff.init(),
      WebhookEvent.init(),
    ]);
    console.info('database_connected', { transactionsSupported: process.env.MONGODB_TRANSACTIONS_SUPPORTED === 'true', indexesReady: true });
  } catch (error) {
    console.error('database_connection_failed', { name: error.name });
    process.exitCode = 1;
    process.exit();
  }
} else {
  console.info('database_not_configured', { message: 'Marketing endpoints are available; booking persistence is disabled.' });
}

const server = app.listen(port, () => console.info(`api_listening port=${port}`));
let workerRunning = false;
const workerTimer = setInterval(async () => {
  if (workerRunning || mongoose.connection.readyState !== 1) return;
  workerRunning = true;
  try {
    await expireStaleHolds();
    await reconcileStaleProviderWork();
    await processPendingRefunds();
    await processNotificationQueue();
  } catch (error) {
    console.error('background_work_failed', { name: error.name });
  } finally {
    workerRunning = false;
  }
}, 15_000);
workerTimer.unref();

async function shutdown(signal) {
  console.info(`shutdown signal=${signal}`);
  clearInterval(workerTimer);
  server.close(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
