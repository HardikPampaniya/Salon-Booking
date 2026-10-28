# Menu data review

> This file preserves the source transcription and PDF page reconciliation. For the current full 200-service catalog, current booking flags, missing prices, owner confirmations, and duration status, see [SERVICE_DATA_REVIEW.md](SERVICE_DATA_REVIEW.md). This newer report supersedes the older arrival-only booking notes below.

## Source status

The salon supplied `docs/source-material/salon services.pdf`. It contains 18 image-only pages, so the text is not machine-searchable. All pages were visually reviewed. Pages 4 and 5 repeat the facial and cleanup sections from pages 1 and 2 with handwritten edits. Several other pages also have handwritten, crossed-out, or overwritten prices that do not identify a clear final amount.

The owner later supplied five newer handwritten menu photos. They were copied from generated `client/dist/images/` output into the ignored `docs/source-material/` folder so a build will not remove them. The new photos are price-list references, not salon/service photography, so they are not displayed on the website. Their 153 readable menu entries are now in the site; where the same service is clearly identifiable, the newer handwritten price replaces the older value. The full menu now has 200 entries.

The PDF contains a much broader menu than the 31 items transcribed in chat. The salon owner has confirmed that handwritten prices are current where they can be read. Sixteen clear, individual PDF services have been added as supplemental menu entries; chat-supplied package prices remain separate where the PDF lists individual services rather than the same package. The source remains in the ignored private source folder and is not served by the site.

## Owner's latest decisions

- Keep all readable prices supplied so far exactly as given. The remaining unclear PDF prices will be supplied later; no one should guess them.
- Offers and package details are deferred. Those rows may remain on the public browsing menu, but must stay unavailable for online booking until the offer price/terms or package contents are approved.
- Charge a fixed ₹100 online advance for every booked service. If the service price is below ₹100, the studio returns the difference in cash after service. If the service is more than ₹100, the remaining amount is due at the salon.
- Online booking may start with a selected set of fully approved services. Confirmed services do not have to wait for every deferred or unreadable menu row.
- The current booking implementation requires an approved positive duration and qualified staff schedule for each service offered online. The customer chooses an appointment start time; the server automatically assigns one eligible employee for the cart. The customer does not choose a staff member.

## What “customer-facing name” means

This is the service wording the guest sees on the Services page and the booking list. Some source phrases are unclear, so a few displayed names are editorial guesses: “Hair Cut Hair wish” is currently shown as “Haircut + hair wash”; “03 facial” may mean “O3 facial”; “Been face wax” needs its exact salon spelling and wax area; and slashes in packages might mean “either/or” or “both.” Correct only the labels that are wrong, using `current website wording → exact wording to show guests`, and explain inclusions/areas for any combined service. A service can remain unbookable until its name is confirmed.

### PDF page review

- Pages 1 and 4: advanced/basic facials; handwritten and crossed-out amounts. Page 4 appears to be an annotated repeat of page 1.
- Pages 2 and 5: cleanups and body polishing; handwritten changes. Page 5 appears to be an annotated repeat of page 2.
- Page 3: threading and face waxing with handwritten edits.
- Page 6: premium bleach.
- Page 7: D-tan and premium D-tan by area.
- Page 8: regular, chocolate, and Rica waxing by area; a Rica underarms amount is overwritten.
- Page 9: pal waxing, manicure, and pedicure price lists.
- Page 10: body massage and haircut styles; the PDF gives durations for some massages only.
- Page 11: baby haircuts, blow-dry, hair colouring/highlights, and starting prices for hair treatments. Several blow-dry prices are handwritten over print.
- Page 12: hair spa by length, hair colouring, and highlights. Printed starting prices include smoothening ₹3,999, keratin ₹4,500, Botox ₹4,999, Nanoplastia starting ₹5,999, and Global Hair Colour ₹2,500.
- Page 13: men's section divider.
- Page 14: men's cuts, colour, hair spa, and men's services. Several listed treatment amounts are handwritten over or obscured.
- Page 15: manicure and pedicure services.
- Page 16: laser hair removal, luxurious facials, and microblading.
- Page 17: device-based skin treatments, IV drips, and removal services.
- Page 18: cover with studio branding, phone 77383 85236, and address Shop No. 8, Sahara Sankalp Residency, Plot No. 16, Sector 2A, Karanjade.

