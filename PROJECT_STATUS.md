# Project status

## Completed in this milestone

- Inspected the existing code, tests, docs, Render config, Git branch/remotes, and service catalog before making changes. Kept the existing repository architecture and service records.
- Reorganized the 200-service menu into Women (34), Men (30), and Beauty services (136), with service subcategories, category routes, category images, search/filter controls, and old route aliases. Beauty services are not labelled Unisex because audience-wide eligibility has not been confirmed.
- Kept every readable salon-supplied price as currently configured. The four percentage-only offers have no payable prices and remain outside cart selection.
- Created [SERVICE_DATA_REVIEW.md](SERVICE_DATA_REVIEW.md), listing all 200 service records, configured prices, durations, source notes, menu eligibility, and exact unresolved owner confirmations.
- Kept menu browsing separate from booking eligibility. A bookable service requires an active record, approved customer wording/inclusions, positive price, and positive duration.
- Updated availability and hold creation to calculate the cart’s combined duration, respect salon/staff schedules, breaks, leave, blocked periods, existing appointments, and active holds, and automatically select an employee eligible for every service in the cart. No customer employee selector is shown.
- Replaced global arrival-slot locks with per-employee 15-minute reservation locks so separate employees can serve overlapping bookings. Existing legacy arrival reservations remain for earlier records only.
- Kept the fixed ₹100 advance server-created and tied to a booking hold; the previous standalone Razorpay payment button was removed. Server-side order amount/currency, checkout signature, payment state, raw-body webhook signatures, event idempotency, cancellation cutoff and refund reconciliation remain enforced.
- Added [RAZORPAY_SETUP_GUIDE.md](RAZORPAY_SETUP_GUIDE.md) with test/live separation, environment names, webhook steps, test payment steps, and launch restrictions.
- Updated README, maintenance, status, changelog, menu review, API reference, deployment notes, and manual QA guidance to match the current appointment-start-time and staff-duration model.
- Booking remains disabled in `render.yaml`; no live credentials or public checkout were enabled.

## Verification

- Baseline before edits: 30 server tests and 6 client tests passed; frontend build passed.
- Final verification: 35 server tests and 6 client tests passed.
- Frontend production build passed with `npx vite build --configLoader runner --config vite.config.js` (33 modules transformed). The regular build command still hits the environment’s esbuild parent-directory permission issue.
- Final API startup smoke check returned HTTP 200 for the site and `/services/women`, returned 200 services and all three canonical group paths, reported booking disabled, and returned HTTP 503 for unavailable appointment times.
- Final `git diff --check` and server JavaScript syntax checks passed.
- Automated visual QA could not run: the available computer-use browser bridge failed to connect to its native pipe. No browser screenshot, keyboard, screen-reader, or responsive visual QA is claimed.

## Current blockers

- All 200 service durations are unset. Thirty records carry wording, package, or price confirmation flags. Four offers do not have a final payable price.
- No employee roster, service eligibility, schedules, breaks, or leave have been configured or owner-approved. The server must automatically assign one employee qualified for every service in a cart.
- The local `.env` has an empty MongoDB URI and empty Razorpay credentials; no local end-to-end payment or transaction test has been run. WhatsApp/Resend credentials are also absent.
- No private staging database/deployment is configured. The changes were pushed to a separate GitHub review branch only; the live Render deployment remains on its current revision. Do not deploy directly to production before staging, browser review, provider tests, and owner sign-off.
- The custom-domain HTTPS certificate previously showed an error. Confirm a valid certificate before using that domain for production webhook delivery.
- The browser automation bridge is unavailable; follow [MANUAL_QA_CHECKLIST.md](MANUAL_QA_CHECKLIST.md) on a local browser or staging deployment.

## Needed from the salon owner

1. Review the flagged entries and missing prices in `SERVICE_DATA_REVIEW.md`; for the four offers, provide final customer prices and offer conditions/dates.
2. Provide an approved positive duration for each service intended for online booking. Durations are used to reserve the real appointment interval and cannot be guessed.
3. Provide each employee’s name/ID, eligible service IDs, weekly hours, breaks, leave, and blocked time. Confirm the roster and salon calendar before `STAFF_ROSTER_APPROVED=true` or schedule approval.
4. Confirm whether the Beauty services group is for a defined audience or intended for everyone; do not call it Unisex until confirmed.
5. Finish provider setup in private dashboards: transaction-capable MongoDB, Razorpay Test API keys and webhook, and actual customer/owner notification delivery. Never send credentials in chat.
6. Approve final booking, cancellation/refund, privacy, and data-retention wording.

## Git and deployment

The menu reorganization, booking-readiness changes, and service-card update are published to remote `main` for the connected Render service to fetch. Verify the build/deploy result in Render. `BOOKING_ENABLED` remains false in the checked-in Render blueprint, and this release does not enable booking or payment collection.
