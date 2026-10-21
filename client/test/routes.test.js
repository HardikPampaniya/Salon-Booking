import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brandImage, categoryImages, galleryImages } from '../src/service-images.js';
import { normalizePath, resolveRoute, servicesForCategory, siteRoutes } from '../src/routes.js';

test('registers each requested page with unique paths', () => {
  const paths = siteRoutes.map((route) => route.path);
  assert.deepEqual(paths, [
    '/', '/our-story', '/services', '/services/womens-hair', '/services/beauty',
    '/services/mens', '/visit-us', '/book',
  ]);
  assert.equal(new Set(paths).size, paths.length);
});

test('normalizes trailing slashes without changing the root path', () => {
  assert.equal(normalizePath('/services/'), '/services');
  assert.equal(normalizePath('/services/womens-hair///'), '/services/womens-hair');
  assert.equal(normalizePath('/'), '/');
  assert.equal(normalizePath(''), '/');
});

test('resolves the three menu categories and booking page', () => {
  assert.deepEqual(resolveRoute('/services/womens-hair').category, "Women's hair");
  assert.deepEqual(resolveRoute('/services/beauty').category, 'Beauty services');
  assert.deepEqual(resolveRoute('/services/mens').category, "Men's services");
  assert.equal(resolveRoute('/book').type, 'book');
});

test('returns a not-found route for paths outside the site map', () => {
  assert.deepEqual(resolveRoute('/not-a-page'), { path: '/not-a-page', type: 'not-found' });
});

test('filters service data using the configured category label', () => {
  const services = [
    { id: 'a', category: "Women's hair" },
    { id: 'b', category: 'Beauty services' },
    { id: 'c', category: "Women's hair" },
  ];
  assert.deepEqual(servicesForCategory(services, "Women's hair").map(({ id }) => id), ['a', 'c']);
  assert.deepEqual(servicesForCategory(services, 'Men\'s services'), []);
});

test('image mappings use descriptive alt text and never reference a missing local file', () => {
  const mappings = [brandImage, ...Object.values(categoryImages), ...galleryImages];
  const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
  for (const image of mappings) {
    assert.ok(image.alt?.trim(), 'image mapping has descriptive alt text');
    if (image.src === null) continue;
    assert.match(image.src, /^\/images\/(brand|services|gallery)\/[^/]+$/);
    assert.ok(existsSync(resolvePath(publicRoot, image.src.slice(1))), `${image.src} exists in client/public`);
  }
});
