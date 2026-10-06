import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
let errors = [];
let bytes = 0;
let count = 0;
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
if (bytes > 100 * 1024 * 1024) errors.push('Site exceeds the initial 100 MB budget');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Validated ${count} public files, ${(bytes / 1024 / 1024).toFixed(2)} MB; static routes, metadata, models and local links passed.`,
);
