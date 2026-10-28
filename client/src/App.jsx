import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import BookingWidget from './BookingWidget.jsx';
import { apiUrl } from './api.js';
import { brandImage, categoryImages, galleryImages, homeHeroImage } from './service-images.js';
import { resolveRoute, servicesForCategory } from './routes.js';

const NavigationContext = createContext(() => {});
const fallbackSalon = {
  name: 'The Dream Beauty Unisex Studio',
  tagline: 'Hair, beauty, and grooming in Karanjade',
  neighborhood: 'Karanjade · Navi Mumbai',
  address: 'Shop No. 8, Sahara Sankalp Residency, Plot No. 16, Sector 2A, Karanjade, Navi Mumbai, Maharashtra 410206',
  phone: '+91 77383 85236',
  whatsappNumber: '+91 77383 85236',
  mapUrl: 'https://maps.app.goo.gl/j5NvUKA1eyYby9oD7?g_st=aw',
  timezone: 'Asia/Kolkata',
  hours: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    .map((day) => ({ day, open: '9:00 AM', close: '9:00 PM' })),
};

const fallbackCategoryPages = [
  { id: 'women', path: '/services/women', name: 'Women', imageCategory: "Women's hair", description: 'Haircuts, styling, colour, and treatments listed for women in the salon menu.' },
  { id: 'men', path: '/services/men', name: 'Men', imageCategory: "Men's services", description: 'Hair, beard, skin, and grooming services listed for men.' },
  { id: 'beauty', path: '/services/beauty', name: 'Beauty services', imageCategory: 'Beauty services', description: 'Facials, waxing, threading, nails, and other beauty services listed in the supplied menu.' },
];
const selectedServiceIds = [
  'women-hair-wash-blowdry', 'women-haircut-wash', 'beauty-hydra-facial',
  'beauty-mani-pedi', 'men-haircut-beard-wash', 'men-aroma-facial-dtan',
];
const guestNotes = [
  { name: 'Manasvi Raut', quote: 'I had an amazing experience at THE DREAM BEAUTY UNISEX STUDIO My stylist, HASIM was incredibly skilled and attentive. He took the...' },
  { name: 'Kesari Naik', quote: 'Best service the dream beauty studio', detail: 'Services: manicure, pedicure, shaving, hairstyling, eyelashes, skin care, and facials' },
  { name: 'Aarush Naik', quote: 'Excellent work and best service' },
  { name: 'Anjali Kamble', quote: 'Excellent', detail: 'Services: hair threading, body waxing, hairstyling, skin care, and facials' },
  { name: 'Sujata Waghmare', quote: 'Best service in the world' },
  { name: 'Sneha Gaikwad', quote: 'Hair type: Nice', detail: 'Service: shampoo and conditioning' },
  { name: 'JANVI Gaikwad', quote: 'HII IM JUST VISIT SALON AND MY HAIR IS CURLY I M GOING TO SALON THEY SUGGEST YOU GO to prOTIN TREATMENT STRATHNING AND I M SAY JUST DO CUT THAN SAY CURLY HAIR NO CUT BUT CHANGING POIN THE DREAM BEAUTY UNISEX STUDIO (HASIM) HAIR ARTIST GIVE MY LIFE BEST HAIRCUT AND MY CURLS ENHANCED SO YOU ARE LOOKING FOR CURLY HAIRSTYLES, HAURCUT, SURE VISIT THE DREAM BEAUTY STUDIO AND MEET BEST ARTIST HASIM AND ONCE AGAIN THANK TOU TO HAIRRESSER ARE SO KIND AND CARYING OVEROLL BEST EXPERIENCE' },
  { name: 'Narendra Kamliya', quote: 'I M RECENTLY VISIT THE DREAM BEAUTY UNISEX STUDIO I M RECANTLY DONE MY BEARD AND MY EXPERIENCE TOP NOCH THANK YOU SO MUCH THE DREAM BEAUTY UNISEX STUDIO STAFF' },
  { name: 'MAHENDRA GAWARE', quote: 'Newly opnes, located at Karanjade sector 2A, neelkanth suryodaya residency', detail: 'Services: shaving' },
  { name: 'Naresh Bhagat', quote: 'Services: Skin care' },
  { name: 'Sharang', quote: 'Services: Shampoo & conditioning and Hair threading' },
];
const routeTitles = {
  home: 'Home', story: 'Our story', services: 'Services', category: 'Services',
  visit: 'Visit us', book: 'Online booking', 'not-found': 'Page not found',
};

