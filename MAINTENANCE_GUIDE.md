# Maintenance guide

## Current operating status

The marketing site and service menu are available. Online booking and payment remain disabled. This version books appointment start times, calculates service durations, and automatically assigns an eligible employee. It does not let customers choose staff. Do not switch on booking until the service data, staff roster, database, payment, notification, policies, and staging verification are complete.

## Source files

```text
client/src/routes.js                 Page and category routes
client/src/App.jsx                   Marketing pages and service-menu UI
client/src/BookingWidget.jsx         Cart, availability, booking and checkout UI
client/src/styles.css                Responsive presentation and focus styles
client/src/service-images.js         Local category/gallery image map and alt text
server/src/config/salon.js           Salon profile, service groups, names, prices, durations
server/src/app.js                    API, validation, Razorpay webhook endpoint
server/src/booking/availability.js   Salon-local hours and employee capacity calculation
server/src/booking/workflows.js      Holds, employee assignment, payment, cancellation, refund, webhook
server/src/booking/reservation-locks.js  15-minute employee lock segments
server/src/booking/razorpay.js       Server API calls and checkout/webhook HMAC checks
server/src/booking/notifications.js  Durable email/WhatsApp outbox and delivery
server/src/models/                   Booking, staff, payment, refund, webhook and lock schemas
server/test/                         API, schedule/capacity, policies, payment helpers and locks
```

## Menu data and approval

The canonical catalog is `server/src/config/salon.js`; do not create a second list in the client. Each service has a stable ID, group/category, customer name, display price, numeric rupee amount, optional duration, active flag, and confirmation status. The API feeds both menu pages and booking validation.

The current menu has 200 services across Women, Men, and Beauty services. See `SERVICE_DATA_REVIEW.md` for every current price, confirmation flag, duration gap, and source note. The older `MENU_DATA_REVIEW.md` provides scanned PDF page reconciliation. Keep every price the owner supplied unless they confirm an adjustment. Do not infer a percentage offer’s payable price or change a package’s contents from an individual-service price.

To approve a service for online booking, update its wording/inclusions and numeric/display prices if the owner confirms a correction, set its positive `durationMinutes`, keep `active: true`, and clear `needsConfirmation` only after the owner approves it. The helper computes `bookable`; do not hardcode or force the result. A service without a positive price/duration or with an unresolved flag must not be accepted by the hold endpoint.

Salon hours and special periods are in `salon.bookingSchedule` in `server/src/config/salon.js`, in the salon timezone. Owner-approve the weekly schedule, breaks, holidays, and blocked periods before opening bookings. Beauty services are not labelled Unisex unless the owner confirms the audience.

## Employee records and capacity

Customers never choose an employee. Store active staff records with `serviceIds`, complete seven-day `weeklyHours`, leave dates, breaks, and blocked periods. `scripts/sync-staff.js` imports the private roster and should be run only after reviewing the local file format and secure handling. Keep roster data out of Git.

For one cart, a single assigned employee must support every selected service and be free for the combined duration. The appointment must fit inside salon and employee working time and avoid breaks, leave, blocked periods, existing bookings, and unexpired holds. Different employees may have overlapping appointments. Per-employee reservation locks use a unique `{ staffId, slotAt }` index over each 15-minute interval. A unique-index conflict prevents two concurrent requests from assigning the same employee for overlapping time. A ten-minute hold expiration releases its locks; MongoDB TTL is cleanup assistance, while workflow code checks expiration for correctness.

Booking readiness requires `STAFF_ROSTER_APPROVED=true` only after the owner confirms that roster and schedules. Readiness also checks that active, complete staff schedules cover every bookable service. The customer selector remains removed.

## Local development and checks

Copy `.env.example` to `.env` in the repository root, install packages, then run:

```powershell
npm install
npm run dev
npm test
npm run build
```

`.env` is ignored by Git. The server loads the root environment file and listens on port 5000; Vite serves port 5173 and proxies `/api`. Local mock notifications record `mocked` and do not send email or WhatsApp. Mock mode cannot be used to enable production booking.

## Readiness gates and environment variables

