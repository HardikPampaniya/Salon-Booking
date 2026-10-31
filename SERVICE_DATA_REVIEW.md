# Service menu review and missing-price report

> Generated from the canonical catalog in server/src/config/salon.js. The code is the source of truth; this file lists current values and review work.

## Summary

- Catalog size: **207 services**: Women 34, Men 30, Beauty services 143.
- Configured numeric prices above zero: **203**; no payable price: **4**; zero/negative numeric prices: **0**.
- Owner-confirmation flags: **30**. Menu-selectable: **177** through 8 November 2026 (171 regular services plus six Diwali offers). Online-bookable: **0**.
- Approved durations: **0 of 207**.

Readable salon prices are preserved. The newest handwritten image was supplied on 2026-10-31 and overrides the older values for the facial, cleanup, and waxing entries it covers. Its local copy is in the ignored `docs/source-material/` folder. No duration or percentage-off payable price has been invented. Beauty stays a separate menu group and is not labelled Unisex because the intended audience has not been confirmed.

The Diwali flyer `WhatsApp Image 2026-10-31 at 3.54.52 PM.jpeg` supplies six fixed-price all-in beauty packages. They are marked as Diwali offers on the site and cannot be booked for arrival dates after 8 November 2026. The offer prices are not presented with an invented crossed-out/base price. The flyer uses “D-Tan / Shehnaz facial”; that wording is kept without assuming whether the slash means a choice or a combined package.

## 1. Missing and unclear pricing

### No payable amount is configured

- women-botox - Botox treatment: 30% off. Provide the current base/list price, final customer price, offer start/end dates, and conditions.
- women-nanoplastia - Nanoplastia: 30% off. Provide the current base/list price, final customer price, offer start/end dates, and conditions.
- women-bioplastia - Bioplastia: 40% off. Provide the current base/list price, final customer price, offer start/end dates, and conditions.
- women-global-highlights - Global highlights: 30% off. Provide base/list price, final customer price, offer dates/conditions, and whether any length is the full eligibility rule.

### Existing price discrepancies or amount confirmation

- Women Keratin: current chat price ₹2,499; scanned PDF p. 12 lists a ₹4,500 starting price. Confirm that ₹2,499 is the current customer price (code keeps it unchanged).
- Women Smoothening: current chat price ₹2,999; PDF p. 11 lists a ₹3,999 starting price. Confirm that ₹2,999 is current (code keeps it unchanged).
- Women Global colour: current chat price ₹1,999; PDF p. 12 lists ₹2,500. Confirm which amount guests pay (code keeps ₹1,999).
- Global highlights: chat says 30% off and PDF p. 12 lists highlights starting at ₹5,000. Provide base/final price, dates, and terms.
- Hydra facial: chat price ₹1,499; photo 01 separately lists Hydra facial with machine at ₹3,499, with similar PDF Hydra entries. Confirm whether these are different treatments and the exact names.
- Baby Glow Poligen: chat price ₹1,999; PDF p. 16 lists Polagen at ₹2,000. Confirm whether these are the same service and which name/price is current.
- Korean bleach, half tummy: handwritten photo price is ₹900 and full tummy is ₹650. Confirm the half-tummy amount.
- Men's brand colour: handwritten photo 05 shows ₹150. Explain what this includes and confirm ₹150 is the customer price.
- Typed menu packages do not always match PDF individual-service rows. Confirm a package as a package; do not add up individual services or infer bundle prices. See MENU_DATA_REVIEW.md for the page comparison.

There are no zero or negative numeric amounts in the current data. Entries with a known amount but unresolved names or inclusions remain out of cart selection until confirmed.

## 2. Missing durations

All **207** services have no approved duration. For each service intended for online booking, provide the expected number of minutes to reserve, including setup/cleanup time when it prevents another visit. Browse-only services can remain without a duration.

The scanned PDF p. 10 notes durations for some massage services, but the matching durations have not been transcribed. Confirm the exact service match and minutes from that page; do not apply a general massage duration to a similarly named head-massage or package service.

## 3. Staff, schedule, category, and booking data

- Staff: provide each employee's private ID/name, eligible service IDs, weekly schedule, breaks, leave dates, and blocked time. One employee must be able to perform every service in one cart. Staff assignment is automatic; customers do not choose an employee.
- Salon calendar: confirm opening hours, breaks, holidays, special hours, and blocked dates. Appointment duration must fit both salon and assigned employee hours.
- Category: confirm whether Beauty services are for women, men, or all customers. Until confirmed, the group is called Beauty services, not Unisex.
- PDF scope: pages 16-17 list laser, microblading, IV, and device-based treatments missing from the current catalog. Confirm whether the salon currently offers these and approves them for publication before adding any.

## 4. Other owner-confirmation flags

The following configured prices are preserved, but the exact name, area, treatment identity, or package inclusions need the specific confirmation shown. Source file/page references are included when available.

