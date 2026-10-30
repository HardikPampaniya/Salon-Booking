# Razorpay setup for hourly-arrival checkout

The cart checkout creates a Razorpay order on the server for the selected services and one fixed **₹100 advance**. Razorpay Checkout pays that order, and the server confirms the booking only after verifying the payment. A Razorpay.me link, payment button, or QR code is a separate collection flow and will not automatically reserve the cart's date and arrival window.

The selected time is a one-hour **planned arrival window** (for example, 10:00–11:00 AM). It does not promise that a service starts at the beginning of that hour. Staff schedules, employee selection, and service durations are not booking requirements. WhatsApp delivery is still pending and is not a payment-readiness requirement.

## Why the Pay button may be disabled

The button is enabled only when booking readiness is satisfied. This workspace's local `.env` has no MongoDB URI or Razorpay credentials, and public Render checkout remains disabled. A set of masked Render environment values does not verify that they are correct or that the database supports transactions.

Do not paste API secrets, database credentials, or webhook secrets into chat, source files, `.env.example`, or any `VITE_*` variable.

## 1. Use Razorpay Test Mode first

1. Sign in to the salon's [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Switch to **Test Mode** using the dashboard's mode switch. Test and Live credentials are separate.
3. Open **Account & Settings → API Keys** (the exact label may vary) and generate a Test Key ID and Key Secret. Copy them into the ignored root `.env` file on your computer. Do not use `rzp_live_...` keys for this test.

   ```dotenv
   RAZORPAY_MODE=test
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=your_test_key_secret
   ```

Razorpay's [API key instructions](https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/) explain where keys are generated. The Key Secret belongs only on the server. The app sends the Key ID and server-created order ID to the browser.

## 2. Provide an isolated transaction-capable database

Booking holds use MongoDB transactions to prevent two customers taking the same one-hour arrival window. Use a **separate test database** on MongoDB Atlas or another replica-set/sharded deployment. Do not use the salon's production booking data for payment tests.

Add its URI to the root `.env` as `MONGODB_URI=...`, then restart the server. The app detects transaction support when it connects. Do not set `MONGODB_TRANSACTIONS_SUPPORTED` yourself. The current local setup has no URI, so this step is still needed before checkout can be enabled locally.

## 3. Configure and test the webhook

The app verifies Razorpay's signed webhook events and deduplicates retries. Razorpay needs a public HTTPS callback; it cannot deliver a webhook directly to `localhost`.

1. In Test Mode, open **Account & Settings → Webhooks** in the Dashboard.
2. For an isolated staging deployment, use:

   ```text
   https://YOUR-STAGING-HOST/api/webhooks/razorpay
   ```

   Do not point a test webhook at a production database. A local webhook test needs a temporary HTTPS tunnel and should still use only the isolated test database.
3. Create a strong webhook secret in Razorpay and set the exact same value as `RAZORPAY_WEBHOOK_SECRET` in that backend's private environment. This is separate from the API Key Secret.
4. Subscribe to `payment.authorized`, `payment.captured`, `payment.failed`, `refund.processed`, and `refund.failed`, then save.

See Razorpay's [webhook setup guide](https://razorpay.com/docs/webhooks/setup-edit-payments/) and [webhook signature guide](https://razorpay.com/docs/webhooks/validate-test/). Configure Test and Live webhooks separately.

## 4. Enable checkout only in private testing

For a private local or staging test, configure all of the following in that test backend:

- `BOOKING_ENABLED=true`
- `MONGODB_URI` pointing to the isolated transaction-capable test database
- `RAZORPAY_MODE=test`
- Test `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- The matching Test `RAZORPAY_WEBHOOK_SECRET`
- Approved, non-draft `BOOKING_POLICY_VERSION` and `PRIVACY_POLICY_VERSION` values after the salon approves the displayed terms

Keep public Render's `BOOKING_ENABLED=false`. Restart the local app after changing `.env`. Open `http://localhost:5173`, add a checkout-eligible service, choose an available date and one-hour arrival window, enter the customer's full name, phone, gender, and age, then press **Pay ₹100 advance**.

Use Razorpay's [test payment instructions](https://razorpay.com/docs/payments/payments/test-upi-details/). For a simulated UPI success, use the documented test VPA `success@razorpay`; use the documented failure test details to check a failed payment. Test mode simulates the result and transfers **no real money**. Confirm the payment in the Dashboard with Test Mode selected under **Transactions → Payments**, and confirm the app only confirms the appointment after server verification. Also check failed/cancelled checkout and webhook retry behavior.

## 5. When real money can be accepted

First finish private test-mode checks, approve the booking/privacy wording and service prices, verify the public HTTPS domain and database backups, and have the salon owner approve public checkout. Confirm Razorpay has activated Live payments for the account.

Only then generate separate Live API keys, set `RAZORPAY_MODE=live` and those keys in Render's **private environment settings**, create a separate Live webhook and secret, and deliberately enable public booking. Live keys start real transactions and are not a safe way to test. A real payment may incur Razorpay fees and should only be made by a consenting customer; confirm capture and settlement in the Live Dashboard.

The existing checkout already uses server-created orders, which is the right path for matching ₹100 payment with the chosen cart and arrival window. A standalone Razorpay payment link or QR may collect ₹100, but by itself it cannot confirm this site's booking or associate the payment with the selected services, time, and customer details.

## Code and configuration locations

- Menu and opening hours: `server/src/config/salon.js`
- ₹100 order, booking holds, payment verification, refunds, and webhooks: `server/src/booking/workflows.js`
- Razorpay requests and signature checks: `server/src/booking/razorpay.js`
- Checkout UI: `client/src/BookingWidget.jsx`
- Environment variable names (blank/example values only): `.env.example`
