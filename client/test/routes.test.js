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
    '/', '/our-story', '/services', '/services/women', '/services/men', '/services/beauty',
    '/services/womens-hair', '/services/mens', '/visit-us', '/book',
  ]);
  assert.equal(new Set(paths).size, paths.length);
});

test('normalizes trailing slashes without changing the root path', () => {
  assert.equal(normalizePath('/services/'), '/services');
  assert.equal(normalizePath('/services/womens-hair///'), '/services/womens-hair');
  assert.equal(normalizePath('/'), '/');
  assert.equal(normalizePath(''), '/');
});

test('resolves the new menu groups and preserves earlier category URLs', () => {
  assert.equal(resolveRoute('/services/women').category, 'women');
  assert.equal(resolveRoute('/services/men').category, 'men');
  assert.equal(resolveRoute('/services/beauty').category, 'beauty');
  assert.equal(resolveRoute('/services/womens-hair').category, 'women');
  assert.equal(resolveRoute('/services/mens').category, 'men');
  assert.equal(resolveRoute('/book').type, 'book');
});

test('returns a not-found route for paths outside the site map', () => {
  assert.deepEqual(resolveRoute('/not-a-page'), { path: '/not-a-page', type: 'not-found' });
});

test('filters service data using the configured category label', () => {
  const services = [
    { id: 'a', category: "Women's hair", groupId: 'women' },
    { id: 'b', category: 'Beauty services', groupId: 'beauty' },
    { id: 'c', category: "Women's hair", groupId: 'women' },
  ];
  assert.deepEqual(servicesForCategory(services, 'women').map(({ id }) => id), ['a', 'c']);
  assert.deepEqual(servicesForCategory(services, "Women's hair").map(({ id }) => id), ['a', 'c']);
  assert.deepEqual(servicesForCategory(services, 'men'), []);
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
