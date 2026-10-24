# The Dream Beauty Unisex Studio website

A responsive React/Vite and Express/MongoDB website for The Dream Beauty Unisex Studio in Karanjade. The service menu is split across category pages. Customers can browse a service, visit date, and 15-minute arrival time; after 9:00 PM the date defaults to tomorrow. The salon does not assign an employee or promise a service duration. Payment and booking remain closed until the database, provider setup, and policies are configured.

## Pages

- `/` — Home, selected menu items, category links, supplied studio photos and the customer-feedback carousel, contact, and hours.
- `/our-story` — Salon description limited to information supplied by the studio.
- `/services` — Service category overview.
- `/services/womens-hair`, `/services/beauty`, `/services/mens` — Category menus with prices and any details needing confirmation.
- `/visit-us` — Address, hours, phone, WhatsApp, directions, and current cancellation wording.
- `/book` — Choose a service, visit date, and arrival time. Checkout stays unavailable until the API readiness check passes.
- Unknown paths show a not-found page.

The client uses a small History API router in `client/src/routes.js`; it has no added routing dependency. When hosting the static client, route all non-asset page requests to `client/dist/index.html`. Keep `/api/*` routed to Express.

## Run locally

Requirements: Node.js 20.19+ and npm 10+.

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>. Vite serves the client and proxies `/api` to the Express API on port 5000. Without a database and provider credentials, the salon menu remains available while booking and payments stay disabled. The example notification mock marks outbox entries as `mocked`; it does not send messages or simulate a payment.

## Publish a first preview

The website is already published at https://dream-beauty-unisex-studio-karanjade.onrender.com/ and is connected to the GitHub repository. Review code changes before pushing; Render then deploys them to the same URL. Keep the free service for preview/testing only because it sleeps when idle; use an always-on plan before real bookings. See DEPLOYMENT_RUNBOOK.md for Atlas network access, the MongoDB URI, and Render secret settings.

```powershell
npm test
npm run build
```

## Salon content and images

Salon profile, hours, phone numbers, map directions, and all 200 menu entries are in `server/src/config/salon.js`: the original 31 chat entries, 16 legible entries from the scanned PDF, and 153 additional entries from the five newer handwritten menu photos. Three readable prices were updated where the new photos clearly supersede an older value. See [MENU_DATA_REVIEW.md](MENU_DATA_REVIEW.md) for the source notes and readings that still need owner confirmation.

Salon-provided photographs are mapped to the category, home hero, and home-gallery visuals under `client/public/images/`. The category/gallery mapping and alt text are in `client/src/service-images.js`; the circular “D” mark remains a temporary text treatment until a standalone logo is supplied. The home page displays all customer feedback supplied by the studio in an automatic carousel that advances every 4 seconds; clickable dots select a specific review. Quotes share a consistent 16px font and vertically centered card layout. No aggregate rating or review-platform claim is made.

The five files you placed in `client/dist/images/` are handwritten menu-page photos, not salon/service photography. I copied them to the private, ignored `docs/source-material/` folder for reference and added their readable services and prices to the menu. They are not shown to customers. `client/dist/` is generated output and can be replaced by the next frontend build; add future salon photos under `client/public/images/` instead.

## Online booking setup, step by step

Booking and payment code is in place, but online appointments and payment are still disabled. Please work through these steps in order. You can stop after any step and tell me where you are; I can guide the next screen with you.

### First, the menu decisions you already made

- I will keep every readable price you supplied as written. The remaining unreadable PDF prices will stay marked unresolved until you send them; I will not guess them.
- Offers and package details are deferred. They can remain visible in the menu, but a service with an unconfirmed offer price or package contents will stay out of the online booking choices until you approve those details.
- The online advance is always ₹100, including for a service that costs less than ₹100. It is credited toward the bill; if a service costs ₹30, for example, the studio gives ₹70 back in cash after the service. For services over ₹100, the remainder is paid at the salon. A cancellation at least one hour before the selected arrival time requests a refund of the full captured ₹100 to the original payment method.
- A service with a known positive price and clear wording can appear in online booking. Services with unresolved names, package details, or offer prices remain out of checkout until clarified. Service duration and staff qualification/schedules are not booking requirements. Customers select a 15-minute arrival time; the service begins when a team member is available.

### What “customer-facing service name” means

It means the wording a customer sees on the Services page and the online booking list. It does not mean an internal code or an employee name. I made a few spelling/readability guesses from the notes you gave me, so please correct only the ones that are wrong. For example, the supplied phrase “Hair Cut Hair wish” is currently shown as “Haircut + hair wash”; “03 facial” might mean “O3 facial”; and “Been face wax” needs the exact salon wording and wax area. For combined services, a slash or plus can change what the customer thinks is included.

