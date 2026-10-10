import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { legacyRoutes, prefixAliases } from './legacy-routes.mjs';

const site = process.env.WATAD_URL || 'https://www.aloulaidc.om/';
const expected = process.env.WATAD_EXPECT_SHA;
for (const route of [
  '',
  'ar/',
  'en/',
  'ar/cases/qatar-gardens/',
  'en/cases/oman-interior/',
  'sitemap.xml',
  'site.webmanifest',
  'brand/qr.svg',
  'brand/og-ar.webp',
  'brand/og-en.webp',
  'models/panel.glb',
  'models/building.glb',
]) {
  const r = await fetch(site + route + '?check=' + Date.now());
  if (!r.ok) throw Error(`${route}: HTTP ${r.status}`);
  if (route === '' || route.endsWith('/')) {
    const text = await r.text();
    if (route !== '') {
      if (!text.includes('property="og:image"') || !text.includes('rel="canonical"'))
        throw Error(`Missing static metadata: ${route}`);
      const canonical = text.match(/rel="canonical" href="([^"]+)"/)?.[1];
      const ogImage = text.match(/property="og:image" content="([^"]+)"/)?.[1];
      if (
        canonical !== new URL(route, site).href ||
        new URL(ogImage).origin !== new URL(site).origin
      )
        throw Error(`Wrong production metadata destination: ${route}`);
    }
    if (['', 'ar/', 'en/'].includes(route)) {
      const sectionIds = [...text.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(
        (match) => match[1],
      );
      if (
        sectionIds.length !== 17 ||
        sectionIds.slice(0, 4).join(',') !== 'hero,about-al-oula,factory,applications'
      )
        throw Error(`Wrong main section count or opening order: ${route || 'root'}`);
      const section = (id) =>
        text.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>[\\s\\S]*?<\\/section>`))?.[0] ||
        '';
      for (const [sectionId, videoId] of [
        ['construction-process', 'wa7dS2YSNvM'],
        ['performance-evidence', '4yfrkU9H2vo'],
      ]) {
        const content = section(sectionId);
        const iframe = content.match(/<iframe\b[^>]*>/)?.[0] || '';
        const src = iframe.match(/\bsrc="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
        const title = iframe.match(/\btitle="([^"]+)"/)?.[1];
        const video = src ? new URL(src) : null;
        if (
          !video ||
          video.origin !== 'https://www.youtube-nocookie.com' ||
          video.pathname !== `/embed/${videoId}` ||
          video.searchParams.get('hl') !== (route === 'en/' ? 'en' : 'ar') ||
          video.searchParams.has('autoplay') ||
          /\ballow="[^"]*autoplay/.test(iframe) ||
          !/\bloading="lazy"/.test(iframe) ||
          !/\ballowfullscreen\b/i.test(iframe) ||
          !/\breferrerpolicy="strict-origin-when-cross-origin"/i.test(iframe) ||
          !title?.trim() ||
          !content.includes(`href="https://www.youtube.com/watch?v=${videoId}"`)
        )
          throw Error(
            `Invalid video settings, title or fallback in ${sectionId}: ${route || 'root'}`,
          );
      }
      const evidenceCards = [
        ...section('performance-evidence').matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g),
      ];
      const evidenceChapters = ['', '&t=30s', '&t=146s'];
      if (
        !section('system-layers').includes('href="#performance-evidence"') ||
        evidenceCards.length !== 4 ||
        evidenceCards
          .slice(0, 3)
          .some(
            ([card], index) =>
              !card
                .replaceAll('&amp;', '&')
                .includes(
                  `href="https://www.youtube.com/watch?v=4yfrkU9H2vo${evidenceChapters[index]}"`,
                ),
          )
      )
        throw Error(`Missing contextual performance video links: ${route || 'root'}`);
    }
  }
  console.log(`Live: ${route || 'root'} ${r.status}`);
}
for (const [pathname, target] of Object.entries({ ...legacyRoutes, ...prefixAliases })) {
  const response = await fetch(new URL(`${pathname}/?check=${Date.now()}`, site));
  if (!response.ok) throw Error(`Legacy link ${pathname}: HTTP ${response.status}`);
  const html = await response.text();
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  if (!html.includes('data-watad-redirect') || canonical !== new URL(target, site).href)
    throw Error(`Wrong legacy destination: ${pathname}`);
}
console.log('Live: legacy website links and former repository routes verified.');
const collections = JSON.parse(
  await readFile(new URL('../src/gallery-data.json', import.meta.url)),
);
let photoCount = 0;
for (const collection of collections) {
  const response = await fetch(`${site}galleries/${collection.id}.json?check=${Date.now()}`);
  if (!response.ok) throw Error(`Gallery ${collection.id}: HTTP ${response.status}`);
  const data = await response.json();
  if (data.id !== collection.id || data.images.length !== collection.count)
    throw Error(`Gallery count mismatch: ${collection.id}`);
  photoCount += data.images.length;
  for (const path of [collection.cover, data.images[0].src]) {
    const assetResponse = await fetch(site + path, { method: 'HEAD' });
    if (!assetResponse.ok || !assetResponse.headers.get('content-type')?.includes('image/webp'))
      throw Error(`Gallery asset unavailable: ${path}`);
  }
}
if (photoCount !== 639) throw Error(`Expected 639 photos, found ${photoCount}`);
for (const concept of [
  'comfort',
  'applications',
  'partnership',
  'evidence',
  'comparison',
  'planning',
]) {
  const path = `media/concept-${concept}-w1600.webp`;
  const response = await fetch(site + path, { method: 'HEAD' });
  if (!response.ok || !response.headers.get('content-type')?.includes('image/webp'))
    throw Error(`Concept asset unavailable: ${path}`);
}
console.log(
  `Live: ${collections.length} galleries, ${photoCount} photos and six concepts verified.`,
);
const factoryResponse = await fetch(`${site}galleries/mdue-production.json?check=${Date.now()}`);
if (!factoryResponse.ok) throw Error(`Factory manifest: HTTP ${factoryResponse.status}`);
const factory = await factoryResponse.json();
if (
  factory.id !== 'mdue-production' ||
  !Array.isArray(factory.images) ||
  factory.images.length !== 1
)
  throw Error('Factory manifest must contain one Emmedue production photo.');
const factoryPhoto = factory.images[0];
if (
  factoryPhoto.width !== 2000 ||
  factoryPhoto.height !== 900 ||
  !Array.isArray(factoryPhoto.srcSet) ||
  factoryPhoto.srcSet.map((variant) => variant.width).join(',') !== '640,960,2000' ||
  !['ar', 'en'].every(
    (locale) =>
      typeof factoryPhoto.caption?.[locale] === 'string' && factoryPhoto.caption[locale].trim(),
  )
)
  throw Error('Factory photo dimensions, responsive variants or bilingual captions are missing.');
const factoryAssets = new Set([
  factoryPhoto.src,
  factoryPhoto.thumb,
  ...factoryPhoto.srcSet.map((variant) => variant.src),
]);
for (const path of factoryAssets) {
  if (typeof path !== 'string' || !/^images\/factory\/[a-z0-9-]+\.webp$/.test(path))
    throw Error(`Factory asset must be a local WebP image: ${path}`);
  const response = await fetch(new URL(path, site), { method: 'HEAD' });
  if (!response.ok || !response.headers.get('content-type')?.includes('image/webp'))
    throw Error(`Factory asset unavailable: ${path}`);
}
console.log('Live: factory photo, bilingual captions and all responsive WebP variants verified.');
const elementRenders = JSON.parse(
  await readFile(new URL('../src/element-renders.json', import.meta.url)),
);
for (const [id, render] of Object.entries(elementRenders)) {
  for (const variant of ['thumb', ...render.widths.map((width) => `w${width}`)]) {
    const path = `media/element-${id}-${variant}.webp`;
    const response = await fetch(site + path, { method: 'HEAD' });
    if (!response.ok || !response.headers.get('content-type')?.includes('image/webp'))
      throw Error(`Element render unavailable: ${path}`);
  }
}
console.log('Live: all six supplied element renders and their responsive variants verified.');
const reports = JSON.parse(
  await readFile(new URL('../public/reports/manifest.json', import.meta.url)),
);
for (const report of reports) {
  const response = await fetch(site + report.file);
  if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf'))
    throw Error(`Report unavailable: ${report.id}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (
    data.length !== report.bytes ||
    createHash('sha256').update(data).digest('hex') !== report.sha256
  )
    throw Error(`Wrong live PDF: ${report.id}`);
}
const design = await (await fetch(site + 'galleries/design-flexibility.json')).json();
if (design.id !== 'design-flexibility' || design.images.length !== 14)
  throw Error('Wrong design gallery');
for (const photo of design.images) {
  if (!photo.caption.ar || !photo.caption.en) throw Error('Missing design caption');
  const response = await fetch(site + photo.src, { method: 'HEAD' });
  if (!response.ok || !response.headers.get('content-type')?.includes('image/webp'))
    throw Error(`Design image unavailable: ${photo.id}`);
}
console.log(
  `Live: ${reports.length} complete source PDFs and all 14 design-gallery WebP images verified.`,
);
const r = await fetch(site + 'release.json?check=' + Date.now());
const release = await r.json();
if (expected && release.commit !== expected)
  throw Error(`Release mismatch: wanted ${expected}, got ${release.commit}`);
console.log(`Verified live release ${release.commit}.`);