function useSalonData() {
  const [salon, setSalon] = useState(fallbackSalon);
  const [services, setServices] = useState([]);
  const [categoryPages, setCategoryPages] = useState(fallbackCategoryPages);
  const [apiState, setApiState] = useState('loading');

  useEffect(() => {
    let active = true;
    Promise.all([fetch(apiUrl('/api/config')), fetch(apiUrl('/api/services'))])
      .then(async ([configResponse, servicesResponse]) => {
        if (!configResponse.ok || !servicesResponse.ok) throw new Error('Salon information is unavailable.');
        return Promise.all([configResponse.json(), servicesResponse.json()]);
      })
      .then(([config, serviceList]) => {
        if (!active) return;
        setSalon(config.salon ?? fallbackSalon);
        setServices(serviceList.services ?? []);
        setCategoryPages(Array.isArray(serviceList.groups) && serviceList.groups.length
          ? serviceList.groups.map((group) => ({ ...group, name: group.label }))
          : fallbackCategoryPages);
        setApiState('ready');
      })
      .catch(() => active && setApiState('fallback'));
    return () => { active = false; };
  }, []);

  return { salon, services, categoryPages, apiState };
}

function RouteLink({ to, className, children, onClick, ...props }) {
  const navigate = useContext(NavigationContext);
  return <a href={to} className={className} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (props.target || to.startsWith('#')) return;
    event.preventDefault();
    navigate(to);
  }} {...props}>{children}</a>;
}

function Brand({ salon, footer = false }) {
  return <RouteLink className={`brand${footer ? ' footer-brand' : ''}`} to="/" aria-label={`${salon.name} home`}>
    {brandImage.src ? <img className="brand-logo" src={brandImage.src} alt={brandImage.alt} /> : <span className="brand-mark" aria-hidden="true">D</span>}
    <span className="brand-name">{salon.name}<small>HAIR · BEAUTY · GROOMING</small></span>
  </RouteLink>;
}

function Arrow() { return <span className="arrow-icon" aria-hidden="true">↗</span>; }

function SiteHeader({ salon, cartCount }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    ['Our story', '/our-story'], ['Services', '/services'], ['Visit us', '/visit-us'],
  ];
  return <>
    <div className="announcement"><span>Hair, beauty, and grooming in Karanjade.</span><RouteLink to="/services">Explore the menu <Arrow /></RouteLink></div>
    <header className="site-header">
      <Brand salon={salon} />
      <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="primary-nav" onClick={() => setMenuOpen((open) => !open)}>
        <span>{menuOpen ? 'Close' : 'Menu'}</span><span className="menu-lines" aria-hidden="true">☰</span>
      </button>
      <nav id="primary-nav" className={menuOpen ? 'primary-nav is-open' : 'primary-nav'} aria-label="Main navigation">
        {nav.map(([label, path]) => <RouteLink key={path} to={path} onClick={() => setMenuOpen(false)}>{label}</RouteLink>)}
        <div className="header-booking-actions">
          <RouteLink className="nav-cta" to="/book" onClick={() => setMenuOpen(false)}>Your cart <span className="cart-count" aria-label={`${cartCount} services in cart`}>{cartCount}</span><Arrow /></RouteLink>
        </div>
      </nav>
    </header>
  </>;
}

