const env = import.meta.env || {};
const META_PIXEL_ID = String(env.VITE_META_PIXEL_ID || '').trim();
const CONSENT_KEY = 'dream-beauty-marketing-consent-v1';
const ATTRIBUTION_KEY = 'dream-beauty-marketing-attribution-v1';
const ATTRIBUTION_CHANNELS = new Set([
  'direct', 'instagram_ad', 'facebook_ad', 'organic_instagram', 'organic_facebook', 'other_referral',
]);
let pixelInitialized = false;

function browserWindow() {
  return typeof window === 'undefined' ? null : window;
}

function safeLabel(value, maxLength = 120) {
  return String(value || '').replace(/[^\p{L}\p{N}._ -]/gu, '').trim().slice(0, maxLength);
}

function marketingConsent() {
  const current = browserWindow();
  if (!current) return null;
  try {
    const saved = current.localStorage.getItem(CONSENT_KEY);
    return saved === 'granted' || saved === 'denied' ? saved : null;
  } catch {
    return null;
  }
}

export function isMetaPixelConfigured() {
  return /^\d{5,24}$/.test(META_PIXEL_ID);
}

export function readMarketingConsent() {
  return marketingConsent();
}

export function normalizeCampaignAttribution(search = '', referrer = '', currentOrigin = '') {
  const params = new URLSearchParams(search);
  const source = safeLabel(params.get('utm_source'), 60).toLowerCase();
  const medium = safeLabel(params.get('utm_medium'), 60).toLowerCase();
  const campaign = safeLabel(params.get('utm_campaign'), 120);
  const content = safeLabel(params.get('utm_content'), 120);
  const hasUtm = Boolean(source || medium || campaign || content);
  let channel = 'direct';

  if (/^(instagram|ig)$/.test(source)) {
    channel = /paid|cpc|cpm|ads/.test(medium) ? 'instagram_ad' : 'organic_instagram';
  } else if (/^(facebook|fb)$/.test(source)) {
    channel = /paid|cpc|cpm|ads/.test(medium) ? 'facebook_ad' : 'organic_facebook';
  } else if (hasUtm) {
    channel = 'other_referral';
  } else if (referrer) {
    try {
      const referringUrl = new URL(referrer);
      if (currentOrigin && referringUrl.origin !== currentOrigin) {
        if (/(^|\.)instagram\.com$/.test(referringUrl.hostname)) channel = 'organic_instagram';
        else if (/(^|\.)(facebook|fb)\.com$/.test(referringUrl.hostname)) channel = 'organic_facebook';
        else channel = 'other_referral';
      }
    } catch { /* Ignore malformed referrers; do not retain the raw value. */ }
  }

  return {
    channel: ATTRIBUTION_CHANNELS.has(channel) ? channel : 'other_referral',
    ...(source ? { source } : {}),
    ...(medium ? { medium } : {}),
    ...(campaign ? { campaign } : {}),
    ...(content ? { content } : {}),
  };
}

