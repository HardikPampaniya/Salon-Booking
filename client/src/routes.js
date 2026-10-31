export const siteRoutes = [
  { path: '/', type: 'home' },
  { path: '/our-story', type: 'story' },
  { path: '/services', type: 'services' },
  { path: '/services/women', type: 'category', category: 'women' },
  { path: '/services/men', type: 'category', category: 'men' },
  { path: '/services/beauty', type: 'category', category: 'beauty' },
  // Preserve the earlier public URLs so bookmarks and search results keep working.
  { path: '/services/womens-hair', type: 'category', category: 'women', alias: true },
  { path: '/services/mens', type: 'category', category: 'men', alias: true },
  { path: '/visit-us', type: 'visit' },
  { path: '/book', type: 'book' },
];

export function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function resolveRoute(pathname) {
  const path = normalizePath(pathname);
  return siteRoutes.find((route) => route.path === path) ?? { path, type: 'not-found' };
}

export function servicesForCategory(services, category) {
  return services.filter((service) => service.offerExpired !== true && (service.groupId === category || service.category === category));
}