- women-hair-wash-blowdry - **Hair wash + blow-dry (any style)** (₹349; Typed menu supplied in chat; related PDF reference: pp. 10 to 12). Confirm whether Blow and Blowdry are separate inclusions, and specify the style included.
- women-haircut-wash - **Haircut + hair wash** (₹499; Typed menu supplied in chat; related PDF reference: pp. 10 to 12). Confirm the exact wording (the supplied text says Hair Cut Hair wish) and whether hair wash is included.
- women-botox - **Botox treatment** (No payable price entered; Typed menu supplied in chat; related PDF reference: pp. 10 to 12). Offer supplied as a percentage discount; base price and offer period are not yet confirmed.
- women-nanoplastia - **Nanoplastia** (No payable price entered; Typed menu supplied in chat; related PDF reference: pp. 10 to 12). Offer supplied as a percentage discount; base price and offer period are not yet confirmed.
- women-bioplastia - **Bioplastia** (No payable price entered; Typed menu supplied in chat; related PDF reference: pp. 10 to 12). Offer supplied as a percentage discount; base price and offer period are not yet confirmed.
- women-global-highlights - **Global highlights (any length)** (No payable price entered; Typed menu supplied in chat; related PDF reference: pp. 10 to 12). Supplied as “Global Hilight”; base price and offer period are not yet confirmed.
- beauty-mani-pedi - **Manicure + pedicure** (₹1,199; Typed menu supplied in chat; related PDF reference: pp. 1 to 2, 9, 15 to 16). Confirm that both manicure and pedicure are included and state what complimentary eyebrow service is included.
- beauty-mani-pedi-spa-cleanup - **Manicure + pedicure + hair spa / clean-up** (₹2,499; Typed menu supplied in chat; related PDF reference: pp. 1 to 2, 9, 15 to 16). Confirm whether hair spa, clean-up, or either choice is included with manicure and pedicure.
- beauty-o3-facial-package - **“03” facial + manicure + pedicure + full-hand / half-leg wax** (₹2,999; Typed menu supplied in chat; related PDF reference: pp. 1 to 2, 9, 15 to 16). Confirm whether 03 means O3+, that manicure and pedicure are both included, and the wax coverage.
- beauty-hydra-facial - **Hydra facial** (₹1,499; Typed menu supplied in chat; related PDF reference: pp. 1, 16). Confirm this is the ₹1,499 service and distinguish it from the ₹3,499 Hydra facial with machine and other PDF Hydra entries.
- beauty-baby-glow-poligen - **Baby Glow Poligen (skin booster treatment)** (₹1,999; Typed menu supplied in chat; related PDF reference: pp. 1 to 2, 9, 15 to 16). Confirm the approved spelling and whether this is the same service as Polagen on PDF p. 16.
- beauty-rica-wax - **Rica wax: full hand + full leg + underarms** (₹1,499; Typed menu supplied in chat; related PDF reference: p. 8). Confirm that full hand, full leg, and underarms are all included, and state the complimentary eyebrow service.
- beauty-been-face-wax - **“Been” face wax** (₹499; Typed menu supplied in chat; related PDF reference: p. 3). Provide the exact service name/spelling and the wax areas included.
- beauty-03-face-wax - **“03” face wax** (₹699; Typed menu supplied in chat; related PDF reference: p. 3). Confirm whether 03 means O3+ and specify the wax areas included.
- men-haircut-beard-dtan - **Haircut + beard + D-tan** (₹399; Typed menu supplied in chat; related PDF reference: p. 14). Confirm the D-tan area and that haircut, beard, and D-tan are all included.
- men-haircut-beard-mani-pedi - **Haircut + beard + manicure / pedicure** (₹999; Typed menu supplied in chat; related PDF reference: p. 14). Confirm whether both manicure and pedicure are included with haircut and beard service.
- men-haircut-beard-colour - **Haircut + beard + colour** (₹799; Typed menu supplied in chat; related PDF reference: p. 14). Confirm the colour type/product and that haircut, beard, and colour are all included.
- men-aroma-facial-dtan - **Aroma facial + D-tan** (₹699; Typed menu supplied in chat; related PDF reference: p. 14). The supplied text uses a slash; confirm whether both services are included or the customer chooses one.
- men-03-facial-dtan - **“03” facial + D-tan** (₹1,899; Typed menu supplied in chat; related PDF reference: p. 14). Confirm whether 03 means O3+ and specify all package inclusions.
- men-hydra-facial - **Hydra facial** (₹1,499; Typed menu supplied in chat; related PDF reference: p. 14). Confirm this is the ₹1,499 Hydra facial and identify whether it differs from the other PDF Hydra entries.
- men-botox-protein - **Botox / protein treatment** (₹2,499; Handwritten photo 05). Confirm whether the price is for one choice of treatment or both treatments together.
- women-caring-hair-spa-shoulder - **Caring hair spa — shoulder length** (₹1,200; Handwritten photo 05). Confirm that Caring is the correct product/service name; price is retained as supplied.
- women-caring-hair-spa-medium - **Caring hair spa — medium length** (₹1,800; Handwritten photo 05). Confirm that Caring is the correct product/service name; price is retained as supplied.
- women-caring-hair-spa-long - **Caring hair spa — long length** (₹2,500; Handwritten photo 05). Confirm that Caring is the correct product/service name; price is retained as supplied.
- women-treatment-hair-wash - **Treatment hair wash** (₹900; Handwritten photo 05). Confirm that Treatment hair wash is the exact customer-facing name and what treatment it includes.
- men-brand-colour - **Men’s colour: brand colour** (₹150; Handwritten photo 05). Explain what brand colour includes and confirm that ₹150 is the customer price.
- beauty-advanced-korean-glass-facial - **Korean Glass facial** (₹2,899; Handwritten photo 01). Confirm the exact service name/spelling from handwritten photo 01; price is retained as supplied.
- beauty-advanced-o3-brightening-seven-step - **O3+ brightening facial (7 step)** (₹2,499; Handwritten photo 01). Confirm the exact O3+ facial name and that the seven-step wording is correct; price is retained.
- beauty-advanced-o3-bridal-eleven-step - **O3+ bridal facial (11 step)** (₹3,599; Handwritten photo 01). Confirm the exact O3+ bridal facial name and that the eleven-step wording is correct; price is retained.
- beauty-korean-bleach-half-tummy - **Korean bleach: half tummy** (₹900; Handwritten photo 03). Confirm the ₹900 half-tummy amount is intentional while full tummy is ₹650.

