import { useEffect, useRef, useState } from 'react';
import { apiUrl } from './api.js';

const ADVANCE_PAISE = 10_000;
let checkoutScriptPromise;

function salonDate(timezone, date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addCalendarDays(date, count) {
  const day = new Date(`${date}T00:00:00.000Z`);
  day.setUTCDate(day.getUTCDate() + count);
  return day.toISOString().slice(0, 10);
}

function minutesForClock(value) {
  if (/^\d{2}:\d{2}$/.test(value || '')) {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  }
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value || '');
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return hour * 60 + Number(match[2]);
}

function hoursForDate(salon, date) {
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const schedule = salon.bookingSchedule?.weeklyHours?.[weekday];
  if (schedule) return schedule;
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00.000Z`));
  const displayHours = salon.hours?.find((row) => row.day === dayName);
  return displayHours ? { open: displayHours.open, close: displayHours.close } : null;
}

function defaultVisitDate(salon) {
  const timezone = salon.timezone || 'Asia/Kolkata';
  const now = new Date();
  const today = salonDate(timezone, now);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(({ type, value }) => [type, value]));
  const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);
  const todayHours = hoursForDate(salon, today);
  const todayClose = todayHours ? minutesForClock(todayHours.close) : null;
  let date = today;
  if (todayClose !== null && currentMinutes >= todayClose) date = addCalendarDays(today, 1);
  for (let offset = 0; offset < 8; offset += 1) {
    if (hoursForDate(salon, date)) return date;
    date = addCalendarDays(date, 1);
  }
  return today;
}

function formatVisitDate(date, timezone) {
  return new Intl.DateTimeFormat('en-IN', { timeZone: timezone || 'Asia/Kolkata', dateStyle: 'full' })
    .format(new Date(`${date}T12:00:00.000Z`));
}

function formatMoney(paise) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

async function responseJson(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || 'That request could not be completed. Please try again.');
  return result;
}

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutScriptPromise) {
    checkoutScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { checkoutScriptPromise = undefined; reject(new Error('Secure payment checkout could not be loaded.')); };
      document.head.append(script);
    });
  }
  return checkoutScriptPromise;
}

function newSecureToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function isReadyToBook(service) {
  return service.bookable === true
    && service.needsConfirmation !== true
    && Number.isFinite(service.priceRupees)
    && service.priceRupees > 0;
}

function RazorpayPaymentButton() {
  const formRef = useRef(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form || form.querySelector('script[data-payment_button_id="pl_TpMSC0xjEVMBYJ"]')) return undefined;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
    script.async = true;
    script.setAttribute('data-payment_button_id', 'pl_TpMSC0xjEVMBYJ');
    form.append(script);
    return () => script.remove();
  }, []);

  return <form ref={formRef} className="cart-payment-form" aria-label="Razorpay ₹100 advance payment" />;
}

export default function BookingWidget({ salon, services, cartIds, onRemoveFromCart, onBrowseServices, forceClosed = false }) {
  const [readiness, setReadiness] = useState(null);
  const [date, setDate] = useState(() => defaultVisitDate(salon));
  const [startAt, setStartAt] = useState('');
  const [availability, setAvailability] = useState(null);
  const [availabilityState, setAvailabilityState] = useState('idle');
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [whatsappUpdatesOptIn, setWhatsappUpdatesOptIn] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [managed, setManaged] = useState(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const attemptRef = useRef(null);
  const managementRef = useRef(null);
  const cartServices = cartIds.map((id) => services.find((service) => service.id === id)).filter(Boolean);
  const cartIsComplete = cartIds.length > 0 && cartIds.length <= 20
    && cartServices.length === cartIds.length && cartServices.every(isReadyToBook);
  const availabilityServiceId = cartIsComplete ? cartServices[0].id : '';

  useEffect(() => {
    let active = true;
    fetch(apiUrl('/api/booking/readiness')).then(responseJson).then((data) => active && setReadiness(data))
      .catch(() => active && setReadiness({ enabled: false, issues: ['unavailable'] }));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (forceClosed || !availabilityServiceId || !date) {
      setAvailability(null);
      setAvailabilityState('idle');
      return undefined;
    }
    const controller = new AbortController();
    setAvailabilityState('loading');
    setStartAt('');
    setAvailability(null);
    fetch(apiUrl(`/api/availability?serviceId=${encodeURIComponent(availabilityServiceId)}&date=${encodeURIComponent(date)}`), { signal: controller.signal })
      .then(responseJson)
      .then((data) => {
        setAvailability(data);
        setAvailabilityState(data.closed ? 'closed' : (data.slots || []).length ? 'ready' : 'empty');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setAvailability(null);
          setAvailabilityState('error');
        }
      });
    return () => controller.abort();
  }, [forceClosed, availabilityServiceId, date]);

  useEffect(() => {
    const saved = sessionStorage.getItem('salon_booking_management');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.reference && parsed.token) {
        managementRef.current = parsed;
        refreshManaged(parsed.reference, parsed.token).catch(() => {});
      }
    } catch { sessionStorage.removeItem('salon_booking_management'); }
  }, []);

  async function refreshManaged(reference, token) {
    const result = await responseJson(await fetch(apiUrl('/api/bookings/manage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reference }),
    }));
    setManaged(result);
    return result;
  }

  async function verifyAndRefresh(response) {
    const verification = await responseJson(await fetch(apiUrl('/api/bookings/verify-payment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature }),
    }));
    setManaged(verification);
    setMessage(verification.booking.status === 'confirmed'
      ? 'Your payment is verified and your visit booking is confirmed.'
      : verification.payment.status === 'refund_pending'
        ? 'The payment arrived after the hold expired. A refund has been requested and its status is being checked.'
        : 'Your payment is being verified. We will update this page when your visit booking is confirmed.');
    if (verification.booking.status === 'confirmed' || verification.payment.status === 'refund_pending') {
      attemptRef.current = null;
      sessionStorage.removeItem('salon_booking_attempt');
    }
  }

  async function startCheckout() {
    setBusy(true);
    setMessage('');
    try {
      const serviceIds = cartServices.map((service) => service.id);
      const fingerprint = JSON.stringify({ serviceIds, date, startAt, customer, whatsappUpdatesOptIn });
      if (!attemptRef.current || attemptRef.current.fingerprint !== fingerprint) {
        const prior = sessionStorage.getItem('salon_booking_attempt');
        const stored = prior ? JSON.parse(prior) : null;
        attemptRef.current = stored?.fingerprint === fingerprint ? stored : {
          idempotencyKey: crypto.randomUUID(),
          managementToken: newSecureToken(),
          fingerprint,
        };
        sessionStorage.setItem('salon_booking_attempt', JSON.stringify(attemptRef.current));
      }
      const hold = await responseJson(await fetch(apiUrl('/api/bookings/holds'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attemptRef.current.idempotencyKey },
        body: JSON.stringify({
          serviceIds,
          date,
          startAt,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          whatsappUpdatesOptIn,
          managementToken: attemptRef.current.managementToken,
          policyAccepted: acceptedPolicy,
        }),
      }));
      const management = { reference: hold.booking.reference, token: hold.managementToken || attemptRef.current.managementToken };
      managementRef.current = management;
      sessionStorage.setItem('salon_booking_management', JSON.stringify(management));
      if (hold.booking.status === 'confirmed') {
        await refreshManaged(management.reference, management.token);
        setMessage('This visit booking is already confirmed. You can manage it below.');
        return;
      }
      if (!hold.payment) throw new Error('Payment setup is not ready. Your visit booking has not been confirmed.');
      await loadCheckout();
      const checkout = new window.Razorpay({
        key: hold.payment.keyId,
        order_id: hold.payment.orderId,
        amount: hold.payment.amountPaise,
        currency: hold.payment.currency,
        name: salon.name,
        description: `${serviceIds.length} salon service${serviceIds.length === 1 ? '' : 's'} · ₹100 advance`,
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        notes: { booking_reference: hold.booking.reference },
        theme: { color: '#8e6258' },
        handler: async (paymentResponse) => {
          setBusy(true);
          try { await verifyAndRefresh(paymentResponse); }
          catch (error) { setMessage(error.message); }
          finally { setBusy(false); }
        },
        modal: { ondismiss: () => setMessage('The payment window was closed. Your arrival time is held briefly; reopen checkout before the hold expires.') },
      });
      checkout.on('payment.failed', (event) => setMessage(event.error?.description || 'Payment did not complete. You can try checkout again while the hold is active.'));
      checkout.open();
      setManaged({ booking: hold.booking, payment: { status: hold.payment.status }, refund: null });
      setMessage(`Your arrival time is held for 10 minutes. Complete the ${formatMoney(ADVANCE_PAISE)} advance payment to confirm your visit.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelManaged() {
    if (!managementRef.current) return;
    setBusy(true);
    setMessage('');
    try {
      const { reference, token } = managementRef.current;
      const result = await responseJson(await fetch(apiUrl('/api/bookings/cancel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference }),
      }));
      setManaged(result);
      setConfirmingCancel(false);
      setMessage(result.refund?.status === 'processing' || result.refund?.status === 'pending'
        ? 'Your visit booking is cancelled. The ₹100 refund is being processed; its status will update when the provider confirms it.'
        : result.refund?.status === 'manual_review'
          ? 'Your visit booking is cancelled. The salon is checking the refund status with the payment provider.'
          : result.payment?.status === 'refund_failed'
            ? 'Your visit booking is cancelled. The refund request failed, and the salon has been asked to review it.'
            : result.payment?.status === 'authorized'
              ? 'Your visit booking is cancelled. The payment is authorized but not captured; the salon will review it if the provider later reports a captured payment.'
              : 'Your visit booking is cancelled.');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const needsRefresh = ['held', 'confirmed'].includes(managed?.booking?.status)
      || ['pending', 'processing'].includes(managed?.refund?.status)
      || managed?.payment?.status === 'refund_pending';
    if (!needsRefresh || !managementRef.current) return undefined;
    const timer = window.setInterval(() => {
      refreshManaged(managementRef.current.reference, managementRef.current.token).catch(() => {});
    }, 8000);
    return () => window.clearInterval(timer);
  }, [managed?.booking?.status, managed?.payment?.status, managed?.refund?.status]);

  const servicePricePaise = cartServices.reduce((total, service) => (
    Number.isFinite(service.priceRupees) ? total + Math.round(service.priceRupees * 100) : total
  ), 0);
  const remainingBalancePaise = Math.max(0, servicePricePaise - ADVANCE_PAISE);
  const changeReturnedAfterServicePaise = Math.max(0, ADVANCE_PAISE - servicePricePaise);
  const slots = availability?.slots || [];
  const selectedArrival = slots.find((slot) => slot.startAt === startAt);
  const showBooking = !forceClosed;
  const paymentEnabled = readiness?.enabled && !forceClosed;
  const canSubmit = paymentEnabled && cartIsComplete && availabilityState === 'ready'
    && slots.some((slot) => slot.startAt === startAt) && customer.name.trim().length >= 2
    && customer.phone.trim().length >= 7 && acceptedPolicy && !busy;

  if (forceClosed && !managed && !message) return null;

  return (
    <div className="booking-widget">
      {showBooking ? (
        <>
          {cartServices.length > 0 ? <section className="cart-panel" aria-labelledby="cart-title">
            <div className="cart-panel-heading"><div><p className="eyebrow">Your selection</p><h3 id="cart-title">Services in your visit</h3></div><span>{cartServices.length} item{cartServices.length === 1 ? '' : 's'}</span></div>
            <ul className="cart-items">{cartServices.map((service) => {
              const serviceReady = isReadyToBook(service);
              return <li className={`cart-item${serviceReady ? '' : ' is-unconfirmed'}`} key={service.id}>
                <div><strong>{service.name}</strong><small>{serviceReady ? 'Price confirmed' : 'Price or details need confirmation'}</small></div>
                <strong>{service.priceDisplay || (Number.isFinite(service.priceRupees) ? formatMoney(Math.round(service.priceRupees * 100)) : 'To confirm')}</strong>
                <button type="button" className="cart-item-remove" onClick={() => onRemoveFromCart(service.id)} aria-label={`Remove ${service.name} from cart`}>Remove</button>
              </li>;
            })}</ul>
            <div className="cart-total-row"><span>{cartIsComplete ? 'Service total' : 'Confirmed price subtotal'}</span><strong>{formatMoney(servicePricePaise)}</strong></div>
            {!cartIsComplete && <p className="cart-warning" role="status">One or more selected items need confirmed menu details before checkout. Remove them or choose other services.</p>}
            <button type="button" className="text-link cart-browse-link" onClick={onBrowseServices}>Add another service <span aria-hidden="true">↗</span></button>
          </section> : <section className="cart-empty">
            <span className="cart-empty-mark" aria-hidden="true">✳</span><h3>Your cart is ready for a service.</h3><p>Browse the menu, add the services you want, then return here to choose a visit date and arrival time.</p>
            <button type="button" className="button button-dark" onClick={onBrowseServices}>Browse services <span aria-hidden="true">↗</span></button>
          </section>}
          {cartServices.length > 0 && <>
          <div className="booking-fields">
            <label>Choose a date
              <input type="date" min={defaultVisitDate(salon)} max={addCalendarDays(salonDate(salon.timezone), 60)} value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
          </div>
          {availability?.visitHours && <p className="booking-arrival-note">Arrival times are available from {availability.visitHours.open} to {availability.visitHours.close}. Your selected time is when to arrive; the service begins when a team member is available.</p>}
          {readiness && !paymentEnabled && <p className="booking-arrival-note">These times follow the salon schedule. Your visit cannot be reserved until online checkout is enabled.</p>}
          <fieldset className="slot-picker">
            <legend>Choose your arrival time</legend>
            {availabilityState === 'loading' && <p role="status">Checking arrival times…</p>}
            {availabilityState === 'closed' && <p>The studio is closed on this date. Please choose another day.</p>}
            {availabilityState === 'empty' && <p>No later arrival times are available for this date. Try another day.</p>}
            {availabilityState === 'error' && <p role="alert">Arrival times are temporarily unavailable. Please try again.</p>}
            {availabilityState === 'ready' && <div className="slot-list">{slots.map((slot) => (
              <button className={startAt === slot.startAt ? 'slot-choice is-selected' : 'slot-choice'} type="button" key={slot.startAt} aria-pressed={startAt === slot.startAt} onClick={() => setStartAt(slot.startAt)}>
                {slot.time}
              </button>
            ))}</div>}
          </fieldset>
          {selectedArrival && <p className="booking-arrival-note">Selected arrival: {formatVisitDate(date, salon.timezone)} at {selectedArrival.time}. Your services begin when the team is available.</p>}
          {!paymentEnabled && cartIsComplete && selectedArrival && <section className="cart-payment-panel" aria-labelledby="cart-payment-title">
            <p className="eyebrow">Razorpay payment</p>
            <h3 id="cart-payment-title">Pay the ₹100 advance</h3>
            <p>This fixed payment button collects ₹100 only. It does not send your selected services or arrival time to our booking system and does not reserve the slot. Please contact the studio to confirm your visit before paying, then share your Razorpay receipt with the team.</p>
            <RazorpayPaymentButton />
            <p>This manual payment button cannot trigger automatic booking confirmation or WhatsApp messages. The integrated checkout will replace it after the database and payment setup is ready.</p>
          </section>}
          {paymentEnabled ? <>
            <div className="booking-fields">
              <label>Your name
                <input autoComplete="name" maxLength={100} value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} />
              </label>
              <label>Phone number
                <input autoComplete="tel" inputMode="tel" maxLength={20} value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />
              </label>
              {readiness?.whatsappNotificationsEnabled && <label className="policy-consent">
                <input type="checkbox" checked={whatsappUpdatesOptIn} onChange={(event) => setWhatsappUpdatesOptIn(event.target.checked)} />
                <span>I agree to receive booking and payment updates on WhatsApp from {salon.name} at the phone number above. This is optional.</span>
              </label>}
              <label>Email for receipt and updates <span>(optional)</span>
                <input autoComplete="email" inputMode="email" type="email" maxLength={254} value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} />
              </label>
            </div>
            <label className="policy-consent">
              <input type="checkbox" checked={acceptedPolicy} onChange={(event) => setAcceptedPolicy(event.target.checked)} />
              <span>I agree to the booking policy. The {formatMoney(ADVANCE_PAISE)} advance is for this visit and is credited against my service bill. If the combined services cost less than the advance, the studio returns the difference in cash after service. The selected time is my arrival time; services begin when the team is available. I can request a full refund of the captured advance if I cancel at least one hour before arrival.</span>
            </label>
            {cartIsComplete && <p className="advance-summary">Service total {formatMoney(servicePricePaise)} · Pay {formatMoney(ADVANCE_PAISE)} once online now · {changeReturnedAfterServicePaise > 0 ? `${formatMoney(changeReturnedAfterServicePaise)} change returned in cash after service.` : remainingBalancePaise > 0 ? `${formatMoney(remainingBalancePaise)} balance paid at the salon.` : 'Nothing more is due at the salon.'}</p>}
            <button className="button button-light booking-submit" type="button" disabled={!canSubmit} onClick={startCheckout}>{busy ? 'Please wait…' : 'Continue to secure payment'} <span aria-hidden="true">↗</span></button>
          </> : <div className="booking-unavailable" role="status">
            <p>{readiness ? 'Online booking is still being prepared. Your selected services, date, and arrival time are not submitted or reserved by this page.' : 'Checking payment and booking setup…'}</p>
            {salon.phone && <a className="button button-light" href={`tel:${salon.phone}`}>Call the studio</a>}
          </div>}
          </>}
        </>
      ) : null}

      {message && <p className="booking-feedback" role="status">{message}</p>}
      {managed && <div className="booking-management" aria-live="polite">
        <p><strong>Booking {managed.booking.reference}</strong></p>
        <p>Visit: {managed.booking.visitDate ? formatVisitDate(managed.booking.visitDate, managed.booking.salonTimezone) : ''}{managed.booking.startAt && <> · arrive at {new Intl.DateTimeFormat('en-IN', { timeZone: managed.booking.salonTimezone, timeStyle: 'short' }).format(new Date(managed.booking.startAt))}</>}</p>
        {(managed.booking.services?.length ? managed.booking.services : [{ serviceName: managed.booking.serviceName, pricePaise: managed.booking.servicePricePaise }]).map((service) => <p key={service.serviceId || service.serviceName}>Service: <strong>{service.serviceName}</strong>{Number.isFinite(service.pricePaise) ? ` · ${formatMoney(service.pricePaise)}` : ''}</p>)}
        <p>Service total: <strong>{formatMoney(managed.booking.servicePricePaise)}</strong>. Your selected time is your arrival time; services begin when the team is available.</p>
        <p>Booking status: <strong>{managed.booking.status.replaceAll('_', ' ')}</strong> · Payment status: <strong>{managed.payment?.status || 'not available'}</strong>{managed.refund && <> · Refund status: <strong>{managed.refund.status.replaceAll('_', ' ')}</strong></>}</p>
        {managed.booking.cancellationAllowed && !confirmingCancel && <button className="booking-cancel-link" type="button" onClick={() => setConfirmingCancel(true)}>Cancel this booking</button>}
        {['held', 'confirmed'].includes(managed.booking.status) && !managed.booking.cancellationAllowed && <p>Online cancellation closes one hour before your selected arrival time. Please contact the studio for help.</p>}
        {confirmingCancel && <div className="cancel-confirm"><p>Cancel the visit booking? Online cancellation is available until one hour before your arrival time. Any captured ₹100 advance will be refunded to the original payment method.</p><button type="button" className="button button-light" disabled={busy} onClick={cancelManaged}>Confirm cancellation</button><button type="button" className="booking-cancel-link" onClick={() => setConfirmingCancel(false)}>Keep booking</button></div>}
      </div>}
    </div>
  );
}