function SiteFooter({ salon }) {
  return <footer className="site-footer">
    <Brand salon={salon} footer />
    <div className="footer-links"><RouteLink to="/services">Services</RouteLink><RouteLink to="/visit-us">Visit us</RouteLink><RouteLink to="/book">Booking status</RouteLink></div>
    <p>© {new Date().getFullYear()} {salon.name}</p>
  </footer>;
}

function PageFrame({ salon, cartCount, children }) {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <SiteHeader salon={salon} cartCount={cartCount} />
    {children}
    <SiteFooter salon={salon} />
  </>;
}

function CategoryVisual({ category, className = '', priority = false, image }) {
  const visual = image ?? categoryImages[category] ?? {
    src: null, alt: `${category} at The Dream Beauty Unisex Studio`, label: category, tone: 'rose',
  };
  const [failed, setFailed] = useState(false);
  if (visual.src && !failed) return <img className={`category-visual-image ${className}`} src={visual.src} alt={visual.alt} loading={priority ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />;
  return <div className={`category-visual category-visual-${visual.tone} ${className}`} role="img" aria-label={`${visual.label} visual placeholder; salon-approved photography will be added`}>
    <span className="visual-orbit visual-orbit-one" aria-hidden="true" /><span className="visual-orbit visual-orbit-two" aria-hidden="true" />
    <span className="visual-caption"><span>THE DREAM BEAUTY STUDIO</span><strong>{visual.label}</strong><small>Salon image coming soon</small></span>
  </div>;
}

function GalleryPlaceholder({ image, index }) {
  const [failed, setFailed] = useState(false);
  if (image.src && !failed) return <img className="gallery-asset" src={image.src} alt={image.alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
  return <div className={`gallery-art-placeholder gallery-art-${index + 1}`} role="img" aria-label={`${image.label}: approved salon photo to be added`}>
    <span aria-hidden="true">✳</span><small>{image.label}</small>
  </div>;
}

function PageHeading({ eyebrow, title, accent, copy }) {
  return <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}<br /><em>{accent}</em></h1>{copy && <p className="page-heading-copy">{copy}</p>}</div>;
}

function getServiceDetails(service) {
  const description = service.description?.trim();
  if (!description || description === 'Price supplied by the salon.') return '';
  return description;
}

function ServiceCard({ service, index, compact = false, cartIds, addToCart, removeFromCart }) {
  const inCart = cartIds.includes(service.id);
  const canAddToCart = service.menuSelectable === true && service.needsConfirmation !== true
    && Number.isFinite(service.priceRupees) && service.priceRupees > 0;
  const price = service.priceDisplay || (Number.isFinite(service.priceRupees)
    ? `₹${new Intl.NumberFormat('en-IN').format(service.priceRupees)}` : 'Price to be confirmed');
  return <article className={`service-card${compact ? ' service-card-compact' : ''}`}>
    <div className="service-card-top"><span>{String(index + 1).padStart(2, '0')}</span><span className="service-sparkle" aria-hidden="true">✳</span></div>
    <h3>{service.name}</h3>
    {service.needsConfirmation && <p className="service-confirmation">Some wording, inclusions, or offer details need confirmation.</p>}
    {getServiceDetails(service) && <p className="service-details">{getServiceDetails(service)}</p>}
    <div className="service-meta"><span>{Number.isInteger(service.durationMinutes) && service.durationMinutes > 0 ? `${service.durationMinutes} minute visit` : 'Duration to be confirmed'}</span><strong>{price}</strong></div>
    {canAddToCart
      ? <button className={`service-cart-button${inCart ? ' is-added' : ''}`} type="button" disabled={!inCart && cartIds.length >= 20} onClick={() => inCart ? removeFromCart(service.id) : addToCart(service.id)} aria-pressed={inCart}>{inCart ? 'Remove from cart' : cartIds.length >= 20 ? 'Cart limit reached' : 'Add to cart'} <span aria-hidden="true">{inCart ? '−' : '+'}</span></button>
      : <p className="service-cart-unavailable">Available to add after price and menu details are confirmed</p>}
  </article>;
}

function CategoryCards({ services, categoryPages }) {
  return <div className="category-grid">
    {categoryPages.map((category) => {
      const count = servicesForCategory(services, category.id).length;
      return <article className="category-card" key={category.path}>
        <RouteLink to={category.path} className="category-card-link" aria-label={`Browse ${category.name}`}>
          <CategoryVisual category={category.imageCategory} />
          <div className="category-card-copy"><p className="eyebrow">{count ? `${count} menu items` : 'Salon menu'}</p><h2>{category.name}</h2><p>{category.description}</p><span className="text-link">Browse services <Arrow /></span></div>
        </RouteLink>
      </article>;
    })}
  </div>;
}

function HomePage({ salon, services, categoryPages, apiState, cartIds, addToCart, removeFromCart }) {
  const selected = selectedServiceIds.map((id) => services.find((service) => service.id === id)).filter(Boolean);
  return <main id="main">
    <section className="hero hero-short" aria-labelledby="hero-title">
      <div className="hero-content"><p className="eyebrow"><span className="eyebrow-rule" />{salon.neighborhood}</p>
        <h1 id="hero-title">Beauty, at<br />your own <em>pace.</em></h1>
        <p className="hero-copy">Explore hair, beauty, and grooming services at The Dream Beauty Unisex Studio in Karanjade.</p>
        <div className="hero-actions"><RouteLink className="button button-dark" to="/book">Check online booking <Arrow /></RouteLink><RouteLink className="text-link" to="/services">Explore services <span aria-hidden="true">↓</span></RouteLink></div>
        <p className="hero-footnote"><span aria-hidden="true">✳</span> The Dream Beauty Unisex Studio · Karanjade</p>
      </div>
      <div className="hero-visual"><CategoryVisual category="Beauty services" image={homeHeroImage} priority /><div className="hero-image-note"><span className="note-sparkle">✳</span><span>A moment<br />to yourself.</span></div><span className="hero-image-index">KARANJADE · NAVI MUMBAI</span></div>
    </section>

    <section className="intro section-shell">
      <p className="eyebrow">A salon in Karanjade</p>
      <div className="intro-layout"><h2>Hair, beauty,<br /><em>and grooming.</em></h2><div className="intro-copy"><p>{salon.name} offers salon services in Karanjade, Navi Mumbai. Browse the menu by category and contact the studio directly with questions about a treatment or package.</p><RouteLink className="text-link" to="/our-story">About the studio <Arrow /></RouteLink></div></div>
      <div className="intro-stats"><span>01 <small>Women’s hair</small></span><span>02 <small>Beauty services</small></span><span>03 <small>Men’s services</small></span></div>
    </section>

    <section className="home-categories section-shell"><div className="section-heading"><div><p className="eyebrow">Explore the menu</p><h2>Find your<br /><em>service.</em></h2></div><p>Choose a category to view the full salon menu, prices, and details that still need confirmation.</p></div><CategoryCards services={services} categoryPages={categoryPages} /></section>

    <section className="services-section section-shell home-picks">
      <div className="section-heading"><div><p className="eyebrow">A few from the menu</p><h2>Start with<br /><em>something lovely.</em></h2></div><p>A small selection across hair, beauty, and grooming. Visit the category pages for all menu items.</p></div>
      {apiState === 'loading' && <p className="api-note" role="status">Preparing the service menu…</p>}
      {apiState === 'fallback' && <p className="api-note" role="status">The salon menu is temporarily unavailable. Please contact the studio.</p>}
      {apiState === 'ready' && <div className="services-grid">{selected.map((service, index) => <ServiceCard service={service} index={index} compact cartIds={cartIds} addToCart={addToCart} removeFromCart={removeFromCart} key={service.id} />)}</div>}
      <RouteLink className="text-link home-menu-link" to="/services">View all service categories <Arrow /></RouteLink>
    </section>

    <section className="quote-band"><span className="quote-flower" aria-hidden="true">✳</span><p>A little time for<br className="desktop-break" /> <em>yourself.</em></p><span className="quote-caption">HAIR · BEAUTY · GROOMING</span></section>

    <section className="gallery-section section-shell"><div className="section-heading gallery-heading"><div><p className="eyebrow">The studio</p><h2>A glimpse<br /><em>inside.</em></h2></div><p>Photos from inside The Dream Beauty Unisex Studio in Karanjade.</p></div>
      <div className="gallery-grid">{galleryImages.map((image, index) => <figure className={`gallery-photo gallery-photo-${index + 1}`} key={image.expectedFile}><GalleryPlaceholder image={image} index={index} /><figcaption>{image.label.toUpperCase()}</figcaption></figure>)}</div>
    </section>

    <section className="reviews-section section-shell"><div className="section-heading"><div><p className="eyebrow">Guest stories</p><h2>Kind words<br /><em>from guests.</em></h2></div><p>Feedback shared with the studio.</p></div>
      <FeedbackCarousel />
    </section>

    <VisitSummary salon={salon} />
  </main>;
}

function FeedbackCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setTabHidden(document.hidden);
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (hoverPaused || focusPaused || tabHidden || prefersReducedMotion) return undefined;
    const timer = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % guestNotes.length);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [activeIndex, hoverPaused, focusPaused, tabHidden, prefersReducedMotion]);

  return <div
    className="feedback-carousel"
    role="region"
    aria-roledescription="carousel"
    aria-label="Customer feedback"
    onMouseEnter={() => setHoverPaused(true)}
    onMouseLeave={() => setHoverPaused(false)}
    onFocusCapture={() => setFocusPaused(true)}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocusPaused(false);
    }}
  >
    <div className="review-window">
      <div id="customer-feedback-track" className="review-track" style={{ transform: `translateX(-${(activeIndex * 100) / guestNotes.length}%)`, width: `${guestNotes.length * 100}%` }} aria-live="off">
        {guestNotes.map(({ name, quote, detail }, index) => <figure className="review-card" key={name} style={{ flexBasis: `${100 / guestNotes.length}%` }} aria-hidden={index !== activeIndex}>
          <span aria-hidden="true">&ldquo;</span>
          <blockquote>&ldquo;{quote}&rdquo;</blockquote>
          {detail && <p className="review-detail">{detail}</p>}
          <figcaption><strong>{name}</strong><small>Customer feedback shared by the studio</small></figcaption>
        </figure>)}
      </div>
    </div>
    <div className="review-dots" role="group" aria-label="Choose customer feedback">
      {guestNotes.map(({ name }, index) => <button
        className={`review-dot${activeIndex === index ? ' is-active' : ''}`}
        type="button"
        key={name}
        aria-label={`Show feedback from ${name}`}
        aria-controls="customer-feedback-track"
        aria-current={activeIndex === index ? 'true' : undefined}
        onClick={() => setActiveIndex(index)}
      />)}
    </div>
    <p className="carousel-hint">Feedback advances every 4 seconds. Select a dot to jump to a review.</p>
    {prefersReducedMotion && <p className="visually-hidden">Automatic feedback rotation is off because reduced motion is enabled.</p>}
  </div>;
}

