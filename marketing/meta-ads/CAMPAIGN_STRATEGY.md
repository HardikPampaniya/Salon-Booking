# Meta campaign strategy — The Dream Beauty Unisex Studio

## Objective

Generate confirmed local salon visits in Karanjade, Navi Mumbai. Optimize for confirmed appointments only after the website booking and tracking checks pass. Until then, run a **Leads** campaign with a Meta Instant Form and have the salon call the lead to agree and confirm a visit. An Instant Form submission is an enquiry, not a confirmed appointment.

## Audit snapshot (19 November 2026)

- Website configured in project documents: <https://dreambeautystudio.in/>. The Render service URL is <https://dream-beauty-unisex-studio-karanjade.onrender.com/>. The custom domain and booking flow could not be fetched by the web inspection tool during this audit; check them in a normal browser before buying ads.
- The most useful page when booking is unavailable is `/services`; use a category page such as `/services/women` or `/services/men` when the ad is about that category. Use `/book` only after `/api/booking/readiness` says `enabled: true` and a real end-to-end payment/confirmation check has passed.
- The checked-in Render blueprint has `BOOKING_ENABLED=false`. Render dashboard variables can override it, so the live readiness endpoint is the source of truth. A paid booking has to be confirmed by the server after Razorpay verification; opening checkout or starting payment is not a booking conversion.
- There is no Pixel ID, ad-account access, or active tracking configured in this repository. Pixel code is prepared behind an optional-consent gate; it sends nothing until the salon creates a Pixel/Dataset, supplies its public ID through `VITE_META_PIXEL_ID`, and a visitor opts into ad measurement.
- The project has salon-provided local service photos in `client/public/images/services/`. Confirm that each chosen image is approved for paid ads and that the salon has the rights to use it.
- The six Diwali packages were configured with validity through **8 November 2026**. They are expired as of this audit and must not appear in new ads unless the owner provides a current, approved offer.
- Customer feedback appears on the website, but exact wording and attribution have not been approved for paid advertising. Do not use it as ad copy yet.

## First campaign proposal (owner approval required)

- **Budget proposal:** ₹300/day for 5–7 days, with an agreed total cap of ₹1,500–₹2,100. This is only a proposal; do not publish until the owner approves the amount and Ads Manager shows the same budget.
- **One campaign, one local ad set, three ads.** Keep the whole daily budget in one ad set so a small budget is not split across several audiences.
- **Location:** place a pin at the salon in Karanjade and start with the smallest practical nearby radius Meta permits, approximately 3–5 km. Check the map preview; do not assume Meta offers an exact radius or that it includes the whole desired neighborhood.
- **People:** all genders, proposed age range 18–45. If Meta's local audience estimate becomes too small, broaden the age range before adding many interests. Let location and creative do most of the filtering.
- **Placements:** start with Advantage+ placements, and upload a distinct vertical asset for Stories/Reels if Ads Manager offers placement-specific assets. Preview the actual placement crops before publishing.
- **Dates:** run a 5–7 day test, review at 24 hours, day 3, and day 7. Keep the campaign within the approved total spend cap.

## Choose the campaign path

### Path A — website appointments (preferred once ready)

Use **Leads** with website conversion location and the `Schedule` event if it is available in the salon's Ads Manager. The Meta API's current objective mapping lists website `Schedule` as a supported Leads conversion event; the Ads Manager screen may offer a different subset for this account. Select `Schedule` only after Events Manager receives a successful confirmed appointment event and the booking flow passes staging. Send ads to `https://dreambeautystudio.in/book`.

The Pixel hook emits `Schedule` only after the server returns a confirmed booking. It emits `Purchase` only for the actual captured ₹100 advance, with value `100` and currency `INR`. Do not count an opened checkout, abandoned payment, failed payment, expired hold, or form start as a confirmed appointment.

### Path B — launch while website booking is not ready

Use **Leads → Instant forms**. Ask for name, phone, and preferred service/visit time; avoid collecting age or gender unless the owner has a clear operational need. The salon must call/message promptly and confirm availability manually. Link the form thank-you screen to `/services` or the most relevant category page. Report leads and confirmed visits separately.

The salon's WhatsApp Cloud API setup is not verified in this project. Use a WhatsApp destination only if Ads Manager lets the owner select the studio's working WhatsApp Business number and a test conversation reaches the right inbox. Otherwise use Instant Forms. Do not use a Traffic objective as a substitute for appointments.

## Measurement and stop rules

- Primary result: confirmed visits; for Path B, the salon must record which submitted leads became confirmed visits.
- Secondary results: cost per confirmed visit; valid lead rate; landing page views; form completion rate.
- Do not increase the budget because reach, likes, or cheap clicks look good. Review lead quality, appointment confirmations, and cost per confirmed visit.
- Pause immediately if the destination domain, booking flow, current prices, or advertised offer is wrong; the ad account is restricted; or spend exceeds the agreed cap.

## Meta references

- Current Meta API objective and conversion mapping: <https://developers.facebook.com/docs/marketing-api/reference/ad-campaign/>.
- Pixel/CAPI event definitions and appointments vertical: <https://developers.facebook.com/docs/facebook-business-extension/fbe/guides/pixel-events>.
- Meta's media placement validation: <https://developers.facebook.com/docs/business-management-apis/business-creative-asset-management/guides/media-level-ad-format-validation/>.
