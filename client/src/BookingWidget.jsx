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

function formatArrivalWindow(startAt, endAt, timezone) {
  const formatter = new Intl.DateTimeFormat('en-IN', { timeZone: timezone || 'Asia/Kolkata', timeStyle: 'short' });
  const start = formatter.format(new Date(startAt));
  return endAt ? `${start} to ${formatter.format(new Date(endAt))}` : start;
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
  return service.active === true
    && service.menuSelectable === true
    && service.needsConfirmation !== true
    && Number.isFinite(service.priceRupees)
    && service.priceRupees > 0;
}

function getBookingOutcome(managed, paymentWasChecked = false) {
  if (!managed?.booking) return null;
  const { booking, payment, refund } = managed;
  const paymentStatus = payment?.status;
  const refundStatus = refund?.status;
  const visit = booking.visitDate
    ? `${formatVisitDate(booking.visitDate, booking.salonTimezone)}${booking.startAt ? `, ${formatArrivalWindow(booking.startAt, booking.arrivalWindowEndAt, booking.salonTimezone)}` : ''}`
    : 'your selected time';

  if (booking.status === 'confirmed' && paymentStatus === 'captured') {
    return { tone: 'success', icon: '✓', title: 'Your payment was successful', body: `Your ₹100 advance was received. Your visit is confirmed for ${visit}.` };
  }
  if (refundStatus === 'processed' || paymentStatus === 'refunded') {
    return booking.status === 'cancelled'
      ? { tone: 'info', icon: '↩', title: 'Your booking was cancelled and refunded', body: 'The ₹100 refund has been processed. Your services are still in your cart if you would like to book another visit.' }
      : { tone: 'info', icon: '↩', title: 'Your booking was not confirmed; refund processed', body: 'The ₹100 payment has been refunded. Your services are still in your cart, so you can choose another arrival time.' };
  }
  if (paymentStatus === 'refund_pending' || ['pending', 'submitting', 'processing'].includes(refundStatus)) {
    return booking.status === 'cancelled'
      ? { tone: 'warning', icon: '↩', title: 'Your booking was cancelled; refund requested', body: 'A refund of your ₹100 advance has been requested. Your cart is saved.' }
      : { tone: 'warning', icon: '↩', title: 'The visit was not confirmed; refund requested', body: 'The arrival hold expired before the payment could confirm the visit. A refund of your ₹100 advance has been requested. Your cart is saved.' };
  }
  if (paymentStatus === 'refund_failed' || refundStatus === 'failed' || refundStatus === 'manual_review' || paymentStatus === 'manual_review') {
    return { tone: 'warning', icon: '!', title: 'The salon is checking your payment', body: 'Your visit is not confirmed yet. The studio needs to review the payment or refund status. Please do not pay again; your cart is saved.' };
  }
  if (booking.status === 'expired') {
    if (paymentStatus === 'authorized') {
      return { tone: 'warning', icon: '!', title: 'Payment is authorized, but the visit is not confirmed', body: 'Do not pay again. Check the payment status again shortly or contact the studio; your cart is saved.' };
    }
    return paymentWasChecked
      ? { tone: 'info', icon: '↻', title: 'No completed payment found for this expired hold', body: 'Your visit was not confirmed, and your cart is saved. Choose an available arrival time and try again.' }
      : { tone: 'warning', icon: '!', title: 'This arrival hold expired', body: 'Your visit is not confirmed. If you completed payment, check its status before trying again. Your cart is still saved.' };
  }
  if (paymentStatus === 'failed') {
    return { tone: 'error', icon: '×', title: 'Your payment did not go through', body: 'No visit was confirmed. Your services, date, and time are still selected so you can try again.' };
  }
  if (booking.status === 'cancelled') {
    return { tone: 'info', icon: 'i', title: 'This booking is cancelled', body: refundStatus === 'processed' ? 'The refund has been processed.' : 'Your services remain in the cart if you would like to make another booking.' };
  }
  if (paymentStatus === 'authorized') {
    return { tone: 'pending', icon: '…', title: 'Payment confirmation is pending', body: 'Your payment is authorized but the visit is not confirmed yet. Keep this page open while we check the payment.' };
  }
  if (booking.status === 'held') {
    return { tone: 'pending', icon: '…', title: 'Your arrival time is being held', body: 'Complete the ₹100 advance payment before the 10-minute hold expires to confirm your visit.' };
  }
  return null;
}

