# Project status

## Completed

- Replaced the cart's long arrival-time grid with a compact selector that opens a keyboard-accessible modal list; updated directions to the owner's supplied Google Maps link and changed the Call the studio link to the WhatsApp number.
- Added a local-storage service cart to the home/category menus and turned `/book` into a combined cart, date, arrival-time, and checkout page. The cart supports up to 20 distinct services and applies one ₹100 advance per visit.
- Extended the booking hold schema/model to accept service IDs, calculate the combined price on the server, save a price/name snapshot for every item, and show itemized services in booking management and email notifications. Legacy single-service API requests remain supported.
- Added WhatsApp Cloud API notification delivery for booking confirmations after a payment is verified as captured. The salon owner receives customer details, services, date/time, total, and advance; a customer message is sent only after optional checkout consent.
- Added persistent customer WhatsApp consent (including timestamp and consent-copy version), approved-template payloads for owner/customer, notification readiness checks, and manual review for uncertain WhatsApp send results so the system will not blindly duplicate a message.
- Added Meta template/setup instructions and the remaining Atlas, Razorpay, Render, and WhatsApp steps to README and the deployment runbook.
- Added polished cart, item removal, confirmed-price totals, unresolved-item warnings, and empty-cart navigation. Services whose current `needsConfirmation` flag is true cannot be added to checkout.
- Documented the menu source edit path (`server/src/config/salon.js`) and public HTTPS staging workflow for Razorpay website verification in README.
- Audited the React/Vite + Express/MongoDB workspace, confirmed the current menu and launch gates, and recorded baseline results before implementation: 30 server tests passed; the production frontend build passed.
- Split the long landing page into /, /our-story, /services, /services/womens-hair, /services/beauty, /services/mens, /visit-us, /book, and a not-found page. The lightweight History API router supports direct client routing without a new routing dependency.
- Kept the 31 chat-supplied menu entries and added 16 individually priced services with legible handwritten prices from the salon PDF; then added 153 entries from five newer handwritten photos. The public menu now has 200 entries.
- Updated three clearly superseded prices from the newer photos: temporary hair ironing to ₹800, face-wax sides to ₹250, and men's Keratin to ₹1,000. Corrected the face-wax labels to match the newer sheet.
- Copied the five handwritten price photos out of generated `client/dist/images/` into the ignored `docs/source-material/` folder. They are private menu references, not salon photography, and are not displayed to customers.
- Reviewed the supplied Razorpay `razorpay.me` collection page. It remains a manual payment option only; the appointment flow needs a separate ₹100 order tied to each held appointment, so no public pay link was added.
- Found a database credential in `.env.example`, cleared it from the template, and documented password rotation. The URI had an Atlas-style three-node replica-set structure but no database name path; no fresh connection has been tested or configured in root `.env`.
- Kept unsupported salon history, awards, qualifications, and aggregate review claims off the pages. Added all 11 customer-feedback entries supplied by the user to an automatic carousel with clickable selection dots, consistent quote typography, and a four-second interval.
- The /book page now lets customers browse eligible services, dates, and 15-minute arrival times even while checkout is disabled. After 9:00 PM salon time, the default visit date advances to tomorrow.
- Reworked reservations to book an arrival time without service durations or staff assignment. The service starts when a team member is available; the selected arrival time is reserved with a transactional lock.
- Implemented customer date and 15-minute arrival-time selection. Times follow salon-local hours, past times are removed, the date defaults to tomorrow after closing, and the date/API are limited to the configured booking horizon.
- Updated the booking API and management record to reserve a unique arrival time transactionally; made the date optional only for legacy booking records.
- Removed staff-roster and duration requirements from booking readiness. The salon's supplied seven-day 9:00 AM–9:00 PM schedule is the current booking window; special closures still need to be added when provided.
- Reviewed the booking/payment/refund path at code level: transactional arrival-time locks, expiring holds, constant-time HMAC checks, provider-side payment verification, amount/currency matching, webhook deduplication, the one-hour-before-arrival cancellation cutoff, and manual review for uncertain refunds are present. Replica-set and provider behavior remains unverified without staging credentials.
- Mapped the three newly supplied category photos and three existing salon gallery photos with descriptive alt text. The "D" monogram remains until a standalone logo is supplied; no external or scraped images are used.
- Reviewed the 18-page scanned salon menu PDF. The owner confirmed handwritten prices are current; added the 16 legible, individual corrections and documented unreadable facial, cleanup, and men's treatment amounts in MENU_DATA_REVIEW.md.
- Updated the displayed studio address with Plot No. 16 from the PDF cover; the supplied WhatsApp number matches the cover.
- Updated README, maintenance guide, manual QA checklist, deployment instructions, and this status file for the multi-page site, asset workflow, and menu review.
- Recorded the owner's latest decisions: preserve supplied readable prices, defer unresolved offers/packages/names, use a fixed ₹100 advance with cash change returned after lower-priced services, and allow date/time booking without staff or duration checks. Added a step-by-step Atlas/Razorpay test setup guide.
- The booking list/readiness includes services with a known positive price and wording that needs no confirmation. Unresolved names, prices, offers, and packages remain out of checkout.
- Kept MongoDB, Razorpay, notification, privacy-policy, and explicit booking-enable gates in place. No live payment or public checkout was enabled.

