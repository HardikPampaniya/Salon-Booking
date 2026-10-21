# Salon onboarding checklist

## Supplied and configured

- Name: The Dream Beauty Unisex Studio.
- Address: Shop No. 8, Sahara Sankalp Residency, Plot No. 16, Sector 2A, Karanjade, Navi Mumbai, Maharashtra 410206.
- Hours: Monday–Sunday, 9:00 AM–9:00 PM. Timezone: Asia/Kolkata.
- Phone listed in the supplied salon directory: +91 84604 84089. WhatsApp supplied by the salon: +91 77383 85236.
- No customer employee selection or staff-roster assignment is used. Customers choose an arrival time; service begins when a team member is available.
- 200 menu entries are now on the site: the original chat menu, 16 readable prices from the scanned PDF, and 153 entries from the five newer handwritten menu photos. Three superseded prices were updated from the newer photos. Offers and package details are deferred, so affected services remain browsable but unbookable until finalized.
- Fixed online advance: ₹100 for every service. If a service costs less than ₹100, the studio returns the difference in cash after service; if it costs more, the remaining balance is paid at the salon.
- Cancellation: customer cancellation is available at least one hour before the selected arrival time; eligible captured ₹100 advances are refunded to the original payment method. Requests inside the final hour need studio assistance.
- All 11 customer-feedback entries supplied in chat are included in a manually controlled, slow-rotating carousel. The site makes no platform or overall-rating claim.
- The supplied 18-page menu PDF and newer handwritten menu photos are documented in `MENU_DATA_REVIEW.md`. The five newest photos are stored privately under `docs/source-material/`; they are menu references, not salon photography.
- Multi-page site routes and a `/book` service/date/arrival-time selector are implemented. Checkout stays disabled until payment, database, notification, privacy, and policy setup is complete. After 9:00 PM salon time, the default visit date is tomorrow.

## Essential before enabling bookings

- For each service selected for online booking, confirm any unclear customer-facing name, exact price, offer terms, and package inclusions. Unconfirmed rows can stay out of checkout while other services are enabled. Service duration and employee qualification/schedules are not required.
- The ₹100 advance stays fixed even for services priced below ₹100. The studio returns the difference in cash after those services.
- Add salon breaks, holidays, special opening hours, and public phone changes to `server/src/config/salon.js` when known. The current schedule is seven days a week, 9:00 AM–9:00 PM.
- Approve the one-hour-before-arrival cancellation cutoff, full ₹100 advance refund terms, arrival-time wording, privacy notice, policy version, privacy contact, and data-retention period.
- Provide an owner notification inbox. Configure MongoDB replica-set/sharded transactions, Razorpay test account/key/webhook, Resend verified sender, hosting, HTTPS, CORS origins, and domain before test launch.
- Reset the MongoDB database user's password because the earlier URI was placed in `.env.example`. Store a fresh URI only in the ignored root `.env`, include a database name in its path, and confirm the server reports transaction support.
- The supplied Razorpay KYC and reusable `razorpay.me` page are ready for manual collection. The website booking flow still needs Test Mode API keys and a staging webhook; the reusable page is not the appointment checkout.
- Complete test-mode payment, webhook, cancellation/refund, notification, and duplicate-arrival-time checks. Keep `BOOKING_ENABLED=false` until these checks pass.

## Helpful before public launch

- Resolve any remaining unreadable or crossed-out prices from the older PDF only if those services are still current. Newer handwritten photos already replace the clearly matching prices; see `MENU_DATA_REVIEW.md` for the specific remaining unclear readings.
- Supply a standalone logo. The provided salon photos are already mapped; see `client/public/images/README.md` for filenames and alt text.
- Use no aggregate rating unless its source and current value are verified.
- Public email and purchased domain, if available.
- Owner messaging preference; current notifications support email only. WhatsApp is a customer contact link and is not an automated notification integration.

Never send provider secrets in chat. Enter them in the local ignored `.env` file for development or in the deployment platform’s secret manager.
