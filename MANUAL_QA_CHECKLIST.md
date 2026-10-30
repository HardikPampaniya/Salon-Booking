# Manual browser and staging QA checklist

Use a private browser profile for staging. Never use real customer payment credentials in a Razorpay test.

## Website and checkout UI

- Directly open and refresh `/`, `/our-story`, `/services`, each service category, `/visit-us`, and `/book`. Check legacy service route aliases, unknown routes, browser Back/Forward, and the mobile menu.
- Check service search, prices, offer/confirmation labels, the cart, remove controls, and blocked services with unresolved names/prices.
- Review the supplied images and layout at 360x800, 390x844, 768x1024, 1366x768, and 1920x1080. Check keyboard focus, zoom, contrast, screen-reader names/statuses, and horizontal scrolling.
- Confirm the cart date picker uses salon local dates, offers one-hour arrival windows only during opening hours, and clearly explains that the window is not a guaranteed service start time.
- Confirm the customer form contains only full name, phone, gender, and age. Check required-field validation and that no email or WhatsApp opt-in is requested.
- When booking is disabled, the Pay INR 100 button stays disabled and the page says that selected details/time are not submitted or reserved.

## Private staging booking and payment

Do not use the production database or Live keys. Use a transaction-capable isolated staging database, Razorpay Test Mode keys, approved policy versions, and `BOOKING_ENABLED=true` only on private staging.

- Confirm only services with approved wording and a final payable price can be checked out. No duration or staff schedule should be required.
- Confirm selecting a date/time outside salon hours or in the past is rejected by both UI and API.
- Confirm a 10-minute hold reserves a single one-hour arrival window; a second concurrent request for the same window cannot create another active booking. A separate available window can be reserved.
- Confirm retrying the same idempotency key does not create duplicate bookings or payment orders.
- Complete a test checkout and confirm the server order is exactly INR 100, verifies Checkout signature and provider status, and marks the booking confirmed only after trusted capture verification.
- Cancel/close Checkout and simulate payment failure; confirm the booking is not falsely confirmed. Confirm the hold expires and releases its slot after ten minutes.
- Test webhook delivery before/after browser callback, duplicate webhooks, late payment, cancellation at the one-hour boundary, refund pending/final states, and management-token access.
- Verify that the website shows a booking confirmation after payment verification. WhatsApp is pending: do not expect a WhatsApp message or mark it as delivered.

## Release gate

- Check direct routes and refresh on the HTTPS host, including CORS and custom-domain certificate.
- Review environment variable names without exposing secret values.
- Keep `BOOKING_ENABLED=false` until private staging payment checks, browser/accessibility review, policy approval, and salon-owner sign-off are complete.