You can reply in this simple format, whenever convenient:

```text
Current website name → exact name customers should see
What is included / which area (if the name is a package or wax service)
```

See [MENU_DATA_REVIEW.md](MENU_DATA_REVIEW.md) for the exact flagged rows. Any row you have not confirmed can stay browsable and unbookable while we start with confirmed services.

### Editing service names and prices yourself

The source of truth is [`server/src/config/salon.js`](server/src/config/salon.js), not `client/dist/` (that folder is generated). Edit the matching `service(...)` row near the top for the original and handwritten-PDF entries, or edit the matching row in `handwrittenMenuServices` for the newer handwritten-photo entries. Change the customer name, `priceDisplay`, numeric `priceRupees`, and description there. `bookable` is calculated automatically: leave `needsConfirmation` as `true` until the exact name/package/offer is approved, then set that final argument to `false`. Never set an offer's numeric price to a guessed value.

Four percentage offers still have no actual payable price: `women-botox`, `women-nanoplastia`, `women-bioplastia`, and `women-global-highlights`. For each, enter the current customer price in rupees and update the display/offer description when the salon decides to use it. Until then, they cannot be added to checkout. Other rows with known prices are also held back while their names or package contents are unclear; their exact IDs and questions are in [MENU_DATA_REVIEW.md](MENU_DATA_REVIEW.md). These include the haircut + wash wording, manicure/pedicure and facial packages, the “Been”/“03” wax wording, “Baby Glow Poligen,” and Botox/protein treatment.

Two handwritten amounts are specifically marked for your check: men's **Brand colour ₹150** and **Korean bleach: half tummy ₹900** (the full-tummy row is ₹650). The prices are shown in the menu, but these two rows cannot be put in online checkout until confirmed. Caring hair spa (three lengths), Treatment hair wash, and Korean Glass facial also have known prices but their photo wording still needs your confirmation; the photo-price register in `MENU_DATA_REVIEW.md` has the exact rows.

### How the service cart works

Customers can add confirmed-price services from the home picks or category pages. The cart is saved in that browser, supports up to 20 distinct items, and lets the customer choose one visit date and arrival time for the whole visit. Checkout creates one appointment hold and one payment for the fixed ₹100 advance, while the server saves each selected service and calculates the combined service total. The advance is counted once for the visit, not once per service. If the total is below ₹100, the remaining change is returned in cash after service. Booking and payment still stay disabled until the readiness checklist is complete.

### Step 1 — Choose the first services for online booking

No duration or employee roster is needed for this booking model. Confirm only the menu names, prices, offer terms, and package inclusions for the services you want customers to book. The selected 15-minute time reserves the customer's arrival time; the actual service start depends on the team being available. If a customer opens booking after 9:00 PM Asia/Kolkata time, tomorrow is selected by default.

### Step 2 — Create the test database in MongoDB Atlas