The PDF confirms the WhatsApp number already supplied and provides the Plot No. 16 address detail. The four discount claims in chat do not include a final offer price or offer period. The PDF also advertises services beyond the current website menu, including laser, microblading, IV drips, and device-based treatments; these are not being added without confirmation that they are current salon services and approved for publication.

## Handwritten prices transcribed to the site

The 16 handwritten amounts below were legible in the older PDF and were added as individual menu entries. The original 31 chat-supplied menu entries remain in place. A service can be browsed with a known price, but online booking also requires confirmed wording/inclusions, an approved duration, and an eligible staff schedule. See `SERVICE_DATA_REVIEW.md` for current status.

| PDF page | Individual service | Handwritten price |
|---:|---|---:|
| 3 | Threading: forehead | ₹30 |
| 3 | Threading: upper lip | ₹30 |
| 3 | Threading: lower lip | ₹30 |
| 3 | Threading: chin | ₹30 |
| 3 | Brazilian wax: full face | ₹550 |
| 3 | Brazilian wax: forehead | ₹130 |
| 3 | Brazilian wax: sides | ₹150 |
| 3 | Brazilian wax: chin | ₹80 |
| 3 | Brazilian wax: upper lip | ₹60 |
| 3 | Brazilian wax: lower lip | ₹60 |
| 8 | Rica wax: underarms | ₹200 |
| 11 | Temporary hair ironing | ₹600 |
| 11 | Temporary curls | ₹800 |
| 11 | Hair dry only | ₹350 |
| 12 | Hair wash | ₹400 |
| 12 | Coconut oil head massage | ₹500 |

### Newer handwritten photo prices added to the website

All entries in this list are visible in the public menu. Services with a known positive price and clear wording can be browsed and added to the cart, but remain unavailable for online booking until a positive duration and an eligible employee schedule are approved. Names follow the handwritten labels as closely as possible; rows with meaning/name confirmation flags remain outside checkout.

