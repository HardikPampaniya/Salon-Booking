# Deployment runbook

This repository contains a Render Blueprint for a public preview. No cloud account, Git remote, domain, database, Razorpay account, or email account has been connected.

## 0. Publish a first website preview

The Render Blueprint deploys one Node web service that builds the React site and serves it with the Express API from the same HTTPS origin. The current workspace has no Git remote, so first create a private GitHub repository and push this project (do not add `.env`; it is ignored). Then in Render:

1. Choose **New → Blueprint**, connect the GitHub repository, and select its `render.yaml`. Review the service values and create the service. If using **New → Web Service** instead, set build command `npm ci && npm run build`, start command `npm start`, and health check path `/api/health`.
2. Use the free instance only for a public preview and Razorpay website verification. Free web services can sleep after inactivity and take about a minute to wake. Choose a paid always-on instance before accepting real customer bookings or depending on payment webhooks.
3. The generated `onrender.com` origin is automatically permitted for API requests. If you later attach a custom domain, add its exact origin to `CLIENT_ORIGIN` in Render’s Environment settings.
4. The app deploys the site whenever you push a later code change to the connected branch. The public URL stays the same; review the change and wait for its deployment to finish before sharing it.
5. Keep `BOOKING_ENABLED=false`. The service starts without MongoDB so the public marketing pages can be reviewed first. Do not add `MONGODB_URI` to Render until the Atlas IP access list includes Render's outbound range(s).

The free Render service and the current payment button are not a production booking setup. The standalone ₹100 button is not attached to a reservation; its on-page notice tells customers that paying does not reserve their selected slot. Do not advertise it as a booking deposit until the payment is tied to a confirmed booking.

## 1. Prepare salon-approved content

1. Review the supplied profile and menu in `server/src/config/salon.js`. A priced service with clear wording is eligible for booking; unresolved offer prices, names, or package details stay out of checkout. Service durations and employee rosters are not required.
2. The current schedule is Monday-Sunday, 9:00 AM-9:00 PM Asia/Kolkata. Add any breaks, holidays, special hours, or public-phone changes to `server/src/config/salon.js`.
3. Confirm the supplied salon photographs and review excerpts are approved for publication.
4. Approve the arrival-time wording, one-hour cancellation/refund terms, and privacy notice. Set reviewed values for `BOOKING_POLICY_VERSION` and `PRIVACY_POLICY_VERSION` before opening bookings.
5. Keep checkout disabled until database, Razorpay, notification, privacy, and staging checks are complete.

## 2. Provision services

- Use MongoDB Atlas or another managed MongoDB replica set/sharded deployment that supports transactions. A standalone local `mongod` is not sufficient for atomic booking holds.
- Create a dedicated database user with access only to this application database. Restrict network access to the API host, require TLS, and use a separate database for test/staging.
- The API creates required collections and indexes during startup. The unique `{ visitDate, slotAt }` index prevents two customers from reserving the same 15-minute arrival time. Confirm startup logs report `transactionsSupported: true` and `indexesReady: true`.
- Store the database URI in the API host’s secret settings. Do not place it in Vite client environment variables.

### Find the Atlas connection URI

