# Deployment runbook

## Current state

The public Render site is <https://dream-beauty-unisex-studio-karanjade.onrender.com/>. `render.yaml` keeps `BOOKING_ENABLED=false`. The arrival-time checkout changes in the current workspace are not committed or deployed. Render environment values are private to the owner's dashboard and cannot be inspected here.

Do not run test payments against the production database or live Razorpay keys. Use a separate staging service and database, or leave public booking disabled until the private test flow and browser review pass.

## MongoDB

1. Use the salon's existing Atlas cluster if healthy. Create a dedicated database user with access only to the app database.
2. In Atlas Network Access, allow the API host's outbound IP ranges and the development computer as needed. Avoid `0.0.0.0/0` for production.
3. In Atlas, open the cluster's **Connect > Drivers**, select Node.js, and copy the connection URI. Use a database path such as `/salon_bookings` and URL-encode reserved password characters.
4. Put the local URI in the ignored root `.env` as `MONGODB_URI=...`. Add a separate staging URI only to staging's private Render environment.
5. Booking holds require MongoDB transaction support (replica set or sharded deployment). The server detects transaction support at startup; do not set `MONGODB_TRANSACTIONS_SUPPORTED` manually.

## Booking configuration

1. Review `SERVICE_DATA_REVIEW.md`. Services with unresolved wording or no final payable price remain unavailable for checkout. No service duration or employee data is needed.
2. Confirm the salon's weekly opening hours in `server/src/config/salon.js`. The current schedule is seven days, 9:00 AM-9:00 PM.
3. Approve booking/cancellation terms and the privacy/data-retention wording. Set non-draft values for `BOOKING_POLICY_VERSION` and `PRIVACY_POLICY_VERSION` in the server environment.
4. Keep `BOOKING_ENABLED=false` until staging checks are complete and the salon owner approves public checkout.

## Private staging service

Create a separate Render service/branch and use a separate transaction-capable database.

| Variable | Staging value / note |
| --- | --- |
| `NODE_ENV` | `production` for a Render-hosted staging service. |
| `MONGODB_URI` | Separate transaction-capable staging database. |
| `BOOKING_ENABLED` | `false` until staging prerequisites are supplied; enable only in private staging for isolated checks. |
| `SALON_TIMEZONE` | `Asia/Kolkata`. |
| `RAZORPAY_MODE` | `test`; use only an `rzp_test_` Key ID and test secret. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Test credentials, backend only. |
| `RAZORPAY_WEBHOOK_SECRET` | Separate secret matching the Test Mode webhook. |
| `BOOKING_POLICY_VERSION` / `PRIVACY_POLICY_VERSION` | Approved non-draft values. Draft values keep readiness disabled. |
| `CLIENT_ORIGIN` | Exact web origin if frontend and API use separate origins. |
| `TRUST_PROXY_HOPS` | Value documented by the selected host. |

WhatsApp is not part of current booking readiness and is not sent. Configure it later only after the sender number, access token, approved templates, and owner/customer destinations are ready. Do not set WhatsApp mode now expecting it to work.

Set secrets in Render's private Environment settings, not `render.yaml`, Git, or `VITE_*` variables. Review `/api/health` and `/api/booking/readiness` for sanitized status.

## Razorpay staging

Follow `RAZORPAY_SETUP_GUIDE.md` for Test Mode keys and an HTTPS webhook at `/api/webhooks/razorpay`. Keep the webhook secret separate from the API secret. The app creates a server-side Razorpay order for INR 100 only after it holds the selected cart and arrival slot. A payment link or standalone payment button is not the appointment checkout.

## Before deployment

1. Build and review the exact commit intended for deployment; check `git diff --check` and the existing automated suite.
2. Follow `MANUAL_QA_CHECKLIST.md` on desktop/mobile, including the checkout fields and date/time selector.
3. In private staging, verify successful and failed payments, signature verification, webhook idempotency, simultaneous requests for one arrival time, hold expiry, cancellation cutoff, refunds, and management access.
4. Keep public `BOOKING_ENABLED=false` until those checks pass and the owner signs off.
5. Check the exact branch tracked by Render. A push may auto-deploy to the public service.

## Production and rollback

For production, set the salon-approved database, matching Live Razorpay credentials and a separate Live webhook, exact origins, and valid HTTPS. Keep `BOOKING_ENABLED=false` until the owner explicitly approves launch. Live credentials must never be placed in the client or source control.

If a deployment fails, use Render's prior successful deploy/rollback control. Verify `/api/health` and the public pages afterward. Do not delete booking/payment records or manually change refund states to roll back. Keep encrypted backups and test restoration against an isolated database.
