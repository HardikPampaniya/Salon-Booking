# Meta Ads and Pixel setup guide

## Current project status

- Meta Pixel/Dataset ID: **not supplied**.
- Pixel integration: prepared in the website; disabled until a valid numeric `VITE_META_PIXEL_ID` is configured and the visitor opts in to optional ad measurement.
- Pixel browser events in code: `PageView`, category `ViewContent`, `AddToCart`, `InitiateCheckout`, confirmed appointment `Schedule`, and captured advance `Purchase` (actual Razorpay amount, currently ₹100 / INR).
- Consent: first visit shows Allow / Decline controls. Declining prevents Pixel loading and removes session campaign attribution. Settings remain available at the bottom-right of the website when Pixel is configured.
- Personal data: customer name, phone, email, age, gender, booking reference, and payment identifiers are never included in Pixel event parameters.
- Conversions API: **not implemented**. No Meta access token is present or needed for this browser-Pixel setup. Do not put a CAPI token in Vite variables or frontend code.
- UTM attribution is saved with a booking only when the visitor has allowed ad measurement. It stores channel and the four supported UTM fields; it is not sent to Meta as a server event. The owner notification email can show the marketing source.
- Booking eligibility is separate from Pixel setup. `render.yaml` defaults `BOOKING_ENABLED=false`; confirm the live readiness endpoint and perform a test-mode checkout before advertising confirmed online appointments.

## A. Owner access and business assets

1. The salon owner signs in to [Meta Business Suite](https://business.facebook.com/) using their own Facebook account. Never share passwords, recovery codes, or OTPs.
2. Open **Settings → People → Invite people** (labels can vary). Invite the person who will manage the ads by their Facebook-account email.
3. Give only the needed asset permissions: the salon Facebook Page, linked Instagram account, ad account (create/manage ads), and Pixel/Dataset (view/test events). Keep the owner as the portfolio administrator and billing contact.
4. The person accepts the Meta invitation from their own account. Meta's business asset access is assigned per asset; being added to the portfolio alone may not grant ad-account access.

Useful entry points: [Meta Business Suite](https://business.facebook.com/), [Ads Manager](https://adsmanager.facebook.com/), [Events Manager](https://business.facebook.com/events_manager/).

## B. Create or find the Pixel/Dataset

1. In Events Manager, choose the salon's Business Portfolio and the website data source, if one already exists.
2. If none exists, choose **Connect data → Web** and follow the current on-screen Pixel/Dataset setup. Select/create the source owned by the salon's Business Portfolio, not a personal or unrelated business.
3. Copy the numeric Pixel ID / web Dataset ID from its settings. Send only that public numeric ID to the developer. Never send a Conversions API access token.
4. Connect the dataset to the salon's ad account if Meta offers that step.

Meta's current documentation describes `Schedule` and `PageView` as the required events for its appointments/reservations vertical, with `AddToCart` and `ViewContent` optional: [Fire Pixel Events](https://developers.facebook.com/docs/facebook-business-extension/fbe/guides/pixel-events/). Ads Manager's available optimization options can differ by account; choose only events received and tested in this dataset.

## C. Configure the site

**Render live site:**

1. Open the Render Dashboard → the salon web service → **Environment**.
2. Add `VITE_META_PIXEL_ID` with the numeric Pixel ID. It is a public website identifier, not a secret.
3. Save changes and let the new build/deploy finish. Vite bakes this public setting into the website during build.
4. Check the deployed site in a private browser. The optional ad-measurement banner should appear. Decline first and verify no Pixel request appears; then reopen **Ad measurement settings**, allow, and verify events.

**Local site:** add `VITE_META_PIXEL_ID` to the root `.env` (never commit `.env`) and restart Vite. The `client/vite.config.js` env directory points to the project root; only `VITE_`-prefixed values are exposed to the browser.

## D. Test events safely

1. In Events Manager, open the dataset's **Test events** tab and copy its website test instructions.
2. Open the deployed site or local site in a fresh private window; approve optional ad measurement.
3. Visit `/`, `/services/women`, add a selectable service to cart, and open `/book`. Expected events: PageView, ViewContent, AddToCart, InitiateCheckout only if the Pay button can be used.
4. Do not create a live payment just to test. Use a controlled Razorpay Test Mode booking in local/staging. Only after the server verifies a captured payment should `Schedule` and `Purchase` appear. The Purchase value should equal the captured advance, `100 INR` for today's fixed advance.
5. Test a declined/failed payment and an expired hold; neither should create Schedule or Purchase.
6. Confirm the event source and event counts in Events Manager. Pixel Helper is an optional browser diagnostic, not proof that an appointment was confirmed.

The browser uses a random event ID only to prevent duplicate browser events in the same session. Conversions API is not implemented. If it is added later, the server and browser must share the same event ID and Meta deduplication must be tested before both sources send events.

## E. Verify the website domain if Meta requests it

1. In Business Settings, open **Brand safety / Domains** (Meta may move this menu).
2. Add `dreambeautystudio.in` and select DNS verification.
3. Meta will show a unique TXT record. Add exactly that TXT record at GoDaddy; do not alter the Render A/CNAME records. Wait for DNS propagation, then press Verify in Meta.
4. Verify the root domain; the `www` URL redirects to the root domain in the current Render setup. Follow Meta's on-screen domain instructions if it asks for both.

Domain verification proves control of the domain; it does not repair DNS or SSL routing. If the custom domain shows an error, fix that before buying ads.

## F. Create the first campaign in Ads Manager

1. Open Ads Manager and select the salon's ad account. Check **Account Quality** for restrictions.
2. Click **Create**. Choose **Leads** as the outcome, not Traffic.
3. If live website booking is ready and `Schedule` is receiving test events, select website conversion location and the salon Dataset/Pixel; choose `Schedule` if offered.
4. If website booking is not ready, select **Instant forms** as the conversion location. Explain in the form that the salon will contact the customer to confirm the visit; do not call an enquiry a confirmed appointment.
5. Select the salon Page and linked Instagram profile.
6. Pin the audience to the salon location in Karanjade. Start with roughly 3–5 km only if the UI permits; inspect the map. Use the owner-approved age range, initially all genders, and avoid layering many interests into a very small local audience.
7. Enter the approved daily budget and end date. The proposed test is ₹300/day for 5–7 days, but publish only with the owner's written approval of the exact total cap.
8. Add the approved creative, copy, landing URL, and UTM link. Preview Facebook Feed, Instagram Feed, Stories, and Reels.
9. The owner reviews the ad, destination, contact flow, payment method, and spend cap. Click **Publish** only after that approval. Ads are not live until Meta approves them and Ads Manager reports delivery.

## External setup still owned by the salon

The owner must provide or confirm the Instagram/Page links, asset ownership and connection, ad account, Pixel/Dataset ID, account access, billing method, ad budget, image usage approval, current offer approval, and the booking-readiness result. No Meta campaign is created, submitted, or spending money in this repository.