function ServicesPage({ services, categoryPages }) {
  return <main id="main" className="inner-page"><section className="page-hero section-shell"><PageHeading eyebrow="The menu" title="Services for" accent="your visit." copy="Browse the women’s and men’s menu, plus the beauty services listed by the studio. Choose a category to search, filter, and view prices." /></section>
    <section className="section-shell page-section"><CategoryCards services={services} categoryPages={categoryPages} /></section>
    <section className="menu-note section-shell" aria-label="Menu guidance">
      <div className="menu-note-copy"><p className="eyebrow">Need help choosing?</p><p>Choose a category above to browse its services and prices. The supplied menu does not say whether the general beauty list is for women, men, or everyone, so it remains in a separate Beauty services section until the studio confirms its audience. Online booking remains unavailable until service durations, staff schedules, and payment setup are approved.</p></div>
      <span className="menu-note-categories">Women <i aria-hidden="true">·</i> Men <i aria-hidden="true">·</i> Beauty services</span>
    </section>
  </main>;
}

function ServiceCategoryPage({ category, services, categoryPages, apiState, cartIds, addToCart, removeFromCart }) {
  const [query, setQuery] = useState('');
  const [subcategory, setSubcategory] = useState('All services');
  const groupInfo = categoryPages.find((item) => item.id === category);
  const categoryInfo = categoryPages.find((item) => item.name === category);
  const groupId = groupInfo?.id || categoryInfo?.id || category;
  const items = servicesForCategory(services, groupId);
  const subcategories = [...new Set(items.map((service) => service.subcategory).filter(Boolean))];
  const filtered = items.filter((service) => `${service.name} ${service.description} ${service.subcategory || ''}`.toLowerCase().includes(query.toLowerCase().trim())
    && (subcategory === 'All services' || service.subcategory === subcategory));
  const title = groupInfo?.name || categoryInfo?.name || category;
  const imageCategory = groupInfo?.imageCategory || categoryInfo?.imageCategory || category;
  return <main id="main" className="inner-page">
    <section className="category-hero section-shell"><div><p className="eyebrow">Service category</p><h1>{title}</h1><p className="page-heading-copy">{groupInfo?.description || categoryInfo?.description}</p><RouteLink className="button button-dark" to="/book">Review your cart <Arrow /></RouteLink></div><CategoryVisual category={imageCategory} priority /></section>
    <section className="service-list-section section-shell">
      <div className="service-list-heading"><div><p className="eyebrow">The menu</p><h2>{title}<br /><em>services.</em></h2><p>{items.length} menu item{items.length === 1 ? '' : 's'}</p></div>
        <label className="service-search">Search this menu<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services" /></label>
      </div>
      {subcategories.length > 1 && <nav className="service-filter-list" aria-label={`Filter ${title} services`}>
        {['All services', ...subcategories].map((item) => <button key={item} type="button" className={subcategory === item ? 'service-filter is-active' : 'service-filter'} aria-pressed={subcategory === item} onClick={() => setSubcategory(item)}>{item}</button>)}
      </nav>}
      {apiState === 'loading' && <p className="api-note" role="status">Preparing the service menu…</p>}
      {apiState === 'fallback' && <p className="api-note" role="alert">The service menu is temporarily unavailable. Please contact the studio.</p>}
      {apiState === 'ready' && filtered.length > 0 && <div className="service-list-grid">{filtered.map((service, index) => <ServiceCard service={service} index={index} cartIds={cartIds} addToCart={addToCart} removeFromCart={removeFromCart} key={service.id} />)}</div>}
      {apiState === 'ready' && filtered.length === 0 && <p className="api-note">{items.length ? 'No services match this search.' : 'No services are currently listed in this category.'}</p>}
      <p className="placeholder-note">Prices are shown as supplied by the studio. Service durations are still being confirmed, so services cannot be booked or paid for online yet. Offer terms and package inclusions also remain under review.</p>
      {groupId === 'beauty' && <p className="placeholder-note">The supplied menu names this section “Beauty services” without stating its customer audience. The studio can confirm whether these services are for women, men, or all customers.</p>}
      <RouteLink className="button button-dark" to="/book">Open your cart <Arrow /></RouteLink>
    </section>
  </main>;
}
function StoryPage({ salon }) {
  return <main id="main" className="inner-page"><section className="story-hero section-shell"><PageHeading eyebrow="The studio" title="The Dream" accent="Beauty Studio." copy={`${salon.name} is a unisex salon in ${salon.neighborhood}. The studio’s menu includes hair, beauty, and grooming services.`} /><CategoryVisual category="Women's hair" priority /></section>
    <section className="story-copy section-shell"><p className="eyebrow">A note about the studio</p><div><h2>Here in<br /><em>Karanjade.</em></h2><div><p>The salon is located near College Phata on Uran Road, in Karanjade, Navi Mumbai. The service pages share the menu details provided by the studio.</p><p>Further details about the team and salon history can be added when the studio supplies them.</p><RouteLink className="text-link" to="/visit-us">Find the studio <Arrow /></RouteLink></div></div></section>
    <section className="quote-band"><span className="quote-flower" aria-hidden="true">✳</span><p>Hair · beauty<br /> <em>· grooming.</em></p><span className="quote-caption">THE DREAM BEAUTY UNISEX STUDIO</span></section>
  </main>;
}

