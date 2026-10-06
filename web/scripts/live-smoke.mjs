import { readFile } from 'node:fs/promises';

const site = process.env.WATAD_URL || 'https://khalidmahrooqi-design.github.io/watad-presentation/';
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
  if (route.endsWith('/') && route !== '') {
    const text = await r.text();
    if (!text.includes('property="og:image"') || !text.includes('rel="canonical"'))
      throw Error(`Missing static metadata: ${route}`);
  }
  console.log(`Live: ${route || 'root'} ${r.status}`);
}
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
const r = await fetch(site + 'release.json?check=' + Date.now());
const release = await r.json();
if (expected && release.commit !== expected)
  throw Error(`Release mismatch: wanted ${expected}, got ${release.commit}`);
console.log(`Verified live release ${release.commit}.`);