In [MongoDB Atlas](https://cloud.mongodb.com/), open the project and cluster used by this app, select **Connect → Drivers**, choose **Node.js**, and copy the connection string. Create or select a **Database User** (this is separate from the email/password used to sign in to Atlas). Replace the URI's `<password>` placeholder with that database user's password, URL-encoding any reserved characters. Put the application database name (for example, `salon_bookings`) in the path before the `?` options. Never paste the real URI into chat or commit it.

Before adding the URI to Render, open **Network Access** in Atlas and add the Render service's outbound IP ranges. Find those in the Render service page under **Connect → Outbound**. Do not use `0.0.0.0/0`. Store the completed URI as the `MONGODB_URI` secret in Render, not in `client/.env` or a `VITE_*` variable. The real URI belongs in the ignored root `.env` only for local use.

## 3. Configure the API host

Set these values in the server environment (never in Git):

| Variable | Setup |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | Provided by the host, if required. |
| `MONGODB_URI` | TLS-protected replica set URI and least-privilege database user. |
| `CLIENT_ORIGIN` | Exact production client origin(s), comma-separated if needed. |
| `TRUST_PROXY_HOPS` | Number of trusted reverse proxies in front of the API; use the host’s documented value. |
| `SALON_TIMEZONE` | Approved IANA timezone, such as `Asia/Kolkata`. |
| `BOOKING_ENABLED` | Keep `false` through testing; use `true` only after every launch check passes. |
| `NOTIFICATIONS_MODE` | `resend` for staging/production. The development-only `mock` mode never sends messages and is rejected with production or live payment mode. |
| `BOOKING_POLICY_VERSION` | Approved policy revision; `draft-v1` keeps booking disabled. |
| `PRIVACY_POLICY_VERSION` | Approved privacy revision; `draft-v1` keeps booking disabled. |
| `RAZORPAY_MODE` | `test` during staging; the key ID must start `rzp_test_`. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Test-mode credentials first. Keep the secret on the server only. |
| `RAZORPAY_WEBHOOK_SECRET` | Independent secret configured for the matching Razorpay webhook. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Verified sender and provider key for the Resend email API. |
| `OWNER_EMAIL` | Salon inbox required for booking readiness; receives booking/refund notifications. |
| `PUBLIC_SALON_NAME` | Approved name used in notification messages. |

The server expects auto-capture to be enabled in the Razorpay account. An `authorized` payment alone does not confirm the appointment. Confirm a `captured` payment through the signed browser callback or signed webhook. Use Razorpay test mode for the full flow before switching any credentials to live mode.

## 4. Configure the browser app

Build the Vite client with `VITE_API_BASE_URL` pointing to the HTTPS API origin when the client and API use separate domains. Leave it empty when a same-origin reverse proxy routes `/api` to Express. This variable is public and must never contain a secret.

The client uses History API routes. Configure the static host to serve `client/dist/index.html` for direct requests to `/`, `/our-story`, `/services`, `/services/*`, `/visit-us`, `/book`, and other client paths. Preserve existing static asset handling so `/assets/*` and `/images/*` return their files, and keep `/api/*` routed to Express. Verify a browser refresh on each route after deployment.

```powershell
$env:VITE_API_BASE_URL = 'https://api.example.invalid'
npm run build
```

Serve the generated `client/dist` over HTTPS. Configure the API host to accept that exact browser origin in `CLIENT_ORIGIN`. The development server already proxies `/api` to `http://localhost:5000`.

## 5. Configure Razorpay webhook delivery

In the Razorpay dashboard, configure the HTTPS endpoint `https://<api-origin>/api/webhooks/razorpay` with the same webhook secret as `RAZORPAY_WEBHOOK_SECRET`. Subscribe to `payment.authorized`, `payment.captured`, `payment.failed`, `refund.processed`, and `refund.failed`. Configure test-mode webhooks first and verify delivery and signatures before live setup. Never expose the webhook secret in the browser.

## 6. Verify before opening booking

1. `npm test` and `npm run build` pass in the release checkout.
2. `GET /api/health` responds without secrets; `GET /api/booking/readiness` returns `enabled: true` and an empty `issues` list.
3. Confirm salon hours, holidays, timezone, and arrival-time handling on representative dates.
4. Test a same-arrival-time conflict and a different arrival time against a staging replica set.
5. Complete a Razorpay test payment and verify visit confirmation only after capture.
6. Test a failed payment, closed Checkout window, expired hold, captured payment after an expired hold, cancellation, refund processing/failure, duplicate webhook delivery, and uncertain refund submission.
7. Verify owner/customer notification handling from the outbox. Confirm message text and recipient addresses.
8. Review mobile/desktop layout, keyboard use, screen-reader labels, privacy copy, booking policy, email content, and CORS from the deployed domain.
9. Keep `BOOKING_ENABLED=false` until the salon owner signs off on the live readiness report. Set it to `true` only after sign-off.


## 7. Backups and recovery

- Enable encrypted automated backups or point-in-time recovery with a retention period approved by the salon. Restrict restore access to named operators.
- Back up the application database, including `bookings`, `arrivalreservations`, `payments`, `refunds`, `notifications`, `webhookevents`, and `bookingauditevents`. Do not treat a source-code backup as a booking backup.
- Run a restore exercise to a separate staging database before launch and on a recurring schedule. Verify a restored booking, payment state, and refund history without sending real provider requests.
- For a lost or uncertain refund response, use the booking reference/refund notes to check Razorpay. Do not click retry or submit another refund until the first request is reconciled. Update the tracked status only after provider evidence.
- If the API or database is unavailable, checkout stays disabled. Arrival-time browsing may still show the salon schedule, but no booking is confirmed without a healthy database and payment flow.

## 8. Security operations

- Use HTTPS end to end; store secrets in the host’s secret manager; rotate a leaked key in the provider dashboard and redeploy.
- Use separate test and live Razorpay keys/webhook secrets. `RAZORPAY_MODE` and key-prefix checks prevent an accidental mode mismatch.
- Keep MongoDB, Razorpay, and email-provider roles least-privileged. Require MFA on provider dashboards.
- Do not add booking data to browser analytics, URLs, application logs, screenshots, or Git. Management tokens are bearer secrets; they are hashed in the database and kept in browser session storage.
- Review access to customer contact details and set a salon-approved retention/deletion policy before collecting them.
- The API has per-process rate limits. If running multiple instances, configure a shared rate-limit store at the hosting layer before scaling horizontally.
