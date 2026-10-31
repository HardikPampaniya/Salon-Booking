# Project status

## Current milestone: arrival booking and INR 100 checkout

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

## Verification

- No test suite was run for this change.
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
