# Deployment runbook

## Current state

The public Render site is <https://dream-beauty-unisex-studio-karanjade.onrender.com/> and the Git remote points to `HardikPampaniya/Salon-Booking`. The service menu and cart-eligibility update is on remote `main`; confirm the corresponding build and deployment in Render. `render.yaml` keeps `BOOKING_ENABLED=false` and `STAFF_ROSTER_APPROVED=false`.

Render environment variables are private to the owner’s dashboard; this workspace cannot inspect them. No separate staging deployment/database is configured. Do not use the production database for test payments or deploy unverified payment changes straight to the public service. Create an isolated staging service and database first, or keep the public booking gate off until staging and browser checks are complete.

## MongoDB setup

1. Use the salon’s existing Atlas project/cluster if it is healthy. Create a dedicated database user with access only to the app database; database login is separate from Atlas website login.
2. Add the API host’s outbound IP ranges in Atlas Network Access. Restrict the list to the API host and development computer; do not use `0.0.0.0/0` for production.
3. In Atlas, open the cluster’s **Connect → Drivers**, select Node.js, and copy the fresh connection URI. Use a database path such as `/salon_bookings` and URL-encode reserved password characters.
4. Put the local URI in the ignored root `.env` as `MONGODB_URI=...`. Add staging/production URIs only in that Render service’s private environment settings. Keep separate databases for production and staging.
5. This app requires MongoDB transactions for hold/employee locks. The server detects replica-set or sharded transaction support at startup. A standalone MongoDB deployment cannot safely run booking holds.

## Salon data and readiness

Before staging:

1. Review `SERVICE_DATA_REVIEW.md`; keep all current owner-supplied prices. Provide an approved positive duration for each service to be offered online. Resolve the four percentage-only offers and the other flagged service wording/inclusions as desired.
2. Configure each active employee’s eligible service IDs, full weekly hours, breaks, leave, and blocked times in the private staff data. Customers do not choose an employee; the server automatically assigns one eligible person for the whole cart.
3. Confirm salon hours, holidays, schedule, automatic staff assignment, cancellation/refund, privacy, and retention policies. Use non-draft approved values for `BOOKING_POLICY_VERSION` and `PRIVACY_POLICY_VERSION`.
4. Keep `STAFF_ROSTER_APPROVED=false` until the salon owner verifies staff coverage and schedules. `salon.bookingSchedule.ownerApproved` must only be true while the salon schedule is actually approved.

## Private staging service

Create a separate Render service/branch or preview with a separate test database. Start with:

| Variable | Staging value / note |
| --- | --- |
| `NODE_ENV` | `production` for a Render-hosted staging service. |
| `MONGODB_URI` | Separate transaction-capable staging database. |
| `BOOKING_ENABLED` | `false` until all staging prerequisites are supplied; turn on only in private staging to run the isolated end-to-end checks. |
| `STAFF_ROSTER_APPROVED` | `false` until the actual test roster and schedules are approved. |
| `SALON_TIMEZONE` | `Asia/Kolkata`. |
| `RAZORPAY_MODE` | `test`; use only `rzp_test_` Key ID and test secret. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Test credentials, backend only. |
| `RAZORPAY_WEBHOOK_SECRET` | Separate strong secret matching the Test Mode webhook. |
| `NOTIFICATIONS_MODE` | `resend` or `whatsapp` with real staging provider credentials; production mock mode is not accepted. |
| `BOOKING_POLICY_VERSION` / `PRIVACY_POLICY_VERSION` | Salon-approved versions; drafts keep readiness disabled. |
| `OWNER_EMAIL`, `EMAIL_FROM`, `RESEND_API_KEY` | Required for Resend mode. Use a verified sender. |
| `WHATSAPP_*` | Required for WhatsApp mode, including sender ID, access token, owner destination and approved customer/owner template names. |
| `CLIENT_ORIGIN` | Exact staging web origin if frontend/API are separate origins. |
| `TRUST_PROXY_HOPS` | Set to the value documented by the selected host. |

Set secrets using Render’s private Environment settings, not `render.yaml`, Git, or `VITE_*` variables. `MONGODB_TRANSACTIONS_SUPPORTED` is detected by the server at startup; do not set it by hand. Review `GET /api/health` and `GET /api/booking/readiness` for sanitized state.

## Razorpay test integration

Follow [RAZORPAY_SETUP_GUIDE.md](RAZORPAY_SETUP_GUIDE.md) for Test Mode keys, an HTTPS webhook to `/api/webhooks/razorpay`, the separate webhook secret, success/failure checkouts, and refund checks. The existing app order is fixed to ₹100 and attached to the booking hold. A Razorpay payment link or standalone payment button is not the appointment checkout.

The custom domain should not be used for production webhook URLs until its TLS certificate is valid. During setup use only a separate staging endpoint/database. Do not enable live payments here.

## Verification before a release

1. Run the project checks from the exact commit: `npm test`, `npm run build`, backend startup/health check, and `git diff --check`.
2. Follow `MANUAL_QA_CHECKLIST.md` on desktop and mobile: category navigation and filtering, direct route refresh, accessibility, appointment durations, staff capacity, and customer wording.
3. In private staging, test distinct eligible employees serving overlapping appointments, same-employee overlap rejection, concurrent holds, hold expiry, provider failures, duplicate webhooks, cancellation cutoff, refund final states, and real notification delivery.
4. Confirm readiness is enabled only in staging and only after every condition is satisfied. Keep public `BOOKING_ENABLED=false` until salon owner sign-off.
5. Review the full diff and make sure `.env`, private staff lists, menu scans, customer data, and `client/dist` are not included in a commit.

## Production release and rollback

The existing Render service is connected to GitHub and may auto-deploy a push to its tracked branch. A push is therefore a production change. Before deploying, verify the target branch and Render deploy settings in the owner’s dashboards, confirm a passing staging run and browser review, and agree on the release.

For the production service, configure the salon-approved database, correct Live Razorpay keys and a separate Live webhook, verified notification sender/templates, exact origins, and valid HTTPS custom-domain certificate in Render’s private environment. Keep booking disabled until the owner explicitly approves launch. Live credentials are separate from test credentials; never put them in the client.

If a deploy fails, use Render’s previous successful deploy/rollback control. Verify `/api/health` and the public pages after rollback. Do not roll back by deleting booking/payment database records or manually changing refund states. Keep encrypted backups and test restore against an isolated database before launch.