## Verification

- `npx vite build --configLoader runner --config vite.config.js` — passed (Vite 7.3.7, 33 modules transformed) after the compact arrival-time selector and contact-link updates.
- 2026-10-24 WhatsApp integration update: Vite production build passed using `npx vite build --configLoader runner --config vite.config.js` (33 modules); edited server modules passed `node --check`; `git diff --check` passed. The normal `npm run build` remains blocked by the known parent-directory permission error in this environment. No tests were run for this update, and database/provider end-to-end delivery remains pending account configuration.
- Earlier baseline: `npm test` passed (30 server + 6 client tests) and the Vite build passed. For the arrival-time implementation, server syntax checks, the Vite build, and local HTTP smoke checks passed; the automated test suite was not run. The API test expectations were updated to the arrival-time behavior but have not been executed.
- Latest menu configuration parsed successfully with `node --check server/src/config/salon.js`; no test suite was run for this menu update. The fixed API test expectation now reflects 200 services. MongoDB connectivity was not attempted with the exposed password.
- After the arrival-time changes, Node syntax checks passed for the edited server modules and config, the Vite production build passed (33 modules), and `git diff --check` passed. Local smoke checks returned 200 for `/book`, `/api/health`, and next-day availability with 48 arrival choices from 9:00 AM through 8:45 PM. Health correctly reports booking disabled because MongoDB and Razorpay/policy setup are absent. The automated test suite was not run for this change.
- Vite production build passed with `npx vite build --configLoader runner --config vite.config.js` (33 modules transformed). The sanitized `.env.example` has an empty MongoDB value. A root `.env` exists, but the latest API startup reported `database_not_configured`.

- Baseline before changes: npm test — 30 server tests passed; npm run build — passed (Vite 7.3.7, 31 modules).
- After the route implementation: npm test — 30 server tests and 6 client route/category/image-mapping tests passed.
- After the route implementation: npm run build — passed (Vite 7.3.7, 33 modules transformed).
- After adding the supplied photos and feedback: `npm test` — 30 server tests and 6 client tests passed.
- After adding salon photos and guest excerpts: `npx vite build --configLoader runner` passed (Vite 7.3.7, 33 modules transformed); all six mapped images were copied to `client/dist/images/`.
- The standard `npm run build` attempt is blocked in this sandbox when esbuild tries to read a parent directory outside the permitted workspace; Vite's runner config loader builds successfully.
- Vite production-preview smoke check returned the SPA entry point for each required direct route and an unknown route; client route tests resolve the unknown route to the not-found page.
- The image mapping test confirms configured photo paths exist under `client/public/images/` and have descriptive alt text.
- git diff --check — passed after the implementation pass.
- Full browser screenshot, responsive, keyboard, screen-reader, and staging transaction checks remain manual. The browser helper previously failed to initialize; follow MANUAL_QA_CHECKLIST.md when available.

## Remaining before public launch

