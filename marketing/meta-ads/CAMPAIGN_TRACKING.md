# Campaign links and reporting

## UTM link format

Use these four parameters on every paid social ad. Keep the values short and consistent:

- `utm_source`: `instagram` or `facebook`
- `utm_medium`: `paid_social`
- `utm_campaign`: `karanjade_launch_01` (use a new value for a new test)
- `utm_content`: one distinct name per creative/placement, such as `salon_intro_feed` or `beauty_reel`

Example for a category ad:

`https://dreambeautystudio.in/services/women?utm_source=instagram&utm_medium=paid_social&utm_campaign=karanjade_launch_01&utm_content=women_hair_feed`

Example for an appointment ad (only after booking is confirmed ready):

`https://dreambeautystudio.in/book?utm_source=facebook&utm_medium=paid_social&utm_campaign=karanjade_launch_01&utm_content=booking_story`

The site captures only these UTM fields after the visitor opts into ad measurement, then carries them through the cart/booking journey. On a confirmed booking, the minimal attribution fields are stored with the booking and displayed in the **owner** confirmation email. They are not sent to Meta from the server.

The channel values are `instagram_ad`, `facebook_ad`, `organic_instagram`, `organic_facebook`, `direct`, or `other_referral`. If Meta strips UTMs in its in-app browser, a booking may only be attributed as organic/referral/direct; review Ads Manager's own attribution as well.

## Appointment and payment event meanings

| Event | When it fires | What it means |
|---|---|---|
| `PageView` | On a page view after consent | A page loaded; not a lead or booking |
| `ViewContent` | On a service category page after consent | Category/menu interest |
| `AddToCart` | When a selectable service is added | Cart intent, not a reservation |
| `InitiateCheckout` | When the customer starts payment checkout | Checkout was started, not paid |
| `Schedule` | Only after the server confirms the booking | Confirmed appointment |
| `Purchase` | With the same server-confirmed paid booking | Actual captured advance amount, currently ₹100 INR |

Do not add failed payments, abandoned checkouts, expired holds, or unverified callback screens to confirmed conversion totals. Schedule and Purchase describe two different outcomes for the same successful booking; do not add them together as “two bookings.” Use Schedule for appointment count and Purchase for advance receipts.

## MongoDB summary query (confirmed bookings only)

In MongoDB Atlas Data Explorer, open the app database's `bookings` collection and use Aggregations. This query groups confirmed bookings by consented source and campaign without showing customer information:

```javascript
[
  { $match: { status: 'confirmed', 'marketingAttribution.consentedAt': { $exists: true } } },
  { $group: {
      _id: {
        channel: '$marketingAttribution.channel',
        campaign: '$marketingAttribution.campaign',
        content: '$marketingAttribution.content'
      },
      confirmedAppointments: { $sum: 1 },
      advanceReceivedPaise: { $sum: '$advancePaise' }
    }
  },
  { $sort: { confirmedAppointments: -1 } }
]
```

This counts confirmed bookings, not completed salon visits, repeat visits, or net revenue. The website has no owner reporting dashboard; protect Atlas access and do not export customer details into ad reports.

## Beginner metrics

- **Reach:** unique people who saw an ad.
- **Impressions:** total times shown.
- **CPM:** spend per 1,000 impressions.
- **Link clicks / CTR / CPC:** visits initiated from the ad, click-through rate, and cost per click. They are not appointments.
- **Landing page views:** ad click that loaded the destination page.
- **Booking initiation:** a customer reached payment checkout.
- **Confirmed appointments:** the server confirmed successful payment and saved the booking.
- **Cost per confirmed appointment:** ad spend divided by confirmed appointments.
- **ROAS:** revenue attributed to ads divided by ad spend. Do not use the ₹100 advance alone as total service revenue; the full service bill is paid at the salon and isn't currently returned as revenue tracking.

## Review schedule

- **After 24 hours:** check approval/delivery, spend, errors, and whether local people are seeing the ad. Avoid changing budget based on a few early clicks.
- **After 3 days:** check valid leads, calls answered, confirmed visits, and creative quality. Fix broken links or unqualified lead questions.
- **After 7 days:** compare cost per confirmed visit and the salon's capacity. Continue or stop based on actual appointments and owner approval, not likes alone.
