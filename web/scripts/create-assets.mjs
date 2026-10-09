import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import QRCode from 'qrcode';
import sharp from 'sharp';
const root = path.resolve(import.meta.dirname, '..');
const brand = path.join(root, 'public/brand');
await fs.mkdir(brand, { recursive: true });
const approvedLogoPath = path.join(brand, 'watad-approved.webp');
// Pass the approved PNG to refresh the web derivative; normal runs use that derivative.
if (process.argv[2]) {
  const source = await fs.readFile(process.argv[2]);
  const digest = createHash('sha256').update(source).digest('hex');
  if (digest !== 'd05ba87de6fde27611a0a2f8e6e56c5aa01518fdb8d40af7d54800350f8783b8')
    throw new Error('The source does not match the approved WATAD logo.');
  await sharp(source).webp({ lossless: true, effort: 6 }).toFile(approvedLogoPath);
}
const approvedLogo = await fs.readFile(approvedLogoPath);
const metadata = await sharp(approvedLogo).metadata();
const aspectRatio = metadata.width / metadata.height;
for (const width of [320, 640]) {
  await sharp(approvedLogo)
    .resize({ width })
    .webp({ lossless: true, effort: 6 })
    .toFile(path.join(brand, `watad-approved-w${width}.webp`));
}
const embeddedLogo = async (width) =>
  `data:image/webp;base64,${(
    await sharp(approvedLogo).resize({ width }).webp({ lossless: true }).toBuffer()
  ).toString('base64')}`;
const iconWidth = 90;
const iconHeight = iconWidth / aspectRatio;
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/><image href="${await embeddedLogo(512)}" x="${(100 - iconWidth) / 2}" y="${(100 - iconHeight) / 2}" width="${iconWidth}" height="${iconHeight}" preserveAspectRatio="xMidYMid meet"/></svg>`;
await fs.writeFile(path.join(brand, 'favicon.svg'), mark);
const pngs = {};
for (const size of [16, 32, 48, 180, 192, 512]) {
  const width = Math.round(size * 0.9);
  const logo = await sharp(approvedLogo).resize({ width }).png().toBuffer();
  const b = await sharp({
    create: { width: size, height: size, channels: 3, background: '#fff' },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
  pngs[size] = b;
  await fs.writeFile(path.join(brand, `icon-${size}.png`), b);
}
// Keep all artwork inside the central 80% circle used by maskable app icons.
await sharp({ create: { width: 512, height: 512, channels: 3, background: '#fff' } })
  .composite([
    {
      input: await sharp(approvedLogo).resize({ width: 348 }).png().toBuffer(),
      gravity: 'centre',
    },
  ])
  .png()
  .toFile(path.join(brand, 'icon-512-maskable.png'));
const sizes = [16, 32, 48];
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const p = 6 + i * 16;
  header[p] = size;
  header[p + 1] = size;
  header.writeUInt16LE(1, p + 4);
  header.writeUInt16LE(32, p + 6);
  header.writeUInt32LE(pngs[size].length, p + 8);
  header.writeUInt32LE(offset, p + 12);
  offset += pngs[size].length;
});
await fs.writeFile(
  path.join(brand, 'favicon.ico'),
  Buffer.concat([header, ...sizes.map((s) => pngs[s])]),
);
// The monochrome pinned-tab utility remains separate from the approved colour artwork.
const site = 'https://khalidmahrooqi-design.github.io/watad-presentation/';
const qr = QRCode.create(site, { errorCorrectionLevel: 'H' });
const n = qr.modules.size;
const pitch = 8;
const margin = 4;
const edge = (n + margin * 2) * pitch;
let cells = '';
for (let y = 0; y < n; y++)
  for (let x = 0; x < n; x++) {
    const finder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    if (!finder && qr.modules.get(y, x))
      cells += `<rect x="${(x + margin) * pitch}" y="${(y + margin) * pitch}" width="8" height="8" rx="1.2"/>`;
  }
for (const [x, y] of [
  [0, 0],
  [n - 7, 0],
  [0, n - 7],
]) {
  const left = (x + margin) * pitch,
    top = (y + margin) * pitch;
  cells += `<rect x="${left}" y="${top}" width="56" height="56"/><rect x="${left + 8}" y="${top + 8}" width="40" height="40" fill="#fff"/><rect x="${left + 16}" y="${top + 16}" width="24" height="24"/>`;
}
const logoWidth = edge * 0.17,
  logoHeight = logoWidth / aspectRatio,
  cx = edge / 2,
  cy = edge / 2;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${edge} ${edge}" role="img" aria-label="WATAD presentation QR code"><rect width="${edge}" height="${edge}" fill="#fff"/><g fill="#142d36">${cells}</g><rect x="${cx - logoWidth / 2 - 5}" y="${cy - logoHeight / 2 - 5}" width="${logoWidth + 10}" height="${logoHeight + 10}" rx="5" fill="#fff"/><image href="${await embeddedLogo(256)}" x="${cx - logoWidth / 2}" y="${cy - logoHeight / 2}" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMidYMid meet"/></svg>`;
await fs.writeFile(path.join(brand, 'qr.svg'), svg);
await fs.writeFile(
  path.join(root, 'public/site.webmanifest'),
  JSON.stringify(
    {
      name: 'وتد | الشركة الأولى للاستثمار والتطوير',
      short_name: 'WATAD',
      id: '/watad-presentation/',
      start_url: '/watad-presentation/',
      scope: '/watad-presentation/',
      display: 'standalone',
      background_color: '#17212b',
      theme_color: '#17212b',
      lang: 'ar',
      dir: 'rtl',
      icons: [
        { src: 'brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: 'brand/icon-512-maskable.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    null,
    2,
  ),
);
console.log('Approved WebP logo, branded SVG QR, SVG/ICO/PNG icons and manifest generated.');