function SalonContactLinks({ salon, whatsappLink }) {
  return <div className="contact-actions">{salon.phone && <a className="button button-dark" href={`tel:${salon.phone}`}>Call the studio <Arrow /></a>}{whatsappLink && <a className="button button-outline" href={whatsappLink} target="_blank" rel="noreferrer">WhatsApp <Arrow /></a>}</div>;
}

function VisitSummary({ salon, compact = false }) {
  const whatsapp = salon.whatsappNumber ? `https://wa.me/${salon.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, I would like to know more about ${salon.name}.`)}` : null;
  return <section className={`visit-section section-shell${compact ? ' visit-summary' : ''}`}>
    <div className="visit-main"><p className="eyebrow">Come by</p><h2>Find us in<br /><em>Karanjade.</em></h2><p className="visit-address">{salon.address}<br />{salon.neighborhood}</p><SalonContactLinks salon={salon} whatsappLink={whatsapp} /></div>
    <div className="visit-details"><div><h3>Opening hours</h3>{salon.hours.map((row) => <p className="hours-row" key={row.day}><span>{row.day}</span><span>{row.open}{row.close ? ` – ${row.close}` : ''}</span></p>)}</div><a className="map-placeholder" href={salon.mapUrl} target="_blank" rel="noreferrer"><span className="map-pin" aria-hidden="true">⌖</span><span>Directions in Google Maps<br /><small>{salon.address}</small></span><Arrow /></a></div>
  </section>;
}

function VisitPage({ salon }) {
  return <main id="main" className="inner-page"><section className="page-hero section-shell"><PageHeading eyebrow="Come by" title="Visit the" accent="studio." copy="The Dream Beauty Unisex Studio is in Karanjade, Navi Mumbai. Call or message the studio with questions before your visit." /></section><VisitSummary salon={salon} /><section className="policy-summary section-shell" id="policies"><p className="eyebrow">Booking and cancellation</p><h2>Plan your<br /><em>salon visit.</em></h2><p>Choose an arrival time during salon hours. The selected time is your arrival time; the service begins when a team member is available. Online cancellation closes one hour before your selected arrival time. The fixed ₹100 online advance is credited against the bill; if a service costs less than ₹100, the studio returns the difference in cash after service. An eligible cancellation requests a refund of the full captured advance to the original payment method.</p><RouteLink className="text-link" to="/book">Book a salon visit <Arrow /></RouteLink></section></main>;
}

function BookPage({ salon, services, cartIds, onRemoveFromCart, onBrowseServices }) {
  return <main id="main" className="inner-page booking-page">
    <section className="page-hero section-shell"><PageHeading eyebrow="Appointments" title="Make time" accent="for yourself." copy="Build your service list, choose a visit date and arrival time, then review the single ₹100 advance before checkout." /></section>
    <section className="booking-gate section-shell">
      <h2>Your service cart<br /><em>and visit time.</em></h2>
      <BookingWidget salon={salon} services={services} cartIds={cartIds} onRemoveFromCart={onRemoveFromCart} onBrowseServices={onBrowseServices} />
    </section>
  </main>;
}

function NotFoundPage({ salon }) {
  return <main id="main" className="inner-page not-found-page"><section className="section-shell"><p className="eyebrow">404 · Not found</p><h1>We can’t find<br /><em>that page.</em></h1><p>Try the service menu or visit information instead.</p><div className="hero-actions"><RouteLink className="button button-dark" to="/">Go home <Arrow /></RouteLink><RouteLink className="text-link" to="/services">Browse services <Arrow /></RouteLink></div></section></main>;
}

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const { salon, services, categoryPages, apiState } = useSalonData();
  const [cartIds, setCartIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('salon_service_cart') || '[]');
      return Array.isArray(saved) ? [...new Set(saved.filter((id) => typeof id === 'string'))].slice(0, 20) : [];
    } catch { return []; }
  });
  const route = resolveRoute(pathname);

  useEffect(() => {
    try { localStorage.setItem('salon_service_cart', JSON.stringify(cartIds)); } catch { /* Cart remains available until this page closes. */ }
  }, [cartIds]);

  useEffect(() => {
    if (apiState !== 'ready') return;
    const knownIds = new Set(services.map((service) => service.id));
    setCartIds((current) => current.filter((id) => knownIds.has(id)));
  }, [apiState, services]);

  const addToCart = useCallback((id) => {
    setCartIds((current) => current.includes(id) || current.length >= 20 ? current : [...current, id]);
  }, []);
  const removeFromCart = useCallback((id) => {
    setCartIds((current) => current.filter((item) => item !== id));
  }, []);

  const navigate = useCallback((to) => {
    const next = new URL(to, window.location.href);
    if (next.origin !== window.location.origin) return;
    window.history.pushState({}, '', `${next.pathname}${next.search}${next.hash}`);
    setPathname(next.pathname);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const category = route.type === 'category' ? categoryPages.find((item) => item.id === route.category) : null;
    const detail = category ? `${category.name} services` : routeTitles[route.type] ?? 'Home';
    document.title = `${detail} | ${salon.name}`;
    const descriptions = {
      home: `${salon.name} in Karanjade, Navi Mumbai. Browse salon services, prices, directions, and contact details.`,
      services: `Browse the women’s, men’s, and beauty service menus at ${salon.name} in Karanjade.`,
      story: `${salon.name} is a hair, beauty, and grooming studio in Karanjade, Navi Mumbai.`,
      visit: `Find ${salon.name} in Karanjade, Navi Mumbai, and view its hours and contact details.`,
      book: `Review your service cart and check online booking readiness for ${salon.name}.`,
    };
    const metaDescription = document.querySelector('meta[name="description"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'description' }));
    metaDescription.content = category
      ? `Browse ${category.name.toLowerCase()} services and prices at ${salon.name} in Karanjade, Navi Mumbai.`
      : descriptions[route.type] || `Services and visit information for ${salon.name} in Karanjade, Navi Mumbai.`;
    const canonical = document.querySelector('link[rel="canonical"]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'canonical' }));
    canonical.href = new URL(category?.path || route.path, window.location.origin).href;
  }, [route.type, route.category, salon.name, categoryPages]);

  let page;
  switch (route.type) {
    case 'home': page = <HomePage salon={salon} services={services} categoryPages={categoryPages} apiState={apiState} cartIds={cartIds} addToCart={addToCart} removeFromCart={removeFromCart} />; break;
    case 'story': page = <StoryPage salon={salon} />; break;
    case 'services': page = <ServicesPage services={services} categoryPages={categoryPages} />; break;
    case 'category': page = <ServiceCategoryPage category={route.category} services={services} categoryPages={categoryPages} apiState={apiState} cartIds={cartIds} addToCart={addToCart} removeFromCart={removeFromCart} />; break;
    case 'visit': page = <VisitPage salon={salon} />; break;
    case 'book': page = <BookPage salon={salon} services={services} cartIds={cartIds} onRemoveFromCart={removeFromCart} onBrowseServices={() => navigate('/services')} />; break;
    default: page = <NotFoundPage salon={salon} />;
  }

  return <NavigationContext.Provider value={navigate}><PageFrame salon={salon} cartCount={cartIds.length}>{page}</PageFrame></NavigationContext.Provider>;
}