`BOOKING_ENABLED` must remain `false` in production until staging sign-off. Runtime readiness also requires a reachable MongoDB replica set/sharded deployment (the server checks transaction support at connection), `STAFF_ROSTER_APPROVED=true`, owner-approved salon schedule, at least one valid bookable service, staff coverage for each bookable service, mode-matching Razorpay keys and webhook secret, a configured real notification provider, non-draft booking/privacy policy versions, and a valid booking horizon.

Important variables in `.env.example`:

- `MONGODB_URI` — private database URI. Use separate production and staging databases.
- `BOOKING_ENABLED` — explicit server gate. Keep false until approval.
- `STAFF_ROSTER_APPROVED` — owner gate; never set true for an empty or unverified roster.
- `RAZORPAY_MODE`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — mode, API credentials and separate webhook secret. Keep all secrets in server environment only.
- `NOTIFICATIONS_MODE` — `mock` for local development, or a configured real `resend`/`whatsapp` integration. The project has no SMS provider.
- `RESEND_API_KEY`, `EMAIL_FROM`, `OWNER_EMAIL` — Resend path.
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, owner/customer template variables — WhatsApp Cloud API path. Customer messages require opt-in and approved templates.
- `BOOKING_POLICY_VERSION`, `PRIVACY_POLICY_VERSION` — set to approved versions only after policy content is finalized.

See `RAZORPAY_SETUP_GUIDE.md` and `DEPLOYMENT_RUNBOOK.md` for provider dashboards and deployment steps. Never paste credentials into source files, the browser, Git, or chat.

## Appointment and payment lifecycle

The client asks `GET /api/availability` for candidate appointment start times for its service IDs. The backend sums approved service durations, filters by staff capability/schedule/leave/blocks and active locks, and returns starts where one employee can perform the whole cart. `POST /api/bookings/holds` validates all service data again, assigns one employee automatically, snapshots the service and duration data, inserts lock segments and creates a Razorpay order for the fixed ₹100 advance (10,000 paise) inside a transaction. The browser cannot choose the amount.

The ten-minute hold remains temporary until the payment is verified. Checkout confirmation checks the Razorpay signature, fetches provider payment status, and matches order, INR currency, and 10000 paise before confirming. Signed webhooks use the exact raw body and deduplicate event IDs; the browser callback and webhook can be processed in either order. A late capture or conflicting booking is routed through the established refund/manual-resolution paths rather than silently confirming a conflicting appointment.

The fixed advance is `ADVANCE_PAISE` in `server/src/booking/workflows.js`. If the owner later changes the amount, update the server constant, client summary/consent, notification copy, tests, approved terms, and policy version together. The remaining balance is paid at the salon; for service totals below ₹100 the configured UI/policy says the difference is returned in cash after service.

Cancellation is allowed only at least 60 minutes before the appointment start. A qualifying cancellation releases employee lock segments and requests refund of the captured ₹100 to the original method. Refund requests are idempotent. Uncertain provider responses require manual review; do not blindly retry or tell the customer a refund is complete until Razorpay confirms it.

## MongoDB records

- `bookings` — customer/contact data, service and duration snapshots, employee, appointment interval, status and hashed management token.
- `staff` — active service eligibility and schedule/leave data.
- `slotreservations` — unique employee/time lock segments for held/confirmed appointments.
- `arrivalreservations` — legacy records for the earlier arrival-only model; new holds use `slotreservations`.
- `payments`, `refunds`, `webhookevents` — provider transaction state and deduplication.
- `notifications` — durable notification outbox.
- `bookingauditevents` — deduplicated booking/payment/refund transitions without customer contact fields.

MongoDB transactions are required for holds and lock assignment; standalone MongoDB cannot provide the concurrency guarantee. Never run destructive index synchronization or schema cleanup against production without a reviewed backup and migration plan.

## API and deployment

See `API_REFERENCE.md` for exact endpoint payloads. The app serves marketing endpoints when no database is configured; booking readiness remains false. The single-origin Render service serves `/api` and the Vite build. Route direct page requests to the SPA entry point on any separate static host. The production blueprint retains `BOOKING_ENABLED=false`.

Do not push unreviewed changes directly to the production service. The current work has no separate staging service/database and has not been pushed. Before rollout, run the full checks, manually inspect desktop/mobile and keyboard behavior, test Razorpay end-to-end against an isolated replica set and Test Mode keys, verify notification delivery, and obtain owner sign-off. Follow `DEPLOYMENT_RUNBOOK.md` for rollback and recovery.
