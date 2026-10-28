# Manual browser and staging QA checklist

Use a private browser profile for staging and never enter real customer card/UPI credentials in a test. Screenshot-based browser checks have not been completed in this environment.

## Marketing and service-menu pages

- Directly open and refresh `/`, `/our-story`, `/services`, `/services/women`, `/services/men`, `/services/beauty`, `/visit-us`, and `/book`. Check the legacy `/services/womens-hair` and `/services/mens` aliases and an unknown route. Verify browser Back/Forward and the mobile menu.
- On `/services`, check the Women, Men, and Beauty services cards and subcategory links. Beauty must not be described as Unisex until the salon confirms it serves all genders.
- Search/filter on each category page. Check prices, discount notices, confirmation flags, empty search, category counts, and long names/packages. Confirm home still shows a selected menu subset, not all 200 entries.
- Review all owner-provided category and gallery images at 360×800, 390×844, 768×1024, 1366×768, and 1920×1080. Check the prior hero image, category relevance, gallery alignment, alt text, crop, and load errors. No menu scans should appear as customer photos.
- Check address, call/WhatsApp number, directions link, seven-day hours, all 11 supplied review items, carousel dots, automatic 4-second rotation, reduced motion, and keyboard focus.
- Test text zoom at 200%, visible keyboard focus, touch target size, contrast, heading order, screen-reader names/status messages, and no horizontal scrolling.

## Booking gate when disabled

- Confirm `/book` shows the “not available” state and direct contact, and does not collect customer details, create holds, or open Checkout.
- Confirm `GET /api/booking/readiness` shows why booking is disabled without revealing secrets. The public deployment must continue using `BOOKING_ENABLED=false` until all readiness checks and owner sign-off pass.

## Private staging setup

Do not use the production database or live keys. Use a transaction-capable isolated staging database, Razorpay Test Mode credentials, approved temporary service durations, approved staff schedules/eligibility, a real staging notification destination, and approved policy versions.

- Verify a single selected service returns starts only when one qualified employee can complete it inside salon/staff hours.
- Verify a multi-service cart is shown only when one employee can perform every item and has enough continuous time. No customer-facing employee selector should exist; the server assigns staff.
- Confirm breaks, employee leave, special closures, blocked periods, previous bookings, and unexpired holds remove the affected interval. Confirm an appointment can finish at closing but not overrun it.
- With two eligible employees, verify overlapping appointments can be assigned to different employees. Verify one employee cannot have overlapping intervals, even when a later request starts between 15-minute boundaries. Send concurrent requests for the same employee/time and confirm one lock wins.
- Verify the temporary hold expires after ten minutes and every one of its lock segments is released. Confirm retrying the same idempotency key does not create duplicate bookings or orders.
- Check that the service subtotal is server-calculated, exactly one ₹100 advance is charged for the cart, the balance is shown for payment at the salon, and a sub-₹100 service displays the approved cash-change wording.

## Razorpay Test Mode and notifications

Follow `RAZORPAY_SETUP_GUIDE.md`. Keep Live keys out of staging and keep production booking disabled.

- Complete a test checkout and verify the server created an INR order for 10,000 paise, verified signature, fetched provider status, matched payment/order/amount/currency, and only then confirmed the booking.
- Cancel/close Checkout and simulate provider payment failure; verify the booking remains unconfirmed or the hold expires as appropriate.
- Test successful capture and browser callback/webhook arrival in both orders. Redeliver a webhook event if the dashboard supports it; verify duplicate event delivery does not duplicate confirmation/refund/notification.
- Test a payment captured after hold expiration or a booking conflict and verify it enters the documented refund/manual-resolution path.
- Cancel more than one hour before the start, exactly at one hour, and within the final hour. Confirm eligibility at the boundary, release of staff locks, and a pending refund until Razorpay reports its final state.
- Exercise refund processed, failed, and uncertain/manual-review outcomes. Do not treat provider acceptance as completed refund and do not blindly resubmit an uncertain refund.
- Verify owner and customer notification outbox records and actual provider delivery. For WhatsApp, verify approved templates, owner destination, explicit customer opt-in, and delivery status. Mock mode does not deliver.

## Release gate

- Check direct routes and refresh on the actual HTTPS host, including custom-domain certificate validity and CORS.
- Run the automated suite and production build for the exact commit to deploy.
- Verify backups and restore procedure; review environment variables without exposing secrets.
- Keep `BOOKING_ENABLED=false` until the salon owner signs off on menu, staff/time schedules, cancellation/refund policy, privacy and notifications, staging tests, and browser/accessibility QA.
