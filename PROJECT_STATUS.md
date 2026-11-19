# Project status

## Current milestone: Meta ad preparation (not published)

- Audited the website source and booking/payment flow for local ad readiness. The checked-in Render blueprint defaults booking off. The live Render readiness endpoint and current custom-domain rendering could not be independently fetched during this pass; confirm in a normal browser before choosing a booking-conversion destination.
- Confirmed no Meta Pixel/Dataset ID or Meta ad account access is configured in the repository. Prepared optional-consent-gated Pixel events using the public `VITE_META_PIXEL_ID` build variable; no access token or customer PII is placed in browser events.
- Prepared `PageView`, category `ViewContent`, `AddToCart`, `InitiateCheckout`, and post-server-confirmation `Schedule` plus actual captured-advance `Purchase` events. The tracking code stays dormant without both a valid Pixel ID and visitor consent. Conversions API is not configured.
- Added minimal consented UTM attribution to booking records and owner confirmation email; customer contact details, booking reference, and payment identifiers are excluded from Meta events.
- Added a local ad-preparation pack at `marketing/meta-ads/`: strategy, three copy concepts, creative brief, Meta setup guide, launch checklist, and campaign tracking/reporting notes.
- Campaigns and spend remain on hold until the salon supplies its Page/Instagram/ad account/Pixels and owner approval of assets, offer terms, budget, destination, and booking readiness. The proposed ₹300/day for 5–7 days is not authorized spend.
- Current website offers in the project expired on 8 November 2026; they are excluded from the new ad drafts. Existing customer feedback has not been approved for paid ad use.

### Verification for this milestone

- `npm test` passed: 35 server tests and 10 client tests.
- `npm run build` passed with Vite 7.3.7; `git diff --check` passed.
- Still pending: test the Pixel in Events Manager with the salon's real Dataset ID and consent, then verify successful and failed payment event behavior in Razorpay Test Mode.
- Pending: owner-side confirmation of the Meta Page, linked Instagram account, ad account, payment method, assets, and budget. No ad has been submitted or published.

## Previous milestone: arrival booking and INR 100 checkout

- Removed qualified-staff, employee-schedule, and service-duration requirements from online booking.
- Checkout offers salon-local dates and one-hour arrival windows during configured opening hours. The selected window tells the salon when the customer plans to arrive; service may begin when the salon team is available.
- One booking can hold a particular arrival window at a time. Holds expire after 10 minutes and conflicts use MongoDB transactions plus a unique arrival reservation.
- Only active services with approved wording and a final payable price can enter checkout. Flagged entries and percentage-only offers without a final price remain blocked.
- Checkout collects full name, phone, email, gender, and age. Email is required for the customer confirmation; the saved customer details are used for owner email as well.
- The payment order is fixed at INR 100 and the booking is confirmed only after trusted Razorpay payment verification.
- After verified payment, the site shows the result and queues confirmation emails for the customer and owner through the existing Resend outbox. WhatsApp is not used.
- Added a required customer email field, server validation/storage, Razorpay email prefill, and owner-email inclusion of the customer's contact details. Production readiness now requires Resend email configuration; local Test Mode can still use the non-delivery mock.
- The cart shows date/time selection, the customer fields, and a Pay INR 100 advance button. The button remains disabled while server readiness is false.
- `BOOKING_ENABLED` remains false in `render.yaml`; it is enabled in the local Test Mode configuration for checkout testing. This milestone has not been committed or deployed.
- Replaced the stale Razorpay setup guide with the current test path: no staff/duration or WhatsApp requirement, isolated transaction-capable MongoDB, Test Mode keys/webhook, and separate Live-mode launch steps.
- Fixed development CORS to accept localhost/127.0.0.1 origins on Vite's fallback ports; production origins remain allowlisted.
- Fixed a payment-verification `ReferenceError`: the verifier called a missing readiness check. Added an authenticated “Check payment status” recovery action that checks the existing Razorpay order and reconciles a captured payment without creating or charging a second order.
- A captured Test Mode payment was reported in Razorpay, but its browser callback had failed and the booking still showed `held`. Do not pay again. After restarting the local API, use the booking's “Check payment status” button to reconcile it; confirmation/refund outcome still needs to be observed in the browser.
- Added the recovery API call to the existing Razorpay order-payments endpoint. See [Razorpay Fetch Payments for an Order](https://razorpay.com/docs/api/orders/fetch-payments/).
- Added a clear checkout outcome panel for successful, failed, expired, authorized, and refund states. A confirmed booking removes only its booked services from the cart; unsuccessful or expired bookings keep the cart and form selections. Expired orders must be checked before checkout can be retried, and the server distinguishes captured, authorized, failed, and mismatched order payments.
- Added six Diwali all-in beauty packages from the supplied flyer, with highlighted cards on the home and Beauty pages, cart selection at the flyer prices, and server-side expiry for arrival dates after 8 November 2026.

## Verification

- No test suite was run for this change.
- `git diff --check` passed for the Diwali menu, expiry, and presentation changes. Build and tests were not run in this pass.
- `npm run build` passed after the checkout outcome and cart changes (Vite 7.3.7, 33 modules).
- Server JavaScript syntax checks and `git diff --check` passed after the payment recovery and checkout UI changes.
- The browser flow has not yet been rerun with the captured Test Mode payment; restart the local app and use “Check payment status” to see whether the booking confirms or the late payment is refunded.
- Local API health/readiness previously reported database and payments configured, booking enabled, and no readiness issues. Development CORS and payment-verification fixes require an API restart before the next local check.
- No live Razorpay transaction, webhook, MongoDB transaction, notification delivery, or visual browser flow was verified.
- The email integration edits in this pass have not been built, tested, or deployed.
- The local Test Mode capture is visible in the Razorpay Dashboard; booking confirmation via the new recovery action has not yet been confirmed. This recovery change is local and has not been pushed or deployed.

## Remaining before enabling public checkout

- In Render, verify MongoDB connectivity and transaction support, Razorpay mode/keys, webhook secret and endpoint, and the server environment values. Do not paste secrets into chat.
- Approve final booking policy and privacy/data-retention wording, then set non-draft `BOOKING_POLICY_VERSION` and `PRIVACY_POLICY_VERSION` values in the server environment.
- Run the staging payment flow with test credentials and a private transaction-capable database. Confirm INR 100 orders, successful/failed payment behavior, webhook processing, slot conflict, expiry, cancellation, and refund status.
- Configure Resend sender-domain verification, sending-only API key, sender address, and owner inbox in Render. Update the privacy notice to include customer email collection and Resend processing, then confirm both messages arrive after a Test Mode payment.
- Confirm flagged service names and payable amounts in `SERVICE_DATA_REVIEW.md`. Unresolved entries are not checkout-eligible.
- Review the checkout UI on desktop/mobile and complete the existing accessibility checklist.
- Keep `BOOKING_ENABLED=false` until these checks and owner approval are complete.

## Known limitations

- The selected time reserves an arrival slot only; the system does not promise when service starts or estimate service duration.
- Capacity is one customer per one-hour arrival window. The site does not store or assign employees.
- Hours currently use the configured seven-day 9:00 AM-9:00 PM schedule. Special hours, holidays, breaks, and owner messaging are not managed by this flow.
- Email delivery is not yet verified. Local `.env` is in mock mode and has no Resend API key; real email requires Resend setup and configuration in the target environment.
- Razorpay checkout code is present, but public booking/payment remains disabled and the latest email changes have not been deployed.