| Section | Services and prices transcribed from the five newer photos |
|---|---|
| Women's hair: blow-dry and spa | Set blow-dry ₹500; Setting blow-dry ₹600; L'Oreal hair spa (shoulder / medium / long) ₹1,000 / ₹1,500 / ₹2,000; Morocco hair spa (shoulder / medium / long) ₹1,500 / ₹2,000 / ₹3,000; Caring hair spa (shoulder / medium / long) ₹1,200 / ₹1,800 / ₹2,500; dandruff treatment with spa ₹2,500; dandruff treatment only ₹1,200; almond oil head massage ₹600; mixed oil head massage ₹700; deep conditioning ₹900; treatment hair wash ₹900; head massage with hair wash ₹800. Existing entries updated from the newer photos: temporary hair ironing ₹800 (previously ₹600); hair wash ₹400, temporary curls ₹800, hair dry only ₹350, and coconut oil head massage ₹500 remain as listed. |
| Men's colour and hair treatments | Brand colour ₹150; local Majirel colour ₹800; local Inoa colour ₹900; local highlights ₹1,800; head massage ₹500; L'Oreal hair spa ₹800; Power Mix hair spa ₹800; Keratin hair spa ₹800; milk protein hair spa ₹1,000; biotin collagen hair spa ₹1,000; hyaluronic hair spa ₹1,000; dandruff treatment ₹1,000; anti-dandruff treatment ₹1,000; Keratin treatment ₹1,000 (newer price replaces ₹1,999); Smoothening ₹1,200; Botox treatment ₹1,500; Nanoplastia ₹2,500; frosting-cap highlights ₹1,500; global fashion shade ₹2,000. |
| Threading | Eyebrows ₹50; forehead ₹30; upper lip ₹30; lower lip ₹30; chin ₹30; side and jawline ₹60; full face ₹200. |
| Face wax | Full face ₹550; forehead ₹130; sides ₹250 (newer price replaces ₹150); chin ₹80; upper lip ₹60; lower lip ₹60; underarms ₹200. The latest photo labels this section “Face wax”; the website wording was updated from “Brazilian wax” for these area-specific entries. |
| Advanced facials and masks | Sasa facial ₹1,299; Aroma diamond facial ₹1,599; Jovees 24K gold facial ₹1,999; Lotus gold facial ₹1,200; Lotus bridal glow facial ₹1,399; VLCC tightening facial ₹1,099; Korean Glass facial ₹2,899; O3+ brightening facial (7 step) ₹2,499; O3+ glowing facial ₹2,899; Aroma acne-skin facial ₹1,499; O3+ bridal facial (11 step) ₹3,599; Shahnaz anti-aging facial ₹1,500; Hydra facial with machine ₹3,499; tightening mask ₹399; whitening mask ₹399; Sasa gold facial ₹1,400. Existing Hydra facial ₹1,499 remains. |
| Basic facials | Herbal ₹700; Fruit ₹600; VLCC ₹800; VLCC anti-tan ₹1,000; Lotus herbal ₹1,000; Aroma anti-tan ₹1,200; Aroma pearl ₹800; VLCC anti-aging ₹1,200; VLCC diamond ₹1,100; VLCC Insta Glow ₹1,000; Jovees pigmentation ₹1,500. |
| Cleanups | Basic ₹500; Fruit ₹600; VLCC ₹800; Lotus herbal ₹700; Aroma D-tan ₹1,000; Acne skin ₹1,200; Lotus gold ₹800; Lotus diamond ₹1,800; VLCC Insta Glow ₹1,800; Aroma diamond ₹1,000; Mixed fruit ₹800; O3+ ₹1,200; O3+ whitening ₹1,200; Hydra ₹2,200; Sasa ₹800. |
| Body polishing | Full body ₹5,000; full hand ₹1,200; full leg ₹2,000; full back ₹1,000; half back ₹750; full tummy ₹1,000; underarms ₹700; neck ₹600. |
| Hydra (premium) bleach | Full face ₹400; full hand ₹600; half hand ₹400; full leg ₹1,800; half leg ₹600; full back ₹500; half back ₹350; full body ₹3,500. |
| Korean bleach | Full face ₹650; full hand ₹1,200; half hand ₹600; full leg ₹1,200; half leg ₹800; full back ₹1,000; half back ₹650; underarms ₹350; feet ₹400; full tummy ₹650; half tummy ₹900; full neck ₹900; full body ₹5,500. The half-tummy amount is legible but unusual beside the full-tummy amount; it is marked for owner confirmation. |
| D-tan | Full face ₹500; full hand ₹600; half hand ₹400; full leg ₹1,000; half leg ₹550; full back ₹1,000; half back ₹500; underarms ₹400; feet ₹400; full tummy ₹600; half tummy ₹400; full neck ₹900; full body ₹4,500. |
| Premium D-tan | Full face ₹500; full hand ₹800; half hand ₹600; full leg ₹1,000; half leg ₹700; full back ₹1,200; half back ₹750; underarms ₹450; feet ₹450; full tummy ₹1,000; half tummy ₹800; full body ₹5,900. |
| Regular waxing | Full hand ₹900; full leg ₹800; three-quarter leg ₹500; underarms ₹100; full back ₹600; half hand ₹200; bikini ₹2,000; full body ₹2,500; full face ₹400. |
| Rica waxing | Full leg ₹800; half leg ₹600; full hand ₹500; half hand ₹350; underarms ₹200; full back ₹1,000; half back ₹500; full body ₹3,500; bikini ₹3,000. |

## Reconciliation

“Not stated” means the supplied text does not give a value. Durations remain empty in the app; none have been inferred. The public menu currently normalizes spelling and punctuation in several service names, called out below.

The fixed-price entries have no separate original/list price or offer terms in the supplied text. For the four percentage offers (Botox, Nanoplastia, Bioplastia, and Global Hilight), the text gives a discount rate only: original/base price, final offer price, full eligibility conditions, and expiry date are not stated. The Global Hilight note says “for any lenghth”; confirm whether that is the complete condition.