## 5. Full current catalog

| ID | Group | Subcategory | Customer-facing name | Current configured price | Source file/page | Duration | Menu selectable | Bookable | Confirmation flag |
|---|---|---|---|---:|---|---|---|---|---|
| women-hair-wash-blowdry | Women | Haircuts, styling & wash | Hair wash + blow-dry (any style) | ₹349 | Typed menu supplied in chat; related PDF reference: pp. 10 to 12 | Not supplied | No | No | Yes |
| women-haircut-wash | Women | Haircuts, styling & wash | Haircut + hair wash | ₹499 | Typed menu supplied in chat; related PDF reference: pp. 10 to 12 | Not supplied | No | No | Yes |
| women-keratin | Women | Hair treatments | Keratin treatment | ₹2,499 | Typed menu supplied in chat; related PDF reference: pp. 10 to 12 | Not supplied | Yes | No | No |
| women-smoothening | Women | Hair treatments | Smoothening | ₹2,999 | Typed menu supplied in chat; related PDF reference: pp. 10 to 12 | Not supplied | Yes | No | No |
| women-botox | Women | Hair treatments | Botox treatment | 30% off · final price to confirm (numeric price missing) | Typed menu supplied in chat; related PDF reference: pp. 10 to 12 | Not supplied | No | No | Yes |
| women-nanoplastia | Women | Hair treatments | Nanoplastia | 30% off · final price to confirm (numeric price missing) | Typed menu supplied in chat; related PDF reference: pp. 10 to 12 | Not supplied | No | No | Yes |
| women-bioplastia | Women | Hair treatments | Bioplastia | 40% off · final price to confirm (numeric price missing) | Typed menu supplied in chat; related PDF reference: pp. 10 to 12 | Not supplied | No | No | Yes |
| women-karasmooth | Women | Hair treatments | Karasmooth | ₹4,999 | Typed menu supplied in chat; related PDF reference: pp. 10 to 12 | Not supplied | Yes | No | No |
| women-global-highlights | Women | Hair colour | Global highlights (any length) | 30% off · final price to confirm (numeric price missing) | Typed menu supplied in chat; related PDF reference: pp. 10 to 12 | Not supplied | No | No | Yes |
| women-global-colour | Women | Hair colour | Global colour | ₹1,999 | Typed menu supplied in chat; related PDF reference: pp. 10 to 12 | Not supplied | Yes | No | No |
| women-balayage | Women | Hair colour | Balayage | ₹4,999 | Typed menu supplied in chat; related PDF reference: pp. 10 to 12 | Not supplied | Yes | No | No |
| women-hair-wash-pdf | Women | Haircuts, styling & wash | Hair wash | ₹400 | Scanned salon PDF, p. 12 | Not supplied | Yes | No | No |
| women-coconut-oil-head-massage | Women | Hair massage | Coconut oil head massage | ₹500 | Scanned salon PDF, p. 12 | Not supplied | Yes | No | No |
| women-temporary-hair-ironing | Women | Haircuts, styling & wash | Temporary hair ironing | ₹800 | Scanned salon PDF, p. 11 | Not supplied | Yes | No | No |
| women-temporary-curls | Women | Haircuts, styling & wash | Temporary curls | ₹800 | Scanned salon PDF, p. 11 | Not supplied | Yes | No | No |
| women-only-hair-dry | Women | Haircuts, styling & wash | Hair dry only | ₹350 | Scanned salon PDF, p. 11 | Not supplied | Yes | No | No |
| beauty-mani-pedi | Beauty services | Manicure & pedicure | Manicure + pedicure | ₹1,199 | Typed menu supplied in chat; related PDF reference: pp. 1 to 2, 9, 15 to 16 | Not supplied | No | No | Yes |
| beauty-mani-pedi-spa-cleanup | Beauty services | Manicure & pedicure | Manicure + pedicure + hair spa / clean-up | ₹2,499 | Typed menu supplied in chat; related PDF reference: pp. 1 to 2, 9, 15 to 16 | Not supplied | No | No | Yes |
| beauty-o3-facial-package | Beauty services | Waxing | “03” facial + manicure + pedicure + full-hand / half-leg wax | ₹2,999 | Typed menu supplied in chat; related PDF reference: pp. 1 to 2, 9, 15 to 16 | Not supplied | No | No | Yes |
| beauty-hydra-facial | Beauty services | Facials & skin care | Hydra facial | ₹1,499 | Typed menu supplied in chat; related PDF reference: pp. 1, 16 | Not supplied | No | No | Yes |
| beauty-baby-glow-poligen | Beauty services | Facials & skin care | Baby Glow Poligen (skin booster treatment) | ₹1,999 | Typed menu supplied in chat; related PDF reference: pp. 1 to 2, 9, 15 to 16 | Not supplied | No | No | Yes |
| beauty-rica-wax | Beauty services | Waxing | Rica wax: full hand + full leg + underarms | ₹1,499 | Typed menu supplied in chat; related PDF reference: p. 8 | Not supplied | No | No | Yes |
| beauty-been-face-wax | Beauty services | Waxing | “Been” face wax | ₹499 | Typed menu supplied in chat; related PDF reference: p. 3 | Not supplied | No | No | Yes |
| beauty-03-face-wax | Beauty services | Waxing | “03” face wax | ₹699 | Typed menu supplied in chat; related PDF reference: p. 3 | Not supplied | No | No | Yes |
| beauty-threading-forehead | Beauty services | Threading | Threading: forehead | ₹30 | Scanned salon PDF, p. 3 | Not supplied | Yes | No | No |
| beauty-threading-upper-lip | Beauty services | Threading | Threading: upper lip | ₹30 | Scanned salon PDF, p. 3 | Not supplied | Yes | No | No |
| beauty-threading-lower-lip | Beauty services | Threading | Threading: lower lip | ₹30 | Scanned salon PDF, p. 3 | Not supplied | Yes | No | No |
| beauty-threading-chin | Beauty services | Threading | Threading: chin | ₹30 | Scanned salon PDF, p. 3 | Not supplied | Yes | No | No |
| beauty-brazilian-full-face-wax | Beauty services | Waxing | Face wax: full face | ₹550 | Scanned salon PDF, p. 3 | Not supplied | Yes | No | No |
| beauty-brazilian-forehead-wax | Beauty services | Waxing | Face wax: forehead | ₹130 | Scanned salon PDF, p. 3 | Not supplied | Yes | No | No |
| beauty-brazilian-side-wax | Beauty services | Waxing | Face wax: sides | ₹250 | Scanned salon PDF, p. 3 | Not supplied | Yes | No | No |
| beauty-brazilian-chin-wax | Beauty services | Waxing | Face wax: chin | ₹80 | Scanned salon PDF, p. 3 | Not supplied | Yes | No | No |
| beauty-brazilian-upper-lip-wax | Beauty services | Waxing | Face wax: upper lip | ₹60 | Scanned salon PDF, p. 3 | Not supplied | Yes | No | No |
| beauty-brazilian-lower-lip-wax | Beauty services | Waxing | Face wax: lower lip | ₹60 | Scanned salon PDF, p. 3 | Not supplied | Yes | No | No |
| beauty-rica-underarms-wax | Beauty services | Waxing | Face wax: underarms | ₹200 | Scanned salon PDF, p. 8 | Not supplied | Yes | No | No |
| men-haircut-beard-wash | Men | Haircuts, beard & grooming | Haircut + beard + hair wash | ₹249 | Typed menu supplied in chat; related PDF reference: p. 14 | Not supplied | Yes | No | No |
| men-haircut-beard-dtan | Men | Facials & skin care | Haircut + beard + D-tan | ₹399 | Typed menu supplied in chat; related PDF reference: p. 14 | Not supplied | No | No | Yes |
| men-haircut-beard-spa | Men | Hair treatments | Haircut + beard + hair spa | ₹699 | Typed menu supplied in chat; related PDF reference: p. 14 | Not supplied | Yes | No | No |
| men-haircut-beard-dandruff | Men | Hair treatments | Haircut + beard + dandruff treatment | ₹799 | Typed menu supplied in chat; related PDF reference: p. 14 | Not supplied | Yes | No | No |
| men-haircut-beard-mani-pedi | Men | Haircuts, beard & grooming | Haircut + beard + manicure / pedicure | ₹999 | Typed menu supplied in chat; related PDF reference: p. 14 | Not supplied | No | No | Yes |
| men-haircut-beard-colour | Men | Hair colour | Haircut + beard + colour | ₹799 | Typed menu supplied in chat; related PDF reference: p. 14 | Not supplied | No | No | Yes |
| men-haircut-shave-head-massage | Men | Haircuts, beard & grooming | Haircut + shaving + head massage | ₹349 | Typed menu supplied in chat; related PDF reference: p. 14 | Not supplied | Yes | No | No |
| men-aroma-facial-dtan | Men | Facials & skin care | Aroma facial + D-tan | ₹699 | Typed menu supplied in chat; related PDF reference: p. 14 | Not supplied | No | No | Yes |
| men-03-facial-dtan | Men | Facials & skin care | “03” facial + D-tan | ₹1,899 | Typed menu supplied in chat; related PDF reference: p. 14 | Not supplied | No | No | Yes |
| men-hydra-facial | Men | Facials & skin care | Hydra facial | ₹1,499 | Typed menu supplied in chat; related PDF reference: p. 14 | Not supplied | No | No | Yes |
| men-keratin | Men | Hair treatments | Keratin treatment | ₹1,000 | Typed menu supplied in chat; related PDF reference: p. 14 | Not supplied | Yes | No | No |
| men-botox-protein | Men | Hair treatments | Botox / protein treatment | ₹2,499 | Handwritten photo 05 | Not supplied | No | No | Yes |
| women-set-blow-dry | Women | Haircuts, styling & wash | Set blow-dry | ₹500 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-setting-blow-dry | Women | Haircuts, styling & wash | Setting blow-dry | ₹600 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-loreal-hair-spa-shoulder | Women | Hair spa | L'Oreal hair spa — shoulder length | ₹1,000 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-morocco-hair-spa-shoulder | Women | Hair spa | Morocco hair spa — shoulder length | ₹1,500 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-caring-hair-spa-shoulder | Women | Hair spa | Caring hair spa — shoulder length | ₹1,200 | Handwritten photo 05 | Not supplied | No | No | Yes |
| women-loreal-hair-spa-medium | Women | Hair spa | L'Oreal hair spa — medium length | ₹1,500 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-morocco-hair-spa-medium | Women | Hair spa | Morocco hair spa — medium length | ₹2,000 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-caring-hair-spa-medium | Women | Hair spa | Caring hair spa — medium length | ₹1,800 | Handwritten photo 05 | Not supplied | No | No | Yes |
| women-loreal-hair-spa-long | Women | Hair spa | L'Oreal hair spa — long length | ₹2,000 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-morocco-hair-spa-long | Women | Hair spa | Morocco hair spa — long length | ₹3,000 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-caring-hair-spa-long | Women | Hair spa | Caring hair spa — long length | ₹2,500 | Handwritten photo 05 | Not supplied | No | No | Yes |
| women-dandruff-treatment-spa | Women | Hair spa | Dandruff treatment with spa | ₹2,500 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-dandruff-treatment | Women | Hair treatments | Dandruff treatment only | ₹1,200 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-almond-oil-head-massage | Women | Hair massage | Almond oil head massage | ₹600 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-mixed-oil-head-massage | Women | Hair massage | Mixed oil head massage | ₹700 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-deep-conditioning | Women | Hair treatments | Deep conditioning | ₹900 | Handwritten photo 05 | Not supplied | Yes | No | No |
| women-treatment-hair-wash | Women | Hair treatments | Treatment hair wash | ₹900 | Handwritten photo 05 | Not supplied | No | No | Yes |
| women-head-massage-hair-wash | Women | Hair massage | Head massage with hair wash | ₹800 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-brand-colour | Men | Hair colour | Men’s colour: brand colour | ₹150 | Handwritten photo 05 | Not supplied | No | No | Yes |
| men-majirel-colour | Men | Hair colour | Men’s local Majirel colour | ₹800 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-inoa-colour | Men | Hair colour | Men’s local Inoa colour | ₹900 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-local-highlights | Men | Hair colour | Men’s local highlights | ₹1,800 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-head-massage | Men | Haircuts, beard & grooming | Men’s head massage | ₹500 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-loreal-hair-spa | Men | Hair treatments | Men’s L'Oreal hair spa | ₹800 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-power-mix-hair-spa | Men | Hair treatments | Men’s Power Mix hair spa | ₹800 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-keratin-hair-spa | Men | Hair treatments | Men’s Keratin hair spa | ₹800 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-milk-protein-hair-spa | Men | Hair treatments | Men’s milk protein hair spa | ₹1,000 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-biotin-collagen-hair-spa | Men | Hair treatments | Men’s biotin collagen hair spa | ₹1,000 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-hyaluronic-hair-spa | Men | Hair treatments | Men’s hyaluronic hair spa | ₹1,000 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-dandruff-hair-spa | Men | Hair treatments | Men’s dandruff treatment | ₹1,000 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-anti-dandruff-hair-spa | Men | Hair treatments | Men’s anti-dandruff treatment | ₹1,000 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-smoothening | Men | Hair treatments | Men’s smoothening | ₹1,200 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-botox | Men | Hair treatments | Men’s Botox treatment | ₹1,500 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-nanoplastia | Men | Hair treatments | Men’s Nanoplastia | ₹2,500 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-frosting-cap-highlights | Men | Hair colour | Men’s frosting cap highlights | ₹1,500 | Handwritten photo 05 | Not supplied | Yes | No | No |
| men-fashion-shade-global-colour | Men | Hair colour | Men’s fashion shade (global colour) | ₹2,000 | Handwritten photo 05 | Not supplied | Yes | No | No |
| beauty-threading-eyebrows | Beauty services | Threading | Threading: eyebrows | ₹50 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-threading-side-jawline | Beauty services | Threading | Threading: side and jawline | ₹60 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-threading-full-face | Beauty services | Threading | Threading: full face | ₹200 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-advanced-sasa-facial | Beauty services | Facials & skin care | Sasa facial | ₹1,299 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-advanced-aroma-diamond-facial | Beauty services | Facials & skin care | Aroma diamond facial | ₹999 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-advanced-jovees-24k-gold-facial | Beauty services | Facials & skin care | Jovees 24K gold facial | ₹1,999 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-advanced-lotus-gold-facial | Beauty services | Facials & skin care | Lotus gold facial | ₹1,200 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-advanced-lotus-bridal-glow-facial | Beauty services | Facials & skin care | Lotus bridal glow facial | ₹1,399 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-advanced-vlcc-tightening-facial | Beauty services | Facials & skin care | VLCC tightening facial | ₹1,099 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-advanced-korean-glass-facial | Beauty services | Facials & skin care | Korean Glass facial | ₹2,899 | Handwritten photo 01 | Not supplied | No | No | Yes |
| beauty-advanced-o3-brightening-seven-step | Beauty services | Facials & skin care | O3+ brightening facial (7 step) | ₹2,499 | Handwritten photo 01 | Not supplied | No | No | Yes |
| beauty-advanced-o3-glowing-facial | Beauty services | Facials & skin care | O3+ glowing facial | ₹2,899 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-advanced-aroma-acne-skin-facial | Beauty services | Facials & skin care | Aroma acne-skin facial | ₹1,499 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-advanced-o3-bridal-eleven-step | Beauty services | Facials & skin care | O3+ bridal facial (11 step) | ₹3,599 | Handwritten photo 01 | Not supplied | No | No | Yes |
| beauty-advanced-shahnaz-anti-aging-facial | Beauty services | Facials & skin care | Shahnaz anti-aging facial | ₹1,500 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-hydra-facial-machine | Beauty services | Facials & skin care | Hydra facial with machine | ₹3,499 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-tightening-mask | Beauty services | Facials & skin care | Tightening mask | ₹399 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-whitening-mask | Beauty services | Facials & skin care | Whitening mask | ₹399 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-advanced-sasa-gold-facial | Beauty services | Facials & skin care | Sasa gold facial | ₹1,400 | Handwritten photo 01 | Not supplied | Yes | No | No |
| beauty-basic-facial | Beauty services | Facials & skin care | Basic facial | ₹599 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-basic-herbal-facial | Beauty services | Facials & skin care | Herbal facial | ₹799 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-basic-fruit-facial | Beauty services | Facials & skin care | Mix fruit facial | ₹699 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-basic-vlcc-facial | Beauty services | Facials & skin care | VLCC facial | ₹799 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-basic-vlcc-anti-tan-facial | Beauty services | Facials & skin care | VLCC anti-tan facial | ₹1,000 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-basic-lotus-herbal-facial | Beauty services | Facials & skin care | Lotus herbal facial | ₹1,000 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-basic-aroma-anti-tan-facial | Beauty services | Facials & skin care | Aroma anti-tan facial | ₹1,200 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-basic-aroma-pearl-facial | Beauty services | Facials & skin care | Aroma pearl facial | ₹800 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-basic-vlcc-anti-aging-facial | Beauty services | Facials & skin care | VLCC anti-aging facial | ₹1,200 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-basic-vlcc-diamond-facial | Beauty services | Facials & skin care | VLCC diamond facial | ₹1,100 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-basic-vlcc-insta-glow-facial | Beauty services | Facials & skin care | VLCC Insta Glow facial | ₹1,000 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-basic-jovees-pigmentation-facial | Beauty services | Facials & skin care | Jovees pigmentation facial | ₹1,500 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-cleanup-basic | Beauty services | Clean-ups | Basic cleanup | ₹500 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-cleanup-fruit | Beauty services | Clean-ups | Fruit cleanup | ₹600 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-cleanup-vlcc | Beauty services | Clean-ups | VLCC cleanup | ₹800 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-cleanup-lotus-herbal | Beauty services | Clean-ups | Lotus herbal cleanup | ₹700 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-cleanup-aroma-dtan | Beauty services | Clean-ups | Aroma D-tan cleanup | ₹1,000 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-cleanup-acne-skin | Beauty services | Clean-ups | Acne-skin cleanup | ₹1,200 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-cleanup-lotus-gold | Beauty services | Clean-ups | Lotus gold cleanup | ₹800 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-cleanup-lotus-diamond | Beauty services | Clean-ups | Lotus diamond cleanup | ₹1,800 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-cleanup-vlcc-insta-glow | Beauty services | Clean-ups | VLCC Insta Glow cleanup | ₹999 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-cleanup-aroma-diamond | Beauty services | Clean-ups | Aroma diamond cleanup | ₹799 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-cleanup-mix-fruit | Beauty services | Clean-ups | Mixed fruit cleanup | ₹800 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-cleanup-o3 | Beauty services | Clean-ups | O3+ cleanup | ₹1,099 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-cleanup-o3-whitening | Beauty services | Clean-ups | O3+ whitening cleanup | ₹1,200 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-cleanup-hydra | Beauty services | Clean-ups | Hydra cleanup with machine | ₹1,899 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-cleanup-sasa | Beauty services | Clean-ups | Sasa cleanup | ₹800 | Handwritten photo 02 | Not supplied | Yes | No | No |
| beauty-body-polishing-full-body | Beauty services | Body care | Body polishing: full body | ₹5,000 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-body-polishing-full-hand | Beauty services | Body care | Body polishing: full hand | ₹1,200 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-body-polishing-full-leg | Beauty services | Body care | Body polishing: full leg | ₹2,000 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-body-polishing-full-back | Beauty services | Body care | Body polishing: full back | ₹1,000 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-body-polishing-half-back | Beauty services | Body care | Body polishing: half back | ₹750 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-body-polishing-full-tummy | Beauty services | Body care | Body polishing: full tummy | ₹1,000 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-body-polishing-underarms | Beauty services | Body care | Body polishing: underarms | ₹700 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-body-polishing-neck | Beauty services | Body care | Body polishing: neck | ₹600 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-hydra-bleach-full-face | Beauty services | Body care | Hydra bleach (premium): full face | ₹400 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-hydra-bleach-full-hand | Beauty services | Body care | Hydra bleach (premium): full hand | ₹600 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-hydra-bleach-half-hand | Beauty services | Body care | Hydra bleach (premium): half hand | ₹400 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-hydra-bleach-full-leg | Beauty services | Body care | Hydra bleach (premium): full leg | ₹1,800 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-hydra-bleach-half-leg | Beauty services | Body care | Hydra bleach (premium): half leg | ₹600 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-hydra-bleach-full-back | Beauty services | Body care | Hydra bleach (premium): full back | ₹500 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-hydra-bleach-half-back | Beauty services | Body care | Hydra bleach (premium): half back | ₹350 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-hydra-bleach-full-body | Beauty services | Body care | Hydra bleach (premium): full body | ₹3,500 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-korean-bleach-full-face | Beauty services | Body care | Korean bleach: full face | ₹650 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-korean-bleach-full-hand | Beauty services | Body care | Korean bleach: full hand | ₹1,200 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-korean-bleach-half-hand | Beauty services | Body care | Korean bleach: half hand | ₹600 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-korean-bleach-full-leg | Beauty services | Body care | Korean bleach: full leg | ₹1,200 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-korean-bleach-half-leg | Beauty services | Body care | Korean bleach: half leg | ₹800 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-korean-bleach-full-back | Beauty services | Body care | Korean bleach: full back | ₹1,000 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-korean-bleach-half-back | Beauty services | Body care | Korean bleach: half back | ₹650 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-korean-bleach-underarms | Beauty services | Body care | Korean bleach: underarms | ₹350 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-korean-bleach-feet | Beauty services | Body care | Korean bleach: feet | ₹400 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-korean-bleach-full-tummy | Beauty services | Body care | Korean bleach: full tummy | ₹650 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-korean-bleach-half-tummy | Beauty services | Body care | Korean bleach: half tummy | ₹900 | Handwritten photo 03 | Not supplied | No | No | Yes |
| beauty-korean-bleach-full-neck | Beauty services | Body care | Korean bleach: full neck | ₹900 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-korean-bleach-full-body | Beauty services | Body care | Korean bleach: full body | ₹5,500 | Handwritten photo 03 | Not supplied | Yes | No | No |
| beauty-dtan-full-face | Beauty services | Body care | D-tan: full face | ₹500 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-full-hand | Beauty services | Body care | D-tan: full hand | ₹600 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-half-hand | Beauty services | Body care | D-tan: half hand | ₹400 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-full-leg | Beauty services | Body care | D-tan: full leg | ₹1,000 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-half-leg | Beauty services | Body care | D-tan: half leg | ₹550 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-full-back | Beauty services | Body care | D-tan: full back | ₹1,000 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-half-back | Beauty services | Body care | D-tan: half back | ₹500 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-underarms | Beauty services | Body care | D-tan: underarms | ₹400 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-feet | Beauty services | Body care | D-tan: feet | ₹400 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-full-tummy | Beauty services | Body care | D-tan: full tummy | ₹600 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-half-tummy | Beauty services | Body care | D-tan: half tummy | ₹400 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-full-neck | Beauty services | Body care | D-tan: full neck | ₹900 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-full-body | Beauty services | Body care | D-tan: full body | ₹4,500 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-premium-full-face | Beauty services | Body care | Premium D-tan: full face | ₹500 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-premium-full-hand | Beauty services | Body care | Premium D-tan: full hand | ₹800 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-premium-half-hand | Beauty services | Body care | Premium D-tan: half hand | ₹600 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-premium-full-leg | Beauty services | Body care | Premium D-tan: full leg | ₹1,000 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-premium-half-leg | Beauty services | Body care | Premium D-tan: half leg | ₹700 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-premium-full-back | Beauty services | Body care | Premium D-tan: full back | ₹1,200 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-premium-half-back | Beauty services | Body care | Premium D-tan: half back | ₹750 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-premium-underarms | Beauty services | Body care | Premium D-tan: underarms | ₹450 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-premium-feet | Beauty services | Body care | Premium D-tan: feet | ₹450 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-premium-full-tummy | Beauty services | Body care | Premium D-tan: full tummy | ₹1,000 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-premium-half-tummy | Beauty services | Body care | Premium D-tan: half tummy | ₹800 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-dtan-premium-full-body | Beauty services | Body care | Premium D-tan: full body | ₹5,900 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-regular-wax-full-hand | Beauty services | Waxing | Regular wax: full hand | ₹350 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-regular-wax-full-leg | Beauty services | Waxing | Regular wax: full leg | ₹800 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-regular-wax-three-quarter-leg | Beauty services | Waxing | Regular wax: three-quarter leg | ₹500 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-regular-wax-underarms | Beauty services | Waxing | Regular wax: underarms | ₹100 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-regular-wax-full-back | Beauty services | Waxing | Regular wax: back | ₹400 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-regular-wax-half-hand | Beauty services | Waxing | Regular wax: half hand | ₹200 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-regular-wax-bikini | Beauty services | Waxing | Regular wax: bikini | ₹2,000 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-regular-wax-full-body | Beauty services | Waxing | Regular wax: full body | ₹2,500 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-regular-wax-full-face | Beauty services | Waxing | Regular wax: full face | ₹400 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-rica-wax-full-leg | Beauty services | Waxing | Rica wax: full leg | ₹999 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-rica-wax-half-leg | Beauty services | Waxing | Rica wax: half leg | ₹599 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-rica-wax-full-hand | Beauty services | Waxing | Rica wax: full hand | ₹599 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-rica-wax-half-hand | Beauty services | Waxing | Rica wax: half hand | ₹350 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-rica-wax-underarms | Beauty services | Waxing | Rica wax: underarms | ₹250 | Latest handwritten photo 2026-10-31 | Not supplied | Yes | No | No |
| beauty-rica-wax-full-back | Beauty services | Waxing | Rica wax: full back | ₹1,000 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-rica-wax-half-back | Beauty services | Waxing | Rica wax: half back | ₹500 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-rica-wax-full-body | Beauty services | Waxing | Rica wax: full body | ₹3,500 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-rica-wax-bikini | Beauty services | Waxing | Rica wax: bikini | ₹3,000 | Handwritten photo 04 | Not supplied | Yes | No | No |
| beauty-diwali-package-999 | Beauty services | Clean-ups | Diwali all-in package - Cleanup | ₹999 | Diwali offer flyer (2026-10-31) | Not supplied | Yes | No | No |
| beauty-diwali-package-1599 | Beauty services | Facials & skin care | Diwali all-in package - Organic facial | ₹1,599 | Diwali offer flyer (2026-10-31) | Not supplied | Yes | No | No |
| beauty-diwali-package-2099 | Beauty services | Facials & skin care | Diwali all-in package - Fruit facial | ₹2,099 | Diwali offer flyer (2026-10-31) | Not supplied | Yes | No | No |
| beauty-diwali-package-2599 | Beauty services | Facials & skin care | Diwali all-in package - D-Tan / Shehnaz facial | ₹2,599 | Diwali offer flyer (2026-10-31) | Not supplied | Yes | No | No |
| beauty-diwali-package-2999 | Beauty services | Facials & skin care | Diwali all-in package - Aloe vera facial | ₹2,999 | Diwali offer flyer (2026-10-31) | Not supplied | Yes | No | No |
| beauty-diwali-package-3499 | Beauty services | Facials & skin care | Diwali all-in package - Aloe vera facial + roots touchup | ₹3,499 | Diwali offer flyer (2026-10-31) | Not supplied | Yes | No | No |

## Source files

- Canonical service catalog and current prices: server/src/config/salon.js.
- Scanned PDF: docs/source-material/salon services.pdf (private/ignored). PDF page notes and typed list reconciliation: MENU_DATA_REVIEW.md.
- New menu photos in the private source-material folder: 01 threading/advanced facials; 02 basic facials/cleanups; 03 body polishing/bleach; 04 D-tan/waxing; 05 women's hair spa/men's colour and treatments.
- Catalog composition: 31 typed chat entries, 16 legible PDF entries, and 153 entries transcribed from the five newer handwritten photos. These scans are not public website images.