- The local `.env` has no MongoDB URI or Razorpay API/webhook credentials. Add a fresh Atlas URI, Razorpay Test Mode keys/webhook, and Meta Cloud API token/sender/template settings locally and in Render. Never send these secrets in chat.
- Create and obtain approval for the two WhatsApp Utility templates. Enter the owner's WhatsApp destination number; use a different number from the API sender. Customer WhatsApp confirmation is optional and requires checkout consent.
- Confirm unclear service names/inclusions, any unreadable or changing prices, and offer/package terms before those specific services are added to checkout. Durations and employee qualifications/schedules are not required for this arrival-time model.
- Rotate the exposed MongoDB database-user password in Atlas, add the new URI to the ignored root `.env` with a database name in its path, then verify the connection reports transaction support.
- Generate Razorpay Test Mode API keys and store them only in root `.env`; configure a `payment.captured` webhook to the HTTPS Render endpoint. Do not use the reusable `razorpay.me` page or standalone Payment Button as the per-appointment checkout/WhatsApp trigger.
- Keep the readable menu prices and fixed ₹100 advance. For a service priced below ₹100, the studio returns the difference in cash after service.
- Supply a standalone logo. Confirm the public phone, special hours/holidays, privacy contact/retention, owner WhatsApp destination, and final cancellation wording.
- Configure a transaction-capable private MongoDB deployment, Razorpay test keys/webhook, approved WhatsApp templates and Cloud API token/sender, hosting, HTTPS, domain, and production CORS. Keep BOOKING_ENABLED=false until test bookings, cancellation/refunds, webhook delivery, both WhatsApp recipients, capacity, browser QA, menu approval, and owner sign-off pass.
- Test direct route refresh/rewrite rules on the chosen production host.

## Known limitations

- The older PDF still has some unreadable crossed-out prices, although the new photos supersede three matching values. Four percentage offers have no final prices or dates; some service names and package inclusions need approval. Affected entries remain unbookable until resolved. No service duration has been invented.
- The five newest images are handwritten menu pages, not salon/service photos. Existing category and gallery photos are mapped; a standalone logo has not been supplied. All 11 feedback entries are displayed without a platform or overall-rating claim.
- Date and arrival-time choices are visible from the configured schedule. The website does not reserve a time, accept customer details, or take payment until a fresh root `.env` database URI, Razorpay Test Mode API keys/webhook, notification setup, approved booking/privacy policy versions, and staging sign-off are in place. No staff roster or service durations are required.
- Customer cancellation inside one hour is blocked by the API; rescheduling is not implemented. Refunds with uncertain provider outcomes require manual reconciliation.
- The booking management token is held in browser session storage. There is no customer account or owner dashboard.
- Browser screenshot QA and real provider/replica-set integration tests have not been performed in this environment.

## Publishing preparation (2026-10-22)

- Added `render.yaml` for one same-origin Render web service. Express serves the production Vite build and History API routes; `BOOKING_ENABLED=false` is set in the deployment config.
- Updated Helmet's content security policy for the local salon images, Google Fonts, and Razorpay-hosted checkout/button scripts. Render's generated service URL is allowed for same-origin API requests; add any custom domain to `CLIENT_ORIGIN`.
- Added step-by-step preview and Atlas URI/network allowlist instructions to `README.md` and `DEPLOYMENT_RUNBOOK.md`.
- `npm run build` passed with 33 modules, and `node --check server/src/app.js` passed. No tests were run for this pass.
- The public deployment is not created yet. This workspace has no Git remote; `.env`, generated `client/dist`, private menu scans, and `server/staff.private.json` remain ignored. Create a private GitHub repository and push the project before connecting Render.

## Next milestone

Push the existing local initial commit to a private GitHub repository and create the Render preview from `render.yaml`. Then allowlist the Render outbound IP ranges in Atlas and add the fresh MongoDB URI to Render's secret settings. Continue with Razorpay test keys/webhook and private booking-flow checks. The root `.env` currently has an empty `MONGODB_URI`; never send the URI in chat. Service durations and staff coverage are not launch prerequisites. Keep unresolved names, prices, offers, and packages out of checkout until clarified.