| # | Category | Exact wording from supplied text | Price / offer in supplied text | Current display and review notes | Duration / PDF page(s) |
|---:|---|---|---|---|---|
| 1 | Women’s hair | Hair wash + Blow. + Blowdry (Any styles) | ₹349 | Current: “Hair wash + blow-dry (any style)”. Confirm whether “Blow” and “Blowdry” mean one styling service or separate inclusions. | Not stated / pp. 11–12; no matching ₹349 package |
| 2 | Women’s hair | Hair Cut Hair wish | ₹499 | Current: “Haircut + hair wash”. Confirm name and whether a wash is included; “wish” may be a typo. | Not stated / pp. 10–12; PDF lists cuts and wash separately |
| 3 | Women’s hair | Karatine | ₹2,499 | Current: “Keratin treatment”. Confirm spelling, treatment scope, and any length-based price condition. PDF p. 12 shows ₹4,500 starting price; p. 14 men's amount is overwritten. | Not stated / pp. 12, 14 |
| 4 | Women’s hair | Smoothning | ₹2,999 | Current: “Smoothening”. Confirm spelling and any length-based price condition. PDF p. 11 shows ₹3,999 starting price; men's price on p. 14 is overwritten. | Not stated / pp. 11, 14 |
| 5 | Women’s hair | Botox | 30% off | Current final price is not set. Base price, offer price, eligible service, and offer period are missing. PDF p. 12 shows ₹4,999 starting price, not the final discounted price. | Not stated / pp. 12, 14 |
| 6 | Women’s hair | Nanoplastia | 30% off | Current final price is not set. Base price, offer price, and offer period are missing. PDF p. 11 says “starting ₹5,999”; the offer terms are absent. | Not stated / pp. 11, 14 |
| 7 | Women’s hair | Bioplastia | 40% off | Current final price is not set. Base price, offer price, and offer period are missing. No exact entry found in the PDF. | Not stated / no exact entry found |
| 8 | Women’s hair | Karasmooth | ₹4,999 | Current display matches. Confirm spelling and any length-based price condition. No exact entry found in the PDF. | Not stated / no exact entry found |
| 9 | Women’s hair | Global Hilight (for any lenghth) | 30% off | Current: “Global highlights (any length)”. PDF p. 12 lists full highlights starting at ₹5,000; it does not confirm the offer or “any length” condition. | Not stated / p. 12 |
| 10 | Women’s hair | Global Colour | ₹1,999 | Current display normalizes capitalization. PDF p. 12 shows Global Hair Colour ₹2,500; confirm which price is current and whether it varies by length. | Not stated / p. 12 |
| 11 | Women’s hair | Balayage | ₹4,999 | Current display matches. Confirm whether the price varies by length. No exact entry found in the PDF. | Not stated / no exact entry found |
| 12 | Beauty services | Meni/Pedi (Complimentry Eyebrow) | ₹1,199 | Current: “Manicure + pedicure”; complimentary eyebrow service noted. Confirm eyebrow service wording and whether both treatments are included. PDF lists the services separately, not this package. | Not stated / pp. 9, 15 |
| 13 | Beauty services | Meni / Pedi Hair Spa / clean-Up | ₹2,499 | Current: “Manicure + pedicure + hair spa / clean-up”. Confirm whether this is one package, alternatives, or multiple inclusions. PDF lists these as separate menu sections. | Not stated / pp. 2, 5, 12, 15 |
| 14 | Beauty services | 03 facial / Meni / Pedi / full Hand/Half leg wax | ₹2,999 | Current combines these as one package. Confirm whether “03” means O3, whether manicure and pedicure are both included, and wax coverage. No matching package found. | Not stated / pp. 1, 9, 15, 16 |
| 15 | Beauty services | Hydra facial | ₹1,499 | Current display matches aside from capitalization. PDF has “Haydra” ₹1,499, “Haydra Facial With Machine” ₹3,499, and a separate “Hydra” ₹2,500 entry; confirm which service this refers to. | Not stated / pp. 1, 16 |
| 16 | Beauty services | Baby Glow Poligen (Skin Bosten treat ment) | ₹1,999 | Current: “Baby Glow Poligen (skin booster treatment)”. PDF p. 16 lists “Polagen” ₹2,000; confirm whether this is the same service and approved spelling/description. | Not stated / p. 16 |
| 17 | Beauty services | Rica wax full hand / full leg / UnderArms (Complimentary ere brow) | ₹1,499 | Current: full hand + full leg + underarms; complimentary eyebrow. PDF p. 8 lists Rica waxing by area, not this package; the underarms price is overwritten. | Not stated / p. 8 |
| 18 | Beauty services | Been face wax | ₹499 | Current preserves “Been” in quotation marks. PDF p. 3 lists face-wax areas but no “Been” service; several prices are handwritten. | Not stated / p. 3 |
| 19 | Beauty services | 03 face wax | ₹699 | Current preserves “03” in quotation marks. PDF p. 3 lists face-wax areas but no “03 face wax” package. | Not stated / p. 3 |
| 20 | Men’s services | Hair Cut/Beard/Hair Wash | ₹249 | Current: “Haircut + beard + hair wash”. PDF lists haircut and hair-wash styling separately; confirm beard inclusions and package price. | Not stated / p. 14 |
| 21 | Men’s services | Hair Cut/Beard / D-Tan | ₹399 | Current: “Haircut + beard + D-tan”. PDF lists D-tan by area, not this package; confirm beard details and D-tan scope. | Not stated / pp. 7, 14 |
| 22 | Men’s services | Hair Cut/Beard / Hair Spa | ₹699 | Current: “Haircut + beard + hair spa”. PDF lists men's hair-spa services separately; confirm package inclusions and price. | Not stated / p. 14 |
| 23 | Men’s services | Hair Cut/Beard / Dandruff Treatment | ₹799 | Current display normalizes spacing/case. PDF lists dandruff treatments separately, including amounts with handwritten edits; confirm package details and price. | Not stated / p. 14 |
| 24 | Men’s services | Hair Cut/Beard /Meni Pedi | ₹999 | Current: “Haircut + beard + manicure / pedicure”. PDF lists manicure and pedicure separately, not this package. | Not stated / pp. 14–15 |
| 25 | Men’s services | Hair Cut/Beard / Colour | ₹799 | Current: “Haircut + beard + colour”. PDF lists separate men's colour services; confirm which colour is included and any product/length conditions. | Not stated / p. 14 |
| 26 | Men’s services | Hair Cut/Shaving / Head Massage | ₹349 | Current: “Haircut + shaving + head massage”. PDF lists the haircut and head massage separately; a men's head-massage amount is obscured. | Not stated / p. 14 |
| 27 | Men’s services | Aroma Facial / D-Tan | ₹699 | Current display normalizes capitalization. PDF lists facial and D-tan services separately, not this package. | Not stated / pp. 1, 7 |
| 28 | Men’s services | 03 facial / D-Tan | ₹1,899 | Current: “03 facial + D-tan”. Confirm whether “03” means O3 and verify package inclusions. PDF lists O3 facial and D-tan separately; no matching package found. | Not stated / pp. 1, 7, 16 |
| 29 | Men’s services | Hydra facial | ₹1,499 | Current display matches aside from capitalization. PDF p. 1 shows “Hydra” ₹1,499, while p. 16 shows “Hydra” ₹2,500; confirm which service is intended. | Not stated / pp. 1, 16 |
| 30 | Men’s services | karatin | ₹1,999 | Current: “Keratin treatment”. Confirm spelling and any hair-length condition. The men's keratin price on PDF p. 14 is overwritten; p. 12 is a different women's starting price. | Not stated / pp. 12, 14 |
| 31 | Men’s services | Botox / protien treatment | ₹2,499 | Current wording is “Botox / protein treatment”. Confirm whether this is a choice of one treatment or a combined service; PDF p. 14 overwrites the men's Botox amount and lists protein hair spa separately. | Not stated / p. 14 |