function bookingStatusLabel(status) {
  return ({ held: 'Awaiting payment', confirmed: 'Confirmed', expired: 'Expired · not confirmed', cancelled: 'Cancelled', manual_resolution: 'Needs salon review' })[status] || 'Pending';
}

function paymentStatusLabel(status) {
  return ({
    order_pending: 'Preparing checkout', order_creating: 'Preparing checkout', created: 'Awaiting confirmation',
    authorized: 'Authorized · awaiting confirmation', captured: 'Successful', failed: 'Failed',
    refund_pending: 'Refund requested', refunded: 'Refunded', refund_failed: 'Refund needs review', manual_review: 'Needs salon review',
  })[status] || 'Not available';
}

export default function BookingWidget({ salon, services, cartIds, onRemoveFromCart, onBrowseServices, onBookingConfirmed = () => {}, forceClosed = false }) {
  const [readiness, setReadiness] = useState(null);
  const [date, setDate] = useState(() => defaultVisitDate(salon));
  const [startAt, setStartAt] = useState('');
  const [availability, setAvailability] = useState(null);
  const [availabilityState, setAvailabilityState] = useState('idle');
  const [customer, setCustomer] = useState({ name: '', phone: '', gender: '', age: '' });
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('info');
  const [managed, setManaged] = useState(null);
  const [reconciledReference, setReconciledReference] = useState('');
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const attemptRef = useRef(null);
  const managementRef = useRef(null);
  const timePickerRef = useRef(null);
  const timePickerTriggerRef = useRef(null);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const showMessage = (text, tone = 'info') => {
    setMessage(text);
    setMessageTone(tone);
  };
  const cartServices = cartIds.map((id) => services.find((service) => service.id === id)).filter(Boolean);
  const cartIsComplete = cartIds.length > 0 && cartIds.length <= 20
    && cartServices.length === cartIds.length && cartServices.every(isReadyToBook);
  const availabilityServiceIds = cartIsComplete ? cartServices.map((service) => service.id).join(',') : '';

  useEffect(() => {
    let active = true;
    fetch(apiUrl('/api/booking/readiness')).then(responseJson).then((data) => active && setReadiness(data))
      .catch(() => active && setReadiness({ enabled: false, issues: ['unavailable'] }));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (forceClosed || !availabilityServiceIds || !date) {
      setAvailability(null);
      setAvailabilityState('idle');
      return undefined;
    }
    const controller = new AbortController();
    setAvailabilityState('loading');
    setStartAt('');
    setAvailability(null);
    const query = new URLSearchParams({ date });
    availabilityServiceIds.split(',').forEach((id) => query.append('serviceIds', id));
    fetch(apiUrl(`/api/availability?${query.toString()}`), { signal: controller.signal })
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
  }, [forceClosed, availabilityServiceIds, date]);

  useEffect(() => {
    const dialog = timePickerRef.current;
    if (!timePickerOpen || !dialog) return undefined;

    if (!dialog.open) dialog.showModal();
    const selectedButton = dialog.querySelector('.slot-choice.is-selected');
    (selectedButton || dialog.querySelector('.slot-choice') || dialog.querySelector('.slot-dialog-close'))?.focus();

    return () => {
      if (dialog.open) dialog.close();
      timePickerTriggerRef.current?.focus();
    };
  }, [timePickerOpen]);

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

  async function reconcileManagedPayment() {
    if (!managementRef.current) return;
    setBusy(true);
    showMessage('Checking the payment status securely…');
    try {
      const { reference, token } = managementRef.current;
      const result = await responseJson(await fetch(apiUrl('/api/bookings/reconcile-payment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ reference }),
      }));
      setManaged(result);
      if (result.booking.status === 'confirmed') {
        const bookedIds = (result.booking.services || []).map((service) => service.serviceId).filter(Boolean);
        onBookingConfirmed(bookedIds);
        setReconciledReference('');
        showMessage('Payment successful — your visit is confirmed.', 'success');
      } else if (result.booking.status === 'expired' && ['created', 'failed'].includes(result.payment?.status)) {
        setReconciledReference(result.booking.reference);
        attemptRef.current = null;
        sessionStorage.removeItem('salon_booking_attempt');
        showMessage('No completed payment was found for the expired hold. Your cart is saved; you can choose an available time and try again.', 'info');
      } else if (result.booking.status === 'expired' && result.payment?.status === 'authorized') {
        showMessage('Razorpay reports an authorized payment, but it has not confirmed the visit. Do not pay again; check again shortly or contact the studio.', 'warning');
      } else if (result.payment?.status === 'refund_pending') {
        attemptRef.current = null;
        sessionStorage.removeItem('salon_booking_attempt');
        showMessage('Your booking was not confirmed. A refund for the captured advance has been requested.', 'warning');
      } else {
        showMessage('Razorpay has not confirmed this payment yet. Do not pay again while the status is pending.', 'warning');
      }
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndRefresh(response, submittedServiceIds) {
    const verification = await responseJson(await fetch(apiUrl('/api/bookings/verify-payment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature }),
    }));
    setManaged(verification);
    showMessage(verification.booking.status === 'confirmed'
      ? 'Payment successful — your visit is confirmed.'
      : verification.payment.status === 'refund_pending'
        ? 'Your booking was not confirmed. A refund for the captured advance has been requested.'
        : 'Your payment is being checked. Do not pay again while confirmation is pending.',
    verification.booking.status === 'confirmed' ? 'success' : verification.payment.status === 'refund_pending' ? 'warning' : 'info');
    if (verification.booking.status === 'confirmed') {
      const bookedIds = (verification.booking.services || []).map((service) => service.serviceId).filter(Boolean);
      onBookingConfirmed(bookedIds.length ? bookedIds : submittedServiceIds);
      setReconciledReference('');
      attemptRef.current = null;
      sessionStorage.removeItem('salon_booking_attempt');
    } else if (verification.payment.status === 'refund_pending') {
      attemptRef.current = null;
      sessionStorage.removeItem('salon_booking_attempt');
    }
  }

  async function startCheckout() {
    setBusy(true);
    showMessage('');
    try {
      const serviceIds = cartServices.map((service) => service.id);
      const fingerprint = JSON.stringify({ serviceIds, date, startAt, customer });
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
          gender: customer.gender,
          age: Number(customer.age),
          managementToken: attemptRef.current.managementToken,
          policyAccepted: acceptedPolicy,
        }),
      }));
      const management = { reference: hold.booking.reference, token: hold.managementToken || attemptRef.current.managementToken };
      managementRef.current = management;
      sessionStorage.setItem('salon_booking_management', JSON.stringify(management));
      if (hold.booking.status === 'confirmed') {
        await refreshManaged(management.reference, management.token);
        onBookingConfirmed(serviceIds);
        setReconciledReference('');
        showMessage('Payment successful — your visit is confirmed.', 'success');
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
        prefill: { name: customer.name, contact: customer.phone },
        notes: { booking_reference: hold.booking.reference },
        theme: { color: '#8e6258' },
        handler: async (paymentResponse) => {
          setBusy(true);
          try { await verifyAndRefresh(paymentResponse, serviceIds); }
          catch { showMessage('We received your payment response, but could not confirm the booking yet. Do not pay again; use Check payment status below.', 'warning'); }
          finally { setBusy(false); }
        },
        modal: { ondismiss: () => showMessage('Checkout was closed. Your cart is saved; the arrival time is held briefly while you decide whether to retry.', 'info') },
      });
      checkout.on('payment.failed', (event) => showMessage(event.error?.description || 'Payment did not go through. Your cart is saved; you can try again while the arrival hold is active.', 'error'));
      checkout.open();
      setManaged({ booking: hold.booking, payment: { status: hold.payment.status }, refund: null });
      showMessage(`Your arrival time is held for 10 minutes. Pay ${formatMoney(ADVANCE_PAISE)} to confirm your visit.`, 'info');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function cancelManaged() {
    if (!managementRef.current) return;
    setBusy(true);
    showMessage('');
    try {
      const { reference, token } = managementRef.current;
      const result = await responseJson(await fetch(apiUrl('/api/bookings/cancel'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference }),
      }));
      setManaged(result);
      setConfirmingCancel(false);
      showMessage(result.refund?.status === 'processing' || result.refund?.status === 'pending'
        ? 'Your visit booking is cancelled. The ₹100 refund is being processed; its status will update when the provider confirms it.'
        : result.refund?.status === 'manual_review'
          ? 'Your visit booking is cancelled. The salon is checking the refund status with the payment provider.'
          : result.payment?.status === 'refund_failed'
            ? 'Your visit booking is cancelled. The refund request failed, and the salon has been asked to review it.'
            : result.payment?.status === 'authorized'
              ? 'Your visit booking is cancelled. The payment is authorized but not captured; the salon will review it if the provider later reports a captured payment.'
              : 'Your visit booking is cancelled.',
      result.refund?.status === 'processing' || result.refund?.status === 'pending' || result.refund?.status === 'manual_review' ? 'warning' : 'info');
    } catch (error) { showMessage(error.message, 'error'); }
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
  const expiredPaymentNeedsCheck = managed?.booking?.status === 'expired'
    && ['created', 'authorized', 'failed'].includes(managed?.payment?.status)
    && reconciledReference !== managed.booking.reference;
  const canSubmit = paymentEnabled && cartIsComplete && availabilityState === 'ready'
    && slots.some((slot) => slot.startAt === startAt) && customer.name.trim().length >= 2
    && customer.phone.trim().length >= 7 && ['male', 'female'].includes(customer.gender)
    && Number.isInteger(Number(customer.age)) && Number(customer.age) >= 1 && Number(customer.age) <= 120
    && acceptedPolicy && !busy && !expiredPaymentNeedsCheck;
  const bookingOutcome = getBookingOutcome(managed, reconciledReference === managed?.booking?.reference);

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
                <div><strong>{service.name}</strong><small>{serviceReady ? 'Price confirmed · choose an arrival time' : 'Price or service details need confirmation'}</small></div>
                <strong>{service.priceDisplay || (Number.isFinite(service.priceRupees) ? formatMoney(Math.round(service.priceRupees * 100)) : 'To confirm')}</strong>
                <button type="button" className="cart-item-remove" onClick={() => onRemoveFromCart(service.id)} aria-label={`Remove ${service.name} from cart`}>Remove</button>
              </li>;
            })}</ul>
            <div className="cart-total-row"><span>{cartIsComplete ? 'Service total' : 'Confirmed price subtotal'}</span><strong>{formatMoney(servicePricePaise)}</strong></div>
            {!cartIsComplete && <p className="cart-warning" role="status">A service with a confirmed name and price is required before checkout. You can still review your cart.</p>}
            <button type="button" className="text-link cart-browse-link" onClick={onBrowseServices}>Add another service <span aria-hidden="true">↗</span></button>
          </section> : <section className="cart-empty">
            <span className="cart-empty-mark" aria-hidden="true">✳</span><h3>Your cart is ready for a service.</h3><p>Browse the menu, add the services you want, then return here to choose an arrival date and time.</p>
            <button type="button" className="button button-dark" onClick={onBrowseServices}>Browse services <span aria-hidden="true">↗</span></button>
          </section>}
          {cartServices.length > 0 && <>
          <div className="booking-fields">
            <label>Choose a date
              <input type="date" disabled={!cartIsComplete} min={defaultVisitDate(salon)} max={addCalendarDays(salonDate(salon.timezone), 60)} value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
          </div>
          {!cartIsComplete && <p className="booking-arrival-note" role="status">Choose services with confirmed prices before selecting an arrival time.</p>}
          {availability?.visitHours && <p className="booking-arrival-note">Choose a one-hour arrival window during salon hours, from {availability.visitHours.open} to {availability.visitHours.close}. The service may begin when the salon team is available.</p>}
          {readiness && !paymentEnabled && <p className="booking-arrival-note">You can choose your date and arrival time, but online booking and payment are not enabled yet, so this page will not reserve the slot.</p>}
          <fieldset className="slot-picker">
            <legend>Choose your arrival window</legend>
            {!cartIsComplete && <p>Select services with confirmed prices to check available arrival windows.</p>}
            {availabilityState === 'loading' && <p role="status">Checking arrival times…</p>}
            {availabilityState === 'closed' && <p>The studio is closed on this date. Please choose another day.</p>}
            {availabilityState === 'empty' && <p>No arrival windows are available for this date. Try another day.</p>}
            {availabilityState === 'error' && <p role="alert">Arrival times are temporarily unavailable. Please try again.</p>}
            {availabilityState === 'ready' && <button
              ref={timePickerTriggerRef}
              className="slot-picker-trigger"
              type="button"
              aria-haspopup="dialog"
              aria-expanded={timePickerOpen}
              onClick={() => setTimePickerOpen(true)}
            >
              <span>{selectedArrival ? selectedArrival.time : 'Select an arrival window'}</span>
              <span>{selectedArrival ? 'Change time' : `${slots.length} times available`} <span aria-hidden="true">⌄</span></span>
            </button>}
          </fieldset>
          {timePickerOpen && availabilityState === 'ready' && <dialog
            ref={timePickerRef}
            className="slot-dialog"
            aria-labelledby="slot-dialog-title"
            onClose={() => setTimePickerOpen(false)}
            onClick={(event) => { if (event.target === timePickerRef.current) setTimePickerOpen(false); }}
          >
            <div className="slot-dialog-heading">
              <div><p className="eyebrow">{formatVisitDate(date, salon.timezone)}</p><h3 id="slot-dialog-title">Choose your arrival window</h3></div>
              <button className="slot-dialog-close" type="button" aria-label="Close arrival time choices" onClick={() => setTimePickerOpen(false)}>×</button>
            </div>
            <p className="slot-dialog-note">This one-hour window tells the salon when you plan to arrive. The service may begin when the team is available.</p>
            <div className="slot-list">{slots.map((slot) => (
              <button className={startAt === slot.startAt ? 'slot-choice is-selected' : 'slot-choice'} type="button" key={slot.startAt} aria-pressed={startAt === slot.startAt} onClick={() => { setStartAt(slot.startAt); setTimePickerOpen(false); }}>
                {slot.time}
              </button>
            ))}</div>
          </dialog>}
          {selectedArrival && <p className="booking-arrival-note">Selected arrival window: {formatVisitDate(date, salon.timezone)}, {selectedArrival.time}.</p>}
          <>
            <div className="booking-fields">
              <label>Your name
                <input autoComplete="name" maxLength={100} value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} />
              </label>
              <label>Phone number
                <input autoComplete="tel" inputMode="tel" maxLength={20} value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />
              </label>
              <label>Gender
                <select value={customer.gender} onChange={(event) => setCustomer({ ...customer, gender: event.target.value })}>
                  <option value="">Choose</option><option value="male">Male</option><option value="female">Female</option>
                </select>
              </label>
              <label>Age
                <input type="number" inputMode="numeric" min="1" max="120" step="1" value={customer.age} onChange={(event) => setCustomer({ ...customer, age: event.target.value })} />
              </label>
            </div>
            <label className="policy-consent">
              <input type="checkbox" checked={acceptedPolicy} onChange={(event) => setAcceptedPolicy(event.target.checked)} />
              <span>I agree to the booking policy. The {formatMoney(ADVANCE_PAISE)} advance is credited against my service bill. If the services cost less than the advance, the studio returns the difference in cash after service. My selected time is an arrival window; the service may start when the salon team is available. I can request a full refund if I cancel at least one hour before the window begins.</span>
            </label>
            {cartIsComplete && <p className="advance-summary">Service total {formatMoney(servicePricePaise)} · Pay {formatMoney(ADVANCE_PAISE)} once online now · {changeReturnedAfterServicePaise > 0 ? `${formatMoney(changeReturnedAfterServicePaise)} change returned in cash after service.` : remainingBalancePaise > 0 ? `${formatMoney(remainingBalancePaise)} balance paid at the salon.` : 'Nothing more is due at the salon.'}</p>}
            <button className="button button-light booking-submit" type="button" disabled={!canSubmit} onClick={startCheckout}>{busy ? 'Please wait…' : 'Pay ₹100 advance'} <span aria-hidden="true">↗</span></button>
            {!paymentEnabled && <div className="booking-unavailable" role="status">
            <p>{readiness ? 'Online booking and payment are not enabled yet. This page will not submit customer details or reserve the selected time until setup is enabled.' : 'Checking payment and booking setup…'}</p>
            {salon.phone && <a className="button button-light" href={`tel:${salon.phone}`}>Call the studio</a>}
          </div>}
          </>
          </>}
        </>
      ) : null}

      {bookingOutcome && <section className={`booking-outcome is-${bookingOutcome.tone}`} aria-live="polite" role="status">
        <span className="booking-outcome-mark" aria-hidden="true">{bookingOutcome.icon}</span>
        <div><p className="eyebrow">Visit payment update</p><h3>{bookingOutcome.title}</h3><p>{bookingOutcome.body}</p></div>
      </section>}
      {message && <p className={`booking-feedback is-${messageTone}`} role={messageTone === 'error' ? 'alert' : 'status'}>{message}</p>}
      {managed && <div className="booking-management" aria-live="polite">
        <p><strong>Booking {managed.booking.reference}</strong></p>
        <p>Arrival window: {managed.booking.visitDate ? formatVisitDate(managed.booking.visitDate, managed.booking.salonTimezone) : ''}{managed.booking.startAt && <> · {formatArrivalWindow(managed.booking.startAt, managed.booking.arrivalWindowEndAt, managed.booking.salonTimezone)}</>}</p>
        {(managed.booking.services?.length ? managed.booking.services : [{ serviceName: managed.booking.serviceName, pricePaise: managed.booking.servicePricePaise }]).map((service) => <p key={service.serviceId || service.serviceName}>Service: <strong>{service.serviceName}</strong>{Number.isFinite(service.pricePaise) ? ` · ${formatMoney(service.pricePaise)}` : ''}</p>)}
        <p>Service total: <strong>{formatMoney(managed.booking.servicePricePaise)}</strong></p>
        {managed.booking.customer && <p>Customer: <strong>{managed.booking.customer.name}</strong> · {managed.booking.customer.phone} · {managed.booking.customer.gender} · age {managed.booking.customer.age}</p>}
        <p>Booking: <strong>{bookingStatusLabel(managed.booking.status)}</strong> · Payment: <strong>{paymentStatusLabel(managed.payment?.status)}</strong>{managed.refund && <> · Refund: <strong>{managed.refund.status === 'processed' ? 'Processed' : managed.refund.status === 'failed' ? 'Needs review' : managed.refund.status.replaceAll('_', ' ')}</strong></>}</p>
        {((['held', 'expired'].includes(managed.booking.status) && ['created', 'authorized', 'failed'].includes(managed.payment?.status) && (managed.booking.status !== 'expired' || reconciledReference !== managed.booking.reference)) || (managed.booking.cancellationAllowed && !confirmingCancel)) && <div className="booking-management-actions">
          {['held', 'expired'].includes(managed.booking.status) && ['created', 'authorized', 'failed'].includes(managed.payment?.status) && (managed.booking.status !== 'expired' || reconciledReference !== managed.booking.reference) && <button className="booking-action-button booking-action-primary" type="button" disabled={busy} onClick={reconcileManagedPayment}>{busy ? 'Checking payment…' : 'Check payment status'}</button>}
          {managed.booking.cancellationAllowed && !confirmingCancel && <button className="booking-action-button booking-action-secondary" type="button" disabled={busy} onClick={() => setConfirmingCancel(true)}>Cancel this booking</button>}
        </div>}
        {['held', 'confirmed'].includes(managed.booking.status) && !managed.booking.cancellationAllowed && <p>Online cancellation closes one hour before your arrival time. Please contact the studio for help.</p>}
        {confirmingCancel && <div className="cancel-confirm"><p>Cancel the visit booking? Online cancellation is available until one hour before arrival. Any captured ₹100 advance will be refunded to the original payment method.</p><button type="button" className="button button-light" disabled={busy} onClick={cancelManaged}>Confirm cancellation</button><button type="button" className="booking-cancel-link" onClick={() => setConfirmingCancel(false)}>Keep booking</button></div>}
      </div>}
    </div>
  );
}
