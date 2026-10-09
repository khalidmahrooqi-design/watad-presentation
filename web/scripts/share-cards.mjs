import { chromium } from '@playwright/test';
import path from 'node:path';
import { cases, sections, companyName, BASE } from '../.ssr/render.js';
const local = process.env.WATAD_PREVIEW || 'http://127.0.0.1:4173';
const esc = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
try {
  await page.goto(local + BASE + 'en/');
  for (const locale of process.env.WATAD_SHARE_LOCALE
    ? [process.env.WATAD_SHARE_LOCALE]
    : ['ar', 'en'])
    for (const item of [null, ...cases]) {
      const title = item ? item.name[locale] : sections[0].title[locale];
      const photo = item || cases[0];
      const detail = item
        ? `${item.country[locale]} · ${item.use[locale]}`
        : locale === 'ar'
          ? 'تقنية إيطالية وتصنيع في عُمان. استكشف نظام وتد.'
          : 'Italian technology. Manufacturing in Oman. Explore WATAD.';
      await page.setContent(`<!doctype html><html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><head><style>
@font-face{font-family:Manrope;src:url('${local + BASE}fonts/Manrope.woff2');font-weight:200 800}@font-face{font-family:Ruqaa;src:url('${local + BASE}fonts/ArefRuqaa.woff2');font-weight:700}@font-face{font-family:Tajawal;src:url('${local + BASE}fonts/Tajawal.woff2');font-weight:400}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#17212b;color:#f1f5f5;font-family:${locale === 'ar' ? 'Tajawal' : 'Manrope'};display:grid;grid-template-columns:1.05fr .95fr;gap:32px;padding:46px}h1{font-family:${locale === 'ar' ? 'Ruqaa' : 'Manrope'};font-size:${locale === 'ar' ? '66' : '53'}px;line-height:${locale === 'ar' ? '1.45' : '1.15'};margin:25px 0 20px;font-weight:700}p{font-size:25px;line-height:1.65;color:#b6c6d2;margin:0 0 20px}.logo{width:120px;height:67px;object-fit:contain;background:#f2f5f5;border-radius:12px;padding:7px}.copy{display:flex;flex-direction:column;justify-content:center}.photo{padding:10px;box-shadow:15px 15px 36px #0a1118,-10px -10px 30px #263a48;background:#243441;border-radius:38px;height:538px}.photo img{width:100%;height:100%;object-fit:cover;border-radius:29px}.cta{font-size:23px;color:#59edc7;margin-top:20px}.line{width:55px;height:4px;background:#59edc7;margin-top:25px}.footer{font-family:${locale === 'ar' ? 'Tajawal' : 'Manrope'};font-size:17px;color:#b6c6d2;direction:${locale === 'ar' ? 'rtl' : 'ltr'};margin-top:27px}</style></head><body><div class="copy"><img class="logo" src="${local + BASE}brand/watad-approved-w640.webp"/><div class="line"></div><h1>${esc(title)}</h1><p>${esc(detail)}</p><span class="cta">${locale === 'ar' ? 'من فكرة البناء إلى تفاصيل التنفيذ' : 'From building concept to construction detail'}</span><span class="footer">${locale === 'ar' ? esc(companyName.ar) + ' · عُمان' : 'WATAD by Al Oula · Oman'}</span></div><div class="photo"><img src="${local + BASE}media/${photo.image}-w${Math.min(1600, photo.width)}.webp"/></div></body></html>`);
      await page.evaluate(() => Promise.all(Array.from(document.fonts).map((f) => f.load())));
      await page.evaluate(() => document.fonts.ready);
      await page.locator('.photo img').evaluate((img) => img.decode());
      const file = path.resolve(`public/brand/og-${locale}${item ? '-' + item.id : ''}.webp`);
      await page.screenshot({ path: file, type: 'webp', quality: 90 });
    }
  console.log(
    `Generated ${(process.env.WATAD_SHARE_LOCALE ? 1 : 2) * (cases.length + 1)} WebP social cards with verified font loading.`,
  );
} finally {
  await browser.close();
}
