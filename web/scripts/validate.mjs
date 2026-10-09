import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root = path.resolve('dist');
let errors = [];
let bytes = 0;
let count = 0;
const checkedWidths = new Map();
async function checkWidth(src, width) {
  const file = path.join(root, src.replace(/^\/watad-presentation\//, ''));
  let actual = checkedWidths.get(file);
  if (!actual) {
    actual = (await sharp(file).metadata()).width;
    checkedWidths.set(file, actual);
  }
  if (actual !== width)
    errors.push(`Image width descriptor ${width} differs from ${actual}: ${src}`);
}
async function walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, e.name);
    if (e.isDirectory()) await walk(file);
    else {
      const stat = await fs.stat(file);
      bytes += stat.size;
      count++;
      const rel = path.relative(root, file);
      if (/\.(pdf|blend|ttf|jpe?g|map|log)$/i.test(rel))
        errors.push(`Unexpected public file: ${rel}`);
      if (/\.(html|js|json|svg|css|xml)$/.test(file)) {
        const text = await fs.readFile(file, 'utf8');
        if (/\/(?:Users|home)\/[\w.-]+\//.test(text) || /OneDrive-[\w-]+\//.test(text))
          errors.push(`Private path in ${rel}`);
        if (rel.endsWith('index.html')) {
          for (const set of text.matchAll(/srcset="([^"]+)"/gi)) {
            for (const entry of set[1].split(',')) {
              const match = entry.trim().match(/^(\S+) (\d+)w$/);
              if (match) await checkWidth(match[1], Number(match[2]));
            }
          }
          for (const pattern of [
            '<meta property="og:image"',
            'hreflang="ar"',
            'hreflang="en"',
            'rel="canonical"',
            'application/ld+json',
          ])
            if (!text.includes(pattern)) errors.push(`Missing ${pattern} in ${rel}`);
          if (text.match(/<h1[ >]/g)?.length !== 1) errors.push(`Expected one H1 in ${rel}`);
          for (const src of text.matchAll(/(?:src|href)="(\/watad-presentation\/[^"#?]+)"/g)) {
            const target = path.join(root, src[1].slice('/watad-presentation/'.length));
            try {
              await fs.access(target);
            } catch {
              errors.push(`Missing link ${src[1]} in ${rel}`);
            }
          }
        }
      }
    }
  }
}
await walk(root);
const elementRenders = JSON.parse(await fs.readFile('src/element-renders.json', 'utf8'));
for (const [id, render] of Object.entries(elementRenders)) {
  for (const width of render.widths) {
    const src = `media/element-${id}-w${width}.webp`;
    await checkWidth(src, width);
    const meta = await sharp(path.join(root, src)).metadata();
    if (!meta.hasAlpha) errors.push(`Element transparency missing: ${src}`);
  }
  const thumbnail = await sharp(path.join(root, `media/element-${id}-thumb.webp`)).metadata();
  if (thumbnail.width !== 160 || !thumbnail.hasAlpha)
    errors.push(`Invalid element thumbnail: ${id}`);
}
for (const locale of ['ar', 'en']) {
  const text = await fs.readFile(path.join(root, locale, 'index.html'), 'utf8');
  const count = (text.match(/<section /g) || []).length;
  if (count !== 15) errors.push(`${locale}: expected 15 sections, got ${count}`);
}
for (const file of ['panel.glb', 'elements.glb', 'building.glb']) {
  const p = path.join(root, 'models', file);
  try {
    const b = await fs.readFile(p);
    if (b.toString('utf8', 0, 4) !== 'glTF') errors.push(`Invalid model: ${file}`);
    if (b.length > 8 * 1024 * 1024) errors.push(`Oversized model: ${file}`);
  } catch {
    errors.push(`Missing model: ${file}`);
  }
}
const scanImages = async (dir) => {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await scanImages(p);
    else if (e.name === 'index.html') {
      const text = await fs.readFile(p, 'utf8');
      const image = text.match(/property="og:image" content="([^"]+)"/)?.[1];
      if (image) {
        const relative = image.split('/watad-presentation/')[1];
        try {
          await fs.access(path.join(root, relative));
        } catch {
          errors.push(`Missing OG image for ${path.relative(root, p)}`);
        }
      }
    }
  }
};
await scanImages(root);
// The full 639-photo library is lazy loaded; this is the deployment artifact budget.
if (bytes > 350 * 1024 * 1024) errors.push('Site exceeds the 350 MB full-library budget');
const collections = JSON.parse(await fs.readFile('src/gallery-data.json', 'utf8'));
let photos = 0;
const photoIds = new Set();
for (const collection of collections) {
  const gallery = JSON.parse(
    await fs.readFile(path.join(root, 'galleries', collection.id + '.json'), 'utf8'),
  );
  if (gallery.id !== collection.id || gallery.images.length !== collection.count)
    errors.push('Gallery mismatch: ' + collection.id);
  for (const photo of gallery.images) {
    photos++;
    if (photoIds.has(photo.id)) errors.push('Duplicate gallery ID: ' + photo.id);
    photoIds.add(photo.id);
    for (const src of [photo.src, photo.thumb, ...photo.srcSet.map((s) => s.src)]) {
      if (!src.startsWith('media/gallery/') || !src.endsWith('.webp') || src.includes('..'))
        errors.push('Invalid gallery asset: ' + src);
      try {
        await fs.access(path.join(root, src));
      } catch {
        errors.push('Missing gallery asset: ' + src);
      }
    }
    if (!(photo.width > 0 && photo.height > 0))
      errors.push('Invalid image dimensions: ' + photo.id);
    for (const variant of photo.srcSet) await checkWidth(variant.src, variant.width);
  }
}
if (photos !== 639) errors.push('Expected 639 gallery photos, got ' + photos);
console.log('Gallery coverage: ' + photos + ' photos in ' + collections.length + ' collections.');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Validated ${count} public files, ${(bytes / 1024 / 1024).toFixed(2)} MB; static routes, metadata, models and local links passed.`,
);
