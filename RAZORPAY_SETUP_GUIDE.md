# Razorpay test setup guide

This project creates a Razorpay **order for a specific booking hold** and charges a fixed ₹100 advance (10,000 paise). It does not use a reusable Payment Link or standalone Payment Button. A payment counts only after the server verifies it. Keep the site’s booking switch off until an isolated test environment is ready.

## Before starting

- The local root `.env` currently has no MongoDB URI or Razorpay credentials. Do not paste any secret into chat or Git.
- You need an isolated **test** database that supports MongoDB transactions, an approved service with price and duration, a staff member eligible for that service with a complete schedule, approved booking/privacy policies, and a non-mock notification provider. These gates are why checkout is currently disabled.
- Do not attach test payments to the production database. Use a separate staging deployment and database, or a private local setup. Never turn on live payments as part of this guide.

## A. Create test API keys

1. Sign in to the salon owner’s [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Switch the dashboard to **Test Mode**. Test and Live credentials are different; test mode simulates payments and does not transfer real money.
3. Open **Settings → API Keys** (the exact dashboard wording may vary) and generate a Test Key. Save the Key ID and Key Secret securely when they are shown. Razorpay’s [API key instructions](https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/) explain the separate modes.
4. In the repository root, open the ignored `.env` file. Set these values using your own test credentials:

   ```dotenv
   RAZORPAY_MODE=test
   RAZORPAY_KEY_ID=rzp_test_your_test_key_id
   RAZORPAY_KEY_SECRET=your_test_key_secret
   ```

   The Key Secret stays on the server. Do not add it to `client/`, `VITE_*` variables, source files, or messages. The public checkout only receives the Key ID and a server-created order ID.

## B. Create a test webhook

1. Your webhook receiver must be reachable at a public HTTPS URL. Razorpay cannot deliver a webhook to `localhost` directly. Use the isolated staging app’s HTTPS URL, or use a short-lived HTTPS tunnel for a local test. Do not point a test webhook at a production database.
2. In Test Mode, open **Accounts & Settings → Webhooks** in the Razorpay Dashboard and add a webhook with this URL:

   ```text
   https://YOUR-ISOLATED-STAGING-HOST/api/webhooks/razorpay
   ```

3. Create a strong webhook secret. This is a separate value from the API Key Secret. Put the same value into the staging backend’s `RAZORPAY_WEBHOOK_SECRET` environment variable, save it in Render’s secret environment settings (or your private local `.env`), and restart/redeploy the isolated staging service. Never show or send this value in chat.
4. Subscribe to the events handled by this project: `payment.authorized`, `payment.captured`, `payment.failed`, `refund.processed`, and `refund.failed`. The endpoint verifies Razorpay’s signature against the exact raw request body and deduplicates event IDs.
5. Save the webhook. Use Razorpay’s [webhook setup guide](https://razorpay.com/docs/webhooks/setup-edit-payments/) and [signature validation guide](https://razorpay.com/docs/webhooks/validate-test/) if the dashboard labels differ.

The webhook secret must match the secret used when that webhook is registered. If the webhook is edited later, update the backend secret to the corresponding value. Configure Test and Live webhooks separately.

## C. Start and test the isolated app

1. Configure the isolated backend environment. Besides the three Razorpay variables above, booking needs `BOOKING_ENABLED=true` **only in that private test environment**, a transaction-capable `MONGODB_URI`, approved service durations/prices, approved staff data, `STAFF_ROSTER_APPROVED=true`, a real notification provider, and approved policy version values. The server checks MongoDB’s replica-set/sharded status at startup; do not set that check manually. Keep `render.yaml` and the public Render service disabled.
2. For a local run, start the app from the project root:

   ```powershell
   npm install
   npm run dev
   ```

   Open <http://localhost:5173>. Without all readiness requirements, `/book` will explain that booking is unavailable. Do not turn off readiness checks just to reveal the payment button.
3. Select a service, date, and available appointment start time. Check that the summary shows the service total, one ₹100 advance, the balance due at the salon (or cash change for a service below ₹100), assigned staff, and cancellation terms.
4. Use Razorpay’s current [test payment instructions](https://razorpay.com/docs/payments/payments/test-upi-details/) in the checkout mock. For UPI, the documented success/failure examples are `success@razorpay` and `failure@razorpay`. Follow Razorpay’s test-card documentation for cards. Test credentials and test payers never charge a customer.
5. After a successful test, confirm all of these: Checkout was created with a server order for exactly INR 100; the backend verified the callback signature and fetched/checked provider payment status, amount, currency and order; only then did the booking become confirmed; a signed webhook can safely arrive before or after the browser callback; and customer/owner notification events reach the configured provider.
6. Try a failed or cancelled Checkout and verify that the booking is not confirmed. Let a hold expire and verify it releases its staff/time locks. Use two test browsers to try overlapping times; different eligible employees may serve overlapping visits, but the same employee cannot be double-booked.
7. Cancel a confirmed test booking more than one hour before its start. Confirm that the appointment is released and the refund remains pending until Razorpay reports its result. Test failure and uncertain/manual-review states; do not mark a refund successful merely because a request was accepted. To test webhook idempotency, use the provider dashboard’s retry/redelivery option for the same event, if available, and verify that the event is applied once.

This workspace currently cannot run these provider/database tests: there are no local MongoDB or Razorpay credentials and no isolated staging connection is configured.

## D. Later: configure production safely

1. Finish Razorpay account activation/business verification and confirm that Live API access is enabled in the owner’s dashboard. Test access does not prove production approval.
2. Ensure the final public domain has a valid HTTPS certificate. The current custom-domain certificate had previously shown an error; use the valid HTTPS Render host only for isolated staging until the custom-domain certificate is resolved.
3. After the salon owner approves the launch, switch the Razorpay Dashboard to Live Mode and generate a separate Live Key ID/Secret. In the production backend’s private environment set `RAZORPAY_MODE=live`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and a separately configured `RAZORPAY_WEBHOOK_SECRET`.
4. Add a separate Live webhook at `https://dreambeautystudio.in/api/webhooks/razorpay` only after HTTPS is valid and the production deployment/database have been reviewed. Subscribe to the same five events. Keep production secrets in Render’s secret environment settings.
5. Re-run the readiness and deployment checklist with the salon owner. Only then deliberately enable production booking. Do not use a real payment for a test.

## Code locations

- Service prices, durations, and booking eligibility: `server/src/config/salon.js`
- Fixed ₹100 advance and booking/payment/refund/webhook workflows: `server/src/booking/workflows.js`
- Razorpay API calls and HMAC verification: `server/src/booking/razorpay.js`
- Raw-body webhook endpoint: `server/src/app.js`
- Checkout and booking summary: `client/src/BookingWidget.jsx`
- Example environment names: `.env.example`