function readSavedAttribution() {
  const current = browserWindow();
  if (!current || marketingConsent() !== 'granted') return null;
  try {
    const parsed = JSON.parse(current.sessionStorage.getItem(ATTRIBUTION_KEY) || 'null');
    if (!parsed || !ATTRIBUTION_CHANNELS.has(parsed.channel)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function captureCampaignAttribution() {
  const current = browserWindow();
  if (!current || marketingConsent() !== 'granted') return null;
  const existing = readSavedAttribution();
  const next = normalizeCampaignAttribution(current.location.search, current.document?.referrer || '', current.location.origin);
  const hasCampaignParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
    .some((key) => current.location.search.includes(`${key}=`));
  const attribution = hasCampaignParams || !existing ? next : existing;

  try { current.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution)); }
  catch { /* Attribution is optional when browser storage is unavailable. */ }

  // Keep only Meta's click ID in the visible URL. Campaign tags remain in first-party
  // session storage and are attached to a booking only after marketing consent.
  const clean = new URL(current.location.href);
  const allowed = new URLSearchParams();
  const fbclid = clean.searchParams.get('fbclid');
  if (fbclid && /^[\w.-]{1,300}$/.test(fbclid)) allowed.set('fbclid', fbclid);
  clean.search = allowed.toString();
  current.history.replaceState(current.history.state, '', `${clean.pathname}${clean.search}${clean.hash}`);
  return attribution;
}

export function getCampaignAttributionForBooking() {
  return readSavedAttribution();
}

function loadPixel() {
  const current = browserWindow();
  if (!current || !isMetaPixelConfigured() || marketingConsent() !== 'granted') return false;
  if (typeof current.fbq !== 'function') {
    const fbq = function (...args) {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
      else fbq.queue.push(args);
    };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    current.fbq = fbq;
    current._fbq = fbq;
    const script = current.document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    current.document.head.appendChild(script);
  }
  if (!pixelInitialized) {
    current.fbq('init', META_PIXEL_ID);
    current.fbq('consent', 'grant');
    pixelInitialized = true;
  }
  return true;
}

export function saveMarketingConsent(value) {
  const current = browserWindow();
  if (!current || !['granted', 'denied'].includes(value)) return;
  try { current.localStorage.setItem(CONSENT_KEY, value); } catch { /* No persistent consent means Pixel remains off after this page. */ }
  if (value === 'granted') {
    captureCampaignAttribution();
    loadPixel();
  } else {
    try { current.sessionStorage.removeItem(ATTRIBUTION_KEY); } catch { /* Ignore unavailable storage. */ }
    if (pixelInitialized && typeof current.fbq === 'function') current.fbq('consent', 'revoke');
  }
}

function track(eventName, parameters = {}, eventId = undefined) {
  const current = browserWindow();
  if (marketingConsent() !== 'granted' || !loadPixel()) return false;
  if (eventId) current.fbq('track', eventName, parameters, { eventID: eventId });
  else current.fbq('track', eventName, parameters);
  return true;
}

export function trackPageView() {
  return track('PageView');
}

export function trackCategoryView(categoryId) {
  if (!categoryId) return false;
  return track('ViewContent', { content_ids: [safeLabel(categoryId, 80)], content_type: 'product' });
}

export function trackAddToCart(service) {
  if (!service?.id || !Number.isFinite(service.priceRupees)) return false;
  return track('AddToCart', {
    content_ids: [safeLabel(service.id, 80)],
    content_type: 'product',
    value: service.priceRupees,
    currency: 'INR',
  });
}

export function trackInitiateCheckout(services) {
  const ids = (services || []).map((service) => safeLabel(service?.id, 80)).filter(Boolean);
  if (!ids.length) return false;
  return track('InitiateCheckout', { content_ids: ids, content_type: 'product' });
}

export function trackConfirmedAppointment(reference, advancePaise) {
  const current = browserWindow();
  if (!current || !reference || marketingConsent() !== 'granted' || !loadPixel()) return false;
  const bookingKey = safeLabel(reference, 80);
  const scheduleStorageKey = `dream-beauty-meta-schedule-${bookingKey}`;
  const purchaseStorageKey = `dream-beauty-meta-purchase-${bookingKey}`;
  const newEventId = () => typeof current.crypto?.randomUUID === 'function'
    ? current.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    if (!current.localStorage.getItem(scheduleStorageKey)) {
      const eventId = newEventId();
      current.localStorage.setItem(scheduleStorageKey, eventId);
      track('Schedule', {}, eventId);
    }
    if (Number.isInteger(advancePaise) && advancePaise > 0 && !current.localStorage.getItem(purchaseStorageKey)) {
      const eventId = newEventId();
      current.localStorage.setItem(purchaseStorageKey, eventId);
      track('Purchase', { value: advancePaise / 100, currency: 'INR' }, eventId);
    }
  } catch { /* Tracking remains optional if storage is blocked. */ }
  return true;
}
