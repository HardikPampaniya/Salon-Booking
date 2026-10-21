# Manual browser and accessibility QA

Run these checks locally or on staging after a browser is available. Use a clean browser profile and never use real customer payment information. Staging payment checks require test credentials and an isolated database.

## Routes, navigation, and content

- Open each route directly: `/`, `/our-story`, `/services`, `/services/womens-hair`, `/services/beauty`, `/services/mens`, `/visit-us`, and `/book`.
- Refresh each route and confirm the frontend host returns the SPA entry point. Use the 404 route for an unknown path. Test browser Back and Forward after following links.
- Follow all header, footer, category-card, home CTA, and booking CTA links. Confirm the mobile menu closes after navigation and the current page title is useful.
- Confirm the home page shows selected service cards rather than the full 200-item menu, and that each category lists its configured services.
- Search the women’s hair page and verify matching and empty results. Confirm service names/prices and confirmation notes remain readable on narrow screens; no duration label should appear.
- Check the supplied address, phone, WhatsApp action, directions link, and seven days of 9:00 AM–9:00 PM hours. Confirm cancellation wording still matches the owner-approved policy before launch.
- Confirm the story page makes no unsupported claims about salon history, awards, staff qualifications, or achievements.
- Confirm all 11 feedback entries match what the salon supplied, names are spelled correctly, and no aggregate rating or review-platform claim appears. Verify uniform quote font sizing and spacing, automatic rotation every 4 seconds, selection with each dot, pause on hover/focus and in a hidden tab, and autoplay off with reduced-motion.
- Confirm all mapped salon photos load and their alt text describes the actual image. The logo remains a text monogram until a standalone logo is supplied. Inspect Network for failed image requests; any `null` image mapping should make no request.
- Check 360×800, 390×844, 768×1024, 1366×768, and 1920×1080 viewports. Use 200% zoom and enlarged text; no horizontal page scroll, clipped prices, or overlapping controls.

## Keyboard and assistive technology

- Use Tab/Shift+Tab through skip link, navigation, page links, category search, contact actions, booking controls (when enabled), and footer. Focus stays visible and in reading order.
- Open/close the mobile menu with keyboard. Activate controls with Enter or Space as appropriate.
- Check search input labels, page landmarks, headings, image alt text, link names, button names, and loading/error/status announcements with Windows Narrator or NVDA.
- When checkout is disabled, verify `/book` still shows service/date/arrival-time selection, says customer details are not submitted, offers studio contact, and does not collect payment.
- In private test mode, confirm every selected service charges a fixed ₹100 advance. For a service under ₹100, check that the booking summary states the exact cash change the studio returns after service; for a service over ₹100, check the remaining balance due at the salon.
- When booking is enabled only in staging, complete service/date/arrival-time/contact inputs without a mouse. Verify the selected time is described as arrival time, employee choice is absent, and consent explains that service begins when the team is available.
- After 9:00 PM in Asia/Kolkata, verify the initial date and minimum selectable date advance to tomorrow. During salon hours, verify today's future 15-minute arrival times are offered; past times are omitted.
- Try simultaneous booking attempts for the same arrival time. Only one hold should succeed; a different arrival time should remain bookable.
- Enable reduced motion and confirm nonessential movement is minimized. Check text and focus contrast.
- With a screen reader, verify each dot announces the customer it selects and automatic advances are not repeatedly announced.

## Booking and API in staging

- Confirm readiness does not require service durations or an employee roster, and remains false until provider credentials, policy versions, and a transaction-capable database are set.
- In test mode, verify no employee selector appears. The booking reserves an arrival time and does not assign a specific employee.
- Try simultaneous holds for the same arrival time; only one should succeed. A different offered arrival time should remain available.
- Verify a hold expires after ten minutes, and a captured ₹100 advance confirms only after server/provider verification. Any remaining service balance is paid at the salon; for a service under ₹100, verify the studio returns the difference in cash after service.
- Test cancellation more than one hour before, exactly one hour before, and inside the final hour. Eligible cancellations request a refund; keep status pending until trusted provider confirmation.
- Test invalid/duplicate webhooks, payment failure, refund failure, notification retries, and browser refresh/session loss.
- Keep production `BOOKING_ENABLED=false` until test-mode checks and salon-owner sign-off are complete.

## Tooling limitations

The automated browser helper previously failed to initialize in this environment. Automated tests and production builds do not replace screenshot-based layout review, keyboard/assistive-technology checks, or a provider-backed staging booking flow.