1. Open [MongoDB Atlas](https://cloud.mongodb.com) and sign in. If your existing project already has a cluster, keep using it; do not create a second one just for this website.
2. If you do not have a cluster yet, choose **Build a Database** / **Create**. For development and test bookings, choose a **Free** cluster (shown as M0 in some Atlas screens), select the closest available region, and give it a name. MongoDB's [Atlas quick-start](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/) shows these screens.
3. Reset the exposed database user's password before using this project. In Atlas, open **Security → Database & Network Access → Database Users**, choose **Edit** for that user, set a new password, and save it. If that user is shared with another app, create a dedicated user for this project and retire the exposed user once other apps have been moved. MongoDB's [database user guide](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/) shows this screen. A database user is separate from your Atlas website sign-in.
4. Add your current computer IP to **Network Access / IP Access List** for development. Do not allow access from every IP (`0.0.0.0/0`). Atlas requires both an allowed IP and a database user to connect; see [connection instructions](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/).
5. In your cluster, click **Connect → Drivers**, choose **Node.js**, and copy the fresh connection string Atlas shows. Include a database name such as `/salon_bookings` before the `?` options. If the password contains special characters, Atlas requires them to be URL-encoded; do not send the password to me if you get stuck.
6. On your computer, copy `.env.example` to `.env` in the main project folder (the same folder as this README). Put the fresh connection string after `MONGODB_URI=`. Save the file. It is ignored by Git, so do not paste it into chat or commit it. Run `npm run dev`; the server should log that the database is connected, transactions are supported, and indexes are ready. You do not need to install MongoDB tools for this Atlas setup.

I found a real MongoDB connection string in `.env.example` and removed it from that template. Its structure looked like an Atlas three-node replica-set URI with TLS and the replica-set/authentication options, but it had no database name in its path. Since the database password was exposed in a shared project file, reset that database user's password in Atlas before using the connection. Then save a fresh URI only in the root `.env`, with a database name such as `/salon_bookings` before the `?` options. The active local API currently logs `database_not_configured`, so verify `MONGODB_URI` is set in the root `.env` and restart the server; no connection string is reproduced here. Keep `.env.example` blank and use a replica-set or sharded deployment that supports transactions, not a standalone MongoDB server.

The free cluster is appropriate for development and simulated payments, but MongoDB says it has no built-in backups. Before real customers can book, choose a production plan with backups and recovery that the salon is comfortable paying for; see [Free cluster limitations](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/). Booking uses database transactions and an arrival-time lock to prevent two customers reserving the same arrival time.

### Step 3 — Create Razorpay test keys

1. Your Razorpay account, KYC, and `razorpay.me` collection page are ready. That reusable page can collect a manual payment, but it is not connected to a particular appointment. Do not use it as the website booking-payment button: the booking flow creates a separate ₹100 Razorpay order for each held appointment so the server can match the payment to the right booking and verify it.
2. Open the [Razorpay Dashboard](https://dashboard.razorpay.com) and switch to **Test Mode**. Go to **Account & Settings → API Keys → Generate Key** (the current label may appear as **Settings → API Keys**). Razorpay's [integration guide](https://razorpay.com/docs/server-integration/python/test-app/) explains test payments; test transactions are simulations and do not collect real money.
3. Put the **test** Key ID in `RAZORPAY_KEY_ID` and the test Key Secret in `RAZORPAY_KEY_SECRET` in the root `.env`. Keep `RAZORPAY_MODE=test`. Never send either key in chat. Do not generate or enter Live Mode keys yet.

### Razorpay website verification and API setup

The website is already published at <https://dream-beauty-unisex-studio-karanjade.onrender.com/> and you have submitted it to Razorpay for verification. If the dashboard now shows verified, you do not need to resubmit the link. Keep using Razorpay **Test Mode** for integration checks; test payments are simulations and do not move money. Website verification is separate from the app's API keys, webhook, and booking readiness. If Razorpay asks for additional policy pages or evidence, follow the exact request shown in your account. Never use localhost, your Razorpay.me collection URL, or an API key/secret as the website address. Razorpay's [test-vs-live guidance](https://razorpay.com/blog/instant-payment-gateway-activation-india/) distinguishes test access from live prerequisites, and its [integration steps](https://razorpay.com/docs/server-integration/python/test-app/) document test transactions and separate live credentials.

Current website gap: `/visit-us` has the one-hour cancellation and ₹100 refund wording, but there are not yet full standalone Terms, Privacy, and Refund pages. Add only the policy URLs Razorpay requests, using owner-approved wording. The server still reports the booking/privacy policy versions as drafts and keeps public checkout disabled.

The supplied Razorpay Payment Button (`pl_TpMSC0xjEVMBYJ`) appears in the cart only after the customer selects services and an arrival time, while integrated online booking remains disabled. It collects a fixed ₹100 payment, but it does not pass the selected cart/date/time to this app, hold the arrival time, or confirm an appointment. The page tells customers to contact the studio to confirm first and share their receipt. Do not describe a Payment Button payment as a confirmed booking. For automatic booking confirmation, use the app's server-created Razorpay order flow, which ties a verified payment to the database hold; a Payment Button is a separate no-code collection method. Razorpay's [Payment Button documentation](https://tfs.np.razorpay.in/docs/payments/payment-button/custom) describes its customer fields and post-payment redirect, while its [server integration guide](https://razorpay.com/docs/server-integration/python/test-app/) describes creating an order and verifying the payment signature.

### WhatsApp booking confirmations

The app can send a WhatsApp utility-template message to the salon owner after a Razorpay payment is verified as captured. It sends the customer a separate confirmation only when the customer checks the optional WhatsApp consent box on checkout. Both messages include the booking reference, selected arrival date/time, services, service total, and ₹100 advance; the owner message also includes the customer's name and phone. A standalone Razorpay Payment Button does not trigger this flow because its payment is not tied to this app's booking record.

To connect WhatsApp:

1. Open the [WhatsApp Business Platform developer hub](https://whatsappbusiness.com/developers/developer-hub/) and follow **Get started** to create a Meta developer app and add WhatsApp. Use the Meta-provided test sender and a test recipient first. Meta provides test numbers for sandbox work; a live sender number and a stable production token must be configured before customer messages can go out.
2. In WhatsApp Manager, create two **Utility** templates and wait until both are approved. Use the parameter order exactly as shown below. Save the approved template names and the language code (for example `en` or `en_US`). A payment does not create a WhatsApp service window, so the integration sends approved templates rather than free-form messages.
   - Customer template name `salon_booking_confirm`, body: `Hi {{1}}, your visit at The Dream Beauty Unisex Studio is confirmed. Booking reference: {{2}}. Arrival: {{3}}. Services: {{4}}. Service total: {{5}}. Advance received: {{6}}. The advance is credited against your service bill.`
   - Owner template name `salon_owner_booking`, body: `New website payment confirmed. Booking reference: {{1}}. Customer: {{2}}. Phone: {{3}}. Arrival: {{4}}. Services: {{5}}. Service total: {{6}}. Advance paid: {{7}}. {{8}}`
3. In the Meta app's WhatsApp API setup, copy the **Phone number ID** (not the displayed telephone number) and create a long-lived server token with WhatsApp message permission. Keep the token private.
4. In the Render service's **Environment** settings, set `NOTIFICATIONS_MODE=whatsapp`, then add `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OWNER_NUMBER` (the owner's WhatsApp destination, including country code), `WHATSAPP_CUSTOMER_TEMPLATE`, `WHATSAPP_OWNER_TEMPLATE`, `WHATSAPP_TEMPLATE_LANGUAGE`, and `WHATSAPP_GRAPH_API_VERSION`. Use the latest supported Graph API version from Meta; this project template currently says `v26.0`. `WHATSAPP_DEFAULT_COUNTRY_CODE` defaults to `91`. The sender number and owner recipient should be different numbers. Set the same values in root `.env` for local testing; never put them in `client/.env`, Git, or chat.
5. Deploy, use Razorpay **Test Mode**, and complete a booking using a Meta test recipient opted into WhatsApp updates. Check the outbox/server logs and the recipient phones. An API acceptance is not proof of delivery; check WhatsApp Manager if a recipient does not receive it. Keep `BOOKING_ENABLED=false` until the required prices/menu, policies, database, test payment/webhook, and owner checks are approved.

The booking form's consent is optional and is saved with its wording version and timestamp. If a customer does not opt in, the owner still receives the booking notification, but the customer does not get an automatic WhatsApp message. On uncertain WhatsApp API timeouts the app marks the notification for manual review instead of retrying blindly, to avoid duplicate messages.

### Step 4 — Set up the test webhook after we have a staging website

The current Render URL is already public HTTPS, so use it for the Test Mode webhook. Razorpay cannot deliver webhooks to `localhost`.

1. Open Razorpay Dashboard Webhooks and add a Test Mode webhook.
2. For Test Mode, use `https://dream-beauty-unisex-studio-karanjade.onrender.com/api/webhooks/razorpay` as the webhook URL.
3. Create a strong webhook secret. It is a separate secret from the API Key Secret. Enter it in the Razorpay form and as `RAZORPAY_WEBHOOK_SECRET` in the server's `.env` / secret settings. Razorpay's [webhook setup guide](https://razorpay.com/docs/webhooks/setup-edit-payments/) describes this screen.
4. Select these events: `payment.authorized`, `payment.captured`, `payment.failed`, `refund.processed`, and `refund.failed`.

### Step 5 — Test privately; only then prepare a live launch

Keep `BOOKING_ENABLED=false` through setup. After menu details, salon hours/holidays, policies, database, Razorpay test keys, public staging webhook, WhatsApp templates/provider, and hosting are ready, the test-mode flow must be checked for successful/failed payment, duplicate arrival-time booking, expiry, cancellation/refund, webhook delivery, and both WhatsApp notifications. The site and API need HTTPS hosting; the webhook must use the API's public HTTPS URL. Only after the salon owner reviews and approves those results should live Razorpay account activation/keys and public booking be considered.

Do not paste provider secrets into chat, README, or Git. Enter them only in the ignored local `.env` for development or the hosting provider's server-side secret settings. The website frontend must never contain MongoDB or Razorpay secret values.

## Project documentation

- [Project status](PROJECT_STATUS.md)
- [Menu data review](MENU_DATA_REVIEW.md)
- [Maintenance guide](MAINTENANCE_GUIDE.md)
- [API reference](API_REFERENCE.md)
- [Onboarding checklist](SALON_ONBOARDING_CHECKLIST.md)
- [Deployment runbook](DEPLOYMENT_RUNBOOK.md)
- [Manual QA checklist](MANUAL_QA_CHECKLIST.md)

No production credentials or employee roster are stored in the repository.
