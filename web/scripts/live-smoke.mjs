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
const r = await fetch(site + 'release.json?check=' + Date.now());
const release = await r.json();
if (expected && release.commit !== expected)
  throw Error(`Release mismatch: wanted ${expected}, got ${release.commit}`);
console.log(`Verified live release ${release.commit}.`);
