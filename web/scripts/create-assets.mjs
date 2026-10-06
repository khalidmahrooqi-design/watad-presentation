import fs from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';
import sharp from 'sharp';
const root = path.resolve(import.meta.dirname, '..');
const brand = path.join(root, 'public/brand');
await fs.mkdir(brand, { recursive: true });
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#17212b"/><g fill="none" stroke="#59edc7" stroke-width="7" stroke-linejoin="round"><path d="m21 37 29-15 29 15-29 15Z"/><path d="m21 51 29 15 29-15M21 65l29 15 29-15"/></g></svg>`;
await fs.writeFile(path.join(brand, 'favicon.svg'), mark);
const pngs = {};
for (const size of [16, 32, 48, 180, 192, 512]) {
  const b = await sharp(Buffer.from(mark)).resize(size, size).png().toBuffer();
  pngs[size] = b;
  await fs.writeFile(path.join(brand, `icon-${size}.png`), b);
}
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
const mono = mark.replace(/<rect[^>]*\/>/, '').replaceAll('#59edc7', '#000');
await fs.writeFile(path.join(brand, 'pinned-tab.svg'), mono);
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
const original = await fs.readFile(path.join(brand, 'watad.svg'), 'utf8');
const inner = original
  .replace(/<\?xml[^>]*>/g, '')
  .replace(/<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');
const logoWidth = edge * 0.17,
  logoHeight = (logoWidth * 172) / 309,
  cx = edge / 2,
  cy = edge / 2;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${edge} ${edge}" role="img" aria-label="WATAD presentation QR code"><rect width="${edge}" height="${edge}" fill="#fff"/><g fill="#142d36">${cells}</g><rect x="${cx - logoWidth / 2 - 5}" y="${cy - logoHeight / 2 - 5}" width="${logoWidth + 10}" height="${logoHeight + 10}" rx="5" fill="#fff"/><g transform="translate(${cx - logoWidth / 2},${cy - logoHeight / 2}) scale(${logoWidth / 309})">${inner}</g></svg>`;
await fs.writeFile(path.join(brand, 'qr.svg'), svg);
await fs.writeFile(
  path.join(root, 'public/site.webmanifest'),
  JSON.stringify(
    {
      name: 'WATAD by Al Oula | وتد',
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
        { src: 'brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  ),
);
console.log('SVG QR, SVG/ICO/PNG icon family and manifest generated.');
