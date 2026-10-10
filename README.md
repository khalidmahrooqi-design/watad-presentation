# WATAD by Al Oula

Arabic-first and English presentation website for the WATAD building system. React, TypeScript and Vite generate complete static language and case pages. Three.js loads illustrative Blender models on request.

Website: https://www.aloulaidc.om/

## Development

Use Node 24.18.0. From `web/`:

```sh
npm ci
npm run dev
```

Release checks:

```sh
npm run check
node scripts/check-qr.mjs
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
```

The Pages workflow verifies all three browser engines before deployment from `main`, then checks the published routes and release SHA. Branches under `codex/` run verification without production deployment.

## Content and visuals

- All 639 supplied photographs are hosted locally in 45 collections; gallery manifests load on demand. Main frames, arrows and five nearby thumbnail previews keep visitors inside the presentation.
- Five generated architectural concepts are labelled as illustrations.
- The company and factory sections introduce Al Oula and its Khazaen location. The sourced Emmedue production-hall photograph is labelled as a technology reference, not a photograph of the Al Oula factory.
- The elements section includes a selection of 14 supplied design-flexibility photographs with bilingual captions, arrows and thumbnails.
- Installation and test films use lazy YouTube embeds with direct viewing links. The construction-process film replaces that section's previous 3D interaction.
- Eight complete source PDFs are linked beside the relevant acoustic, fire, seismic, load, wind-impact, rainfall and lifespan information. `web/public/reports/manifest.json` records the approved files and hashes; the validator rejects unlisted PDFs and checks source integrity. Figures retain specimen and test conditions; the lifespan document is a manufacturer statement.
- The elements section uses six supplied WATAD cutaway renders, with transparent WebP images and matching preview selectors.
- The time doughnut and normalized programme bars show Al Oula’s 60% shorter construction-time comparison (100 → 40 reference units), with cost savings up to 25% depending on specifications and project size. Sound and calculated thermal values identify the specific assemblies in Emmedue Panel Specifications, Rev. 05, 01/14.
- Thermal percentages compare the stated WATAD walls with a derived international 220 mm hollow-block reference using Bahrain EWA layer properties. The expandable source note names this reference and distinguishes wall heat-transfer comparisons from cooling-energy savings. Acoustic evidence identifies the original 45 dB(A) gross test result; no unsupported percentage or STC/Rw equivalence is claimed.
- Bilingual sections, case captions and contact links: `web/src/content.ts` and `web/src/App.tsx`.
- Collection browser and evidence-labelled charts: `web/src/Gallery.tsx`, `web/src/gallery-data.json` and `web/src/Metrics.tsx`.
- Typography, surfaces and responsive layout: `web/src/style.css`.
- Approved WATAD artwork, SVG QR, icons and social cards: `web/public/brand/`.
- WebP image derivatives and illustrative GLB models: `web/public/media/` and `web/public/models/`.
- Static metadata and language routes: `web/scripts/prerender.mjs`.

The models and renders are conceptual illustrations, not project drawings or construction instructions. International references illustrate the system and are not represented as Al Oula-delivered projects. Commercial comparison figures are attributed to Al Oula; acoustic test results and calculated U-values retain their manufacturer-specification source and assembly conditions. They are not universal guarantees or measured daily assembly rates.

The WATAD logo uses the approved artwork supplied by Al Oula, delivered as WebP without redrawing. The Al Oula mark remains a vector reconstruction of the supplied presentation artwork. Brand and project-image rights remain with their respective owners. Fonts are distributed with their OFL licences. Country flags use `lipis/flag-icons` under its included MIT licence. The reference-map land geometry is Natural Earth public-domain data.

## Presentation controls

Use the bottom dock or the keyboard: `H` hides/restores controls, `P` toggles presentation, `F` toggles supported native fullscreen, and arrows move between sections. Arrow direction follows the page language. `Escape` exits presentation. Keyboard shortcuts leave local model controls and form inputs in control of their keys. The header can pause decorative motion; system reduced-motion preferences are respected.

## Updating and rollback

Build and review a change on a `codex/` branch, pass verification, then merge to `main`. Preserve language pairs and the root base path. Generate share cards with `node scripts/share-cards.mjs` while the production preview server is running, rebuild and check the output. For rollback, revert the release commit and let the same workflow deploy the previous content; do not force-push production history.

The production domain is configured in GitHub Pages settings for the Actions deployment. Keep the public origin, Vite base, QR destination, manifest and verification targets aligned when changing domains. Domain migrations also require coordinated DNS and HTTPS configuration; reverting code alone does not revert a domain migration. Legacy website routes lead to relevant catalogue sections. Product purchasing and appointment booking are replaced by contact enquiries.

The selected public reports are in `web/public/reports/`. Other source documents, source archives, editable Blender masters, local provenance and private verification records are excluded from this public repository.