## Questions for salon approval

1. Please confirm these newer-photo readings when convenient: whether the hair-spa label "Caring" is the correct service name; what the men's "Brand colour" at ₹150 means; whether "Treatment hair wash" at ₹900 is the exact service name; whether "Korean Glass" is the intended facial name; and whether Korean bleach for half tummy is ₹900. Those specific rows are marked as needing confirmation.
2. Should the other untranscribed PDF services be added to the website? They include additional facials, cleanups, body polishing, massage, colour, laser, microblading, IV drips, and device-based treatments.
3. Provide approved durations for each service intended for online booking, plus the employee roster, each employee's service eligibility, weekly hours, breaks, leave, and blocked time. Customers do not choose an employee; the server assigns one automatically.
4. Offers are deferred. Before an offer service becomes bookable, provide its final price, conditions, and dates.
5. Please confirm only the unclear names/package inclusions for services selected for booking, especially “03”, “Been”, “Poligen”, “Hair Cut Hair wish”, and combined manicure/pedicure entries.
6. If any service's accepted price depends on hair length, product quantity, or consultation, provide the exact wording guests should see. All fixed prices supplied so far remain as given.

## Safe update workflow

Handwritten prices confirmed by the salon and legible in the PDF or newer photos are included as service entries above. Where a newer photo clearly updates an existing service, it replaces the older price. Do not guess obscured PDF amounts or assign an individual rate to a differently named package. Duration values may remain null for browsing, but a service cannot be booked until its approved duration and qualified staff coverage are configured. Unresolved names, offers, packages, and unreadable prices stay out of checkout until clarified.
