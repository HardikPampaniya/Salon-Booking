// Add owner-approved images to public/images/services, then set each `src` to
// its local /images/... path. A null src renders the built-in fallback artwork.
export const brandImage = {
  src: null,
  expectedFile: 'salon-logo.svg',
  alt: 'The Dream Beauty Unisex Studio logo',
};

export const categoryImages = {
  "Women's hair": {
    src: '/images/services/womens-hair-services.jpg',
    expectedFile: 'womens-hair-services.jpg',
    alt: 'Hair styling, skincare, and manicure services',
    label: "Women's hair",
    tone: 'rose',
  },
  'Beauty services': {
    src: '/images/services/beauty-facial.jpg',
    expectedFile: 'beauty-facial.jpg',
    alt: 'A facial skincare treatment',
    label: 'Beauty services',
    tone: 'sand',
  },
  "Men's services": {
    src: '/images/services/mens-grooming.jpg',
    expectedFile: 'mens-grooming.jpg',
    alt: "A barber trimming a guest's beard",
    label: "Men's services",
    tone: 'olive',
  },
};

export const homeHeroImage = {
  src: '/images/services/beauty-studio-mirrors.png',
  expectedFile: 'beauty-studio-mirrors.png',
  alt: 'Salon mirrors and styling stations inside the studio',
  label: 'Inside the studio',
  tone: 'sand',
};

export const galleryImages = [
  { src: '/images/gallery/salon-interior.png', expectedFile: 'salon-interior.png', alt: 'Styling chairs and white-and-gold decor inside the studio', label: 'Inside the studio' },
  { src: '/images/gallery/mirror-stations.png', expectedFile: 'mirror-stations.png', alt: 'Salon chairs and illuminated mirror stations', label: 'Mirror stations' },
  { src: '/images/gallery/workstations.png', expectedFile: 'workstations.png', alt: 'A view along the studio workstations', label: 'Studio workstations' },
];
