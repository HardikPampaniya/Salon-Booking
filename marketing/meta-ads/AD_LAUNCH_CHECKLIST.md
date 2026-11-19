# Meta ad launch checklist

## Account and approvals

- [ ] Owner has a Meta Business Portfolio and retains full admin and billing control.
- [ ] Facebook Page and Instagram professional account are connected to the correct business/ad account.
- [ ] Ad account is active; Account Quality has no blocking restriction.
- [ ] Owner has added a valid ad payment method in Ads Manager.
- [ ] Owner has approved the exact daily budget, duration, and total spend cap. Proposed test: ₹300/day for 5–7 days (₹1,500–₹2,100 total).
- [ ] Owner approved the selected photos/video for paid advertising and confirmed image rights.
- [ ] Owner approved the final text, CTA, audience, landing URL, and all price/offer statements.
- [ ] Current offer dates/prices have been checked. The Diwali flyer offers through 8 November 2026 are expired and excluded.

## Website and tracking

- [ ] `https://dreambeautystudio.in/` loads on mobile and desktop with no DNS, certificate, JavaScript, or CSS errors.
- [ ] Root and `www` domain behavior is correct; ad destination uses the preferred canonical root URL.
- [ ] `/api/booking/readiness` reports `enabled: true` before using website booking as the ad conversion path.
- [ ] A Razorpay Test Mode booking is server-confirmed, email confirmation is received, and failed/expired attempts do not count as conversions.
- [ ] Pixel/Dataset is owned by the salon portfolio and connected to the correct ad account.
- [ ] `VITE_META_PIXEL_ID` is configured in Render; a new successful deployment is complete.
- [ ] Visitor can decline ad measurement; no Pixel event is sent before consent.
- [ ] Events Manager Test Events shows PageView and category/cart events after consent.
- [ ] A Schedule event is observed only after server-confirmed booking; Purchase value matches captured advance (₹100 INR).
- [ ] No customer name, phone, email, booking reference, or payment data is included in Pixel payloads.
- [ ] Privacy notice is approved and describes optional Meta ad measurement and minimal campaign attribution storage.

## Campaign submission

- [ ] Use Leads objective.
- [ ] If Schedule and booking are verified, choose Website and optimize for Schedule; destination `/book`.
- [ ] Otherwise choose Instant Forms and destination follow-up to salon staff; do not label form leads as bookings.
- [ ] Location pin/radius is checked on the map; audience is locally relevant and adult.
- [ ] UTM URL is checked; each ad has a unique `utm_content` value.
- [ ] Correct Page and Instagram profile are selected.
- [ ] Feed/Stories/Reels previews and crops are checked.
- [ ] Owner approves the final review screen and clicks Publish.
- [ ] After publishing, confirm Meta status is Approved/Active and delivery has begun. “Submitted” is not the same as “running.”
