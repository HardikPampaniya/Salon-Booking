export const siteRoutes = [
  { path: '/', type: 'home' },
  { path: '/our-story', type: 'story' },
  { path: '/services', type: 'services' },
  { path: '/services/womens-hair', type: 'category', category: "Women's hair" },
  { path: '/services/beauty', type: 'category', category: 'Beauty services' },
  { path: '/services/mens', type: 'category', category: "Men's services" },
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
  return services.filter((service) => service.category === category);
}
