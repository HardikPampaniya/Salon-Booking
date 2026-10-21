# Approved salon images

Place only images the salon owns or has permission to publish in these folders:

- `services/womens-hair-services.jpg`, `services/beauty-facial.jpg`, and `services/mens-grooming.jpg` — latest supplied photos mapped to the women's hair, beauty, and men's service category visuals.
- `gallery/salon-interior.png`, `gallery/mirror-stations.png`, and `gallery/workstations.png` — supplied photos currently used in the home-page gallery.
- `brand/salon-logo.svg` — the text monogram remains in place until an approved standalone logo file is supplied.

Category image mappings and alt text are maintained in `client/src/service-images.js`. The mapped category, home-hero, and gallery assets are present in this folder; CSS artwork is used only if an image is unavailable or fails to load. Earlier category photos remain in the folder but are not currently mapped. Use descriptive alt text, crop originals to a consistent landscape ratio for category/gallery visuals, and compress large photos to WebP or AVIF where the hosting targets support it. Do not copy images from search results or third-party salon listings without written usage permission. Handwritten menu-page photos belong in the ignored `docs/source-material/` folder, not here.
