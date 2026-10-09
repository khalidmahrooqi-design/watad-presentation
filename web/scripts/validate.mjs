import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { legacyRoutes, prefixAliases } from './legacy-routes.mjs';
const root = path.resolve('dist');
const origin = 'https://www.aloulaidc.om';
const redirects = { ...legacyRoutes, ...prefixAliases };
const checkedRedirects = new Set();
let errors = [];
let bytes = 0;
let count = 0;
const checkedWidths = new Map();
const attr = (tag, name) => tag?.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
const tagWith = (html, tag, attribute, value) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))]
    .map(([match]) => match)
    .find((match) => attr(match, attribute)?.toLowerCase() === value.toLowerCase());
function localFile(src, documentPath = '/') {
  const url = new URL(src, origin + documentPath);
  if (url.origin !== origin) throw new Error(`Expected a local URL: ${src}`);
  const file = path.resolve(root, decodeURIComponent(url.pathname).replace(/^\/+/, ''));
  if (file !== root && !file.startsWith(root + path.sep))
    throw new Error(`Public path escapes dist: ${src}`);
  return { file, url };
}
async function checkLocalLink(src, rel) {
  const documentPath =
    '/' +
    rel
      .replace(/index\.html$/, '')
      .split(path.sep)
      .join('/');
  try {
    const { file, url } = localFile(src, documentPath);
    const stat = await fs.stat(file);
    const destination = stat.isDirectory() ? path.join(file, 'index.html') : file;
    await fs.access(destination);
    if (url.hash && destination.endsWith('.html')) {
      const text = await fs.readFile(destination, 'utf8');
      const id = decodeURIComponent(url.hash.slice(1));
      if (![...text.matchAll(/\bid=["']([^"']+)["']/g)].some((match) => match[1] === id))
        errors.push(`Missing destination #${id}: ${src} in ${rel}`);
    }
  } catch (error) {
    errors.push(`Invalid local link ${src} in ${rel}: ${error.message}`);
  }
}
async function checkRedirect(html, rel) {
  const route = '/' + path.dirname(rel).split(path.sep).join('/');
  const target = redirects[route];
  if (!target) {
    errors.push(`Unmapped redirect document: ${rel}`);
    return;
  }
  checkedRedirects.add(route);
  const expected = origin + target;
  const canonical = attr(tagWith(html, 'link', 'rel', 'canonical'), 'href');
  const refresh = attr(tagWith(html, 'meta', 'http-equiv', 'refresh'), 'content');
  const fallback = html.match(/<a\b[^>]*\bdata-watad-redirect-target\b[^>]*>[\s\S]*?<\/a>/i)?.[0];
  if (canonical !== expected) errors.push(`Incorrect redirect canonical in ${rel}`);
  if (refresh !== `0;url=${expected}`) errors.push(`Incorrect redirect refresh in ${rel}`);
  if (attr(fallback, 'href') !== expected || !fallback?.replace(/<[^>]+>/g, '').trim())
    errors.push(`Missing usable redirect fallback in ${rel}`);
  if (!target.startsWith('/') || target.startsWith('//'))
    errors.push(`Redirect target must be a local path in ${rel}`);
  await checkLocalLink(target, rel);
}
async function checkWidth(src, width) {
  const { file } = localFile(src);
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
          if (/<html\b[^>]*\bdata-watad-redirect(?:\s|=|>)/i.test(text)) {
            await checkRedirect(text, rel);
            continue;
          }
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
          const canonical = attr(tagWith(text, 'link', 'rel', 'canonical'), 'href');
          const expectedPath =
            rel === 'index.html' ? '/ar/' : '/' + rel.replace(/index\.html$/, '');
          if (canonical !== origin + expectedPath) errors.push(`Incorrect canonical in ${rel}`);
          if (attr(tagWith(text, 'meta', 'property', 'og:url'), 'content') !== canonical)
            errors.push(`OG URL does not match canonical in ${rel}`);
          const image = attr(tagWith(text, 'meta', 'property', 'og:image'), 'content');
          if (!image?.startsWith(origin + '/'))
            errors.push(`OG image must use ${origin} in ${rel}`);
          else await checkLocalLink(image, rel);
          for (const [, src] of text.matchAll(/(?:src|href)="([^"]+)"/g)) {
            if (src.startsWith('/') || src.startsWith(origin + '/')) await checkLocalLink(src, rel);
          }
        }
      }
    }
  }
}
await walk(root);
for (const route of Object.keys(redirects))
  if (!checkedRedirects.has(route)) errors.push(`Missing checked redirect: ${route}`);
const webmanifest = JSON.parse(await fs.readFile(path.join(root, 'site.webmanifest'), 'utf8'));
for (const key of ['id', 'start_url', 'scope'])
  if (webmanifest[key] !== '/') errors.push(`Manifest ${key} must use the domain root`);
for (const icon of webmanifest.icons || []) await checkLocalLink(icon.src, 'index.html');
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
