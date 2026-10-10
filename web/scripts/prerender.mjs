import fs from 'node:fs/promises';
import path from 'node:path';
import { render, cases, sections, companyName, BASE, SITE, ORIGIN } from '../.ssr/render.js';
import { legacyRoutes, prefixAliases } from './legacy-routes.mjs';
const out = path.resolve('dist');
const manifest = JSON.parse(await fs.readFile(path.join(out, '.vite/manifest.json'), 'utf8'));
const entry = manifest['index.html'];
const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
const routes = [
  { route: '', locale: 'ar' },
  { route: 'ar/', locale: 'ar' },
  { route: 'en/', locale: 'en' },
];
for (const locale of ['ar', 'en'])
  for (const c of cases) routes.push({ route: `${locale}/cases/${c.id}/`, locale, caseId: c.id });
const boot = `try{var t=localStorage.getItem('watad-theme')==='light'?'light':'dark';document.documentElement.dataset.theme=t;document.querySelector('meta[name="theme-color"]').content=t==='light'?'#e8edf2':'#17212b';document.documentElement.dataset.motion=(localStorage.getItem('watad-motion')==='paused'||matchMedia('(prefers-reduced-motion:reduce)').matches)?'paused':'active'}catch(e){}`;
for (const record of routes) {
  const { locale, caseId, route } = record;
  const c = cases.find((x) => x.id === caseId);
  const canonical = SITE + (caseId ? `${locale}/cases/${caseId}/` : `${locale}/`);
  const title = c
    ? `${c.name[locale]} | WATAD ${locale === 'ar' ? 'وتد' : 'by Al Oula'}`
    : locale === 'ar'
      ? `وتد | ${sections[0].title.ar} — ${companyName.ar}، عُمان`
      : 'WATAD | Build for lasting comfort — Al Oula, Oman';
  const description = c ? c.caption[locale] : sections[0].body[locale];
  const ar = SITE + `ar/${caseId ? `cases/${caseId}/` : ''}`,
    en = SITE + `en/${caseId ? `cases/${caseId}/` : ''}`;
  const og = SITE + `brand/og-${locale}${caseId ? '-' + caseId : ''}.webp`;
  const siteName = locale === 'ar' ? `وتد | ${companyName.ar}` : 'WATAD by Al Oula';
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': SITE + '#organization',
        name: companyName[locale],
        alternateName: companyName[locale === 'ar' ? 'en' : 'ar'],
        url: 'https://www.aloulaidc.om/',
        email: 'info@aloulaidc.om',
        logo: SITE + 'brand/al-oula.svg',
        address: { '@type': 'PostalAddress', addressCountry: 'OM' },
      },
      {
        '@type': 'WebSite',
        '@id': SITE + '#website',
        url: SITE,
        name: siteName,
        inLanguage: ['ar', 'en'],
        publisher: { '@id': SITE + '#organization' },
      },
      {
        '@type': 'WebPage',
        '@id': canonical + '#webpage',
        url: canonical,
        name: title,
        description,
        inLanguage: locale,
        isPartOf: { '@id': SITE + '#website' },
      },
    ],
  };
  const body = await render({ locale, ...(caseId ? { caseId } : {}) });
  const html = `<!doctype html><html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}" data-theme="dark" data-motion="active"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"/><meta name="robots" content="index,follow,max-image-preview:large"/>
<meta name="theme-color" content="#17212b"/>
<meta name="application-name" content="WATAD"/><meta name="mobile-web-app-capable" content="yes"/><meta name="apple-mobile-web-app-title" content="WATAD"/><meta name="apple-mobile-web-app-capable" content="yes"/><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/><meta name="format-detection" content="telephone=no"/>
<link rel="canonical" href="${canonical}"/><link rel="alternate" hreflang="ar" href="${ar}"/><link rel="alternate" hreflang="en" href="${en}"/><link rel="alternate" hreflang="x-default" href="${SITE}${caseId ? 'ar/cases/' + caseId + '/' : ''}"/>
<meta property="og:type" content="website"/><meta property="og:site_name" content="${esc(siteName)}"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(description)}"/><meta property="og:url" content="${canonical}"/><meta property="og:locale" content="${locale === 'ar' ? 'ar_OM' : 'en_GB'}"/><meta property="og:locale:alternate" content="${locale === 'ar' ? 'en_GB' : 'ar_OM'}"/><meta property="og:image" content="${og}"/><meta property="og:image:secure_url" content="${og}"/><meta property="og:image:type" content="image/webp"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="${esc(title)}"/>
<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(title)}"/><meta name="twitter:description" content="${esc(description)}"/><meta name="twitter:image" content="${og}"/><meta name="twitter:image:alt" content="${esc(title)}"/>
<link rel="icon" href="${BASE}brand/favicon.svg" type="image/svg+xml"/><link rel="icon" href="${BASE}brand/favicon.ico" sizes="any"/><link rel="icon" href="${BASE}brand/icon-32.png" type="image/png" sizes="32x32"/><link rel="icon" href="${BASE}brand/icon-16.png" type="image/png" sizes="16x16"/><link rel="apple-touch-icon" href="${BASE}brand/icon-180.png" sizes="180x180"/><link rel="mask-icon" href="${BASE}brand/pinned-tab.svg" color="#17212b"/><link rel="manifest" href="${BASE}site.webmanifest"/>
<link rel="preload" href="${BASE}fonts/${locale === 'ar' ? 'Tajawal' : 'Manrope'}.woff2" as="font" type="font/woff2" crossorigin/>${locale === 'ar' ? `<link rel="preload" href="${BASE}fonts/ArefRuqaa.woff2" as="font" type="font/woff2" crossorigin/>` : ''}
${(entry.css || []).map((file) => `<link rel="stylesheet" href="${BASE}${file}"/>`).join('')}
<script>${boot}</script><script type="application/ld+json">${JSON.stringify(jsonld).replaceAll('<', '\\u003c')}</script>
</head><body><div id="root">${body}</div><script>window.__WATAD__=${JSON.stringify({ locale, ...(caseId ? { caseId } : {}) })}</script><script type="module" src="${BASE}${entry.file}"></script><noscript><style>.model-actions,.presentation-dock,.header-controls button,.menu-button{display:none}</style></noscript></body></html>`;
  const dir = path.join(out, route);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.html'), html);
}
const canonicalPaths = new Set(routes.map((record) => BASE + record.route));
const redirects = { ...legacyRoutes, ...prefixAliases };
for (const [source, target] of Object.entries(redirects)) {
  const destination = new URL(target, ORIGIN);
  if (
    !/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]+$/.test(source) ||
    canonicalPaths.has(source + '/') ||
    destination.origin !== ORIGIN ||
    !canonicalPaths.has(destination.pathname)
  )
    throw Error(`Invalid legacy redirect: ${source} -> ${target}`);
  const preserveHash = Object.hasOwn(prefixAliases, source);
  const redirectScript = preserveHash
    ? `<script>const target=new URL(${JSON.stringify(destination.href)});if(location.hash)target.hash=location.hash;location.replace(target.href);</script>`
    : '';
  const href = esc(destination.href);
  const refresh = `<meta http-equiv="refresh" content="0;url=${href}"/>`;
  const fallback = preserveHash ? `<noscript>${refresh}</noscript>` : refresh;
  const html = `<!doctype html><html lang="en" data-watad-redirect><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>WATAD | Continue to the catalogue</title><meta name="robots" content="noindex,follow"/><link rel="canonical" href="${href}"/>${redirectScript}${fallback}</head><body style="margin:0;padding:15vh 8vw;background:#17212b;color:#f2f5f5;font:22px/1.6 Arial,sans-serif"><h1>This page has moved</h1><p>Continue to the WATAD catalogue.</p><p lang="ar" dir="rtl">انتقل إلى كتالوج نظام وتد.</p><a data-watad-redirect-target style="color:#59edc7" href="${href}">Open WATAD / افتح كتالوج وتد</a></body></html>`;
  const dir = path.join(out, source.slice(1));
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.html'), html);
}
const sitemap = routes
  .filter((r) => r.route)
  .map(
    (r) =>
      `<url><loc>${SITE + r.route}</loc><xhtml:link rel="alternate" hreflang="ar" href="${SITE + 'ar/' + (r.caseId ? 'cases/' + r.caseId + '/' : '')}"/><xhtml:link rel="alternate" hreflang="en" href="${SITE + 'en/' + (r.caseId ? 'cases/' + r.caseId + '/' : '')}"/></url>`,
  )
  .join('');
await fs.writeFile(
  path.join(out, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${sitemap}</urlset>`,
);
await fs.writeFile(
  path.join(out, '404.html'),
  `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>وتد | الصفحة غير موجودة</title></head><body style="margin:0;padding:15vh 8vw;background:#17212b;color:#f2f5f5;font:24px Arial,sans-serif"><h1>الصفحة غير موجودة</h1><p lang="en" dir="ltr">This page could not be found.</p><a style="color:#59edc7" href="${BASE}">العودة إلى وتد / Return to WATAD</a></body></html>`,
);
await fs.writeFile(path.join(out, '.nojekyll'), '');
await fs.writeFile(
  path.join(out, 'release.json'),
  JSON.stringify({
    commit: process.env.GITHUB_SHA || 'local',
    built: new Date().toISOString(),
    routes: routes.map((r) => BASE + r.route),
  }),
);
await fs.rm(path.join(out, '.vite'), { recursive: true, force: true });
console.log(
  `Prerendered ${routes.length} Arabic/English documents, ${Object.keys(redirects).length} legacy redirects, sitemap and 404.`,
);
