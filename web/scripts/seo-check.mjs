const decode = (value = '') =>
  value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (entity, code) => {
    if (code[0] === '#')
      return String.fromCodePoint(
        code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1)),
      );
    return { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' }[code.toLowerCase()] || entity;
  });
const plain = (html = '') =>
  decode(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
const tags = (html, name) =>
  [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(([tag]) => tag);
const attr = (tag, name) =>
  decode(tag?.match(new RegExp(`(?:\\s|^)${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2]);
const withAttr = (html, tag, name, value) =>
  tags(html, tag).filter((item) => attr(item, name).toLowerCase() === value.toLowerCase());
const hasType = (item, type) => [item?.['@type']].flat().includes(type);

// Inspect the published documents as a crawler receives them, independently of the render code.
export async function auditSeo({ readText, site = 'https://www.aloulaidc.om/' }) {
  const errors = [];
  const fail = (message) => errors.push(`SEO: ${message}`);
  const origin = new URL(site).origin;
  const urlOf = (value, base = site) => {
    try {
      return new URL(value, base).href;
    } catch {
      return '';
    }
  };
  const [robots, sitemap] = await Promise.all([readText('robots.txt'), readText('sitemap.xml')]);
  const directives = robots
    .split(/\r?\n/)
    .map((line) => line.split('#')[0].trim())
    .filter(Boolean);
  if (
    !directives.some((line) => /^user-agent:\s*\*$/i.test(line)) ||
    !directives.some((line) => /^allow:\s*\/$/i.test(line)) ||
    directives.some((line) => /^disallow:\s*\S/i.test(line))
  )
    fail('robots.txt must allow public crawling.');
  if (!directives.some((line) => line.replace(/^sitemap:\s*/i, '') === site + 'sitemap.xml'))
    fail('robots.txt must advertise the absolute production sitemap.');

  const entries = [...sitemap.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/g)].map(([, xml]) => ({
    xml,
    url: decode(xml.match(/<loc>([^<]+)<\/loc>/)?.[1]),
  }));
  const urls = entries.map((entry) => entry.url);
  if (urls.length !== 14 || new Set(urls).size !== 14)
    fail('sitemap must contain 14 distinct canonical Arabic/English pages.');
  if (
    urls.some(
      (url) =>
        !url.startsWith(site) ||
        !/^\/(ar|en)\/(?:cases\/[a-z0-9-]+\/)?$/.test(new URL(url).pathname) ||
        new URL(url).search ||
        new URL(url).hash,
    )
  )
    fail('sitemap includes a noncanonical or unexpected URL.');

  const pages = new Map();
  const titles = new Map();
  const descriptions = new Map();
  for (const { url, xml } of entries) {
    if (!url.startsWith(site)) continue;
    const route = url.slice(site.length);
    const [locale] = route.split('/');
    const suffix = route.replace(/^(ar|en)\//, '');
    if (!['ar', 'en'].includes(locale)) continue;
    const html = await readText(route);
    const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
    pages.set(url, { html, body });
    const htmlTag = tags(html, 'html')[0];
    if (
      attr(htmlTag, 'lang') !== locale ||
      attr(htmlTag, 'dir') !== (locale === 'ar' ? 'rtl' : 'ltr')
    )
      fail(`${route}: document language/direction does not match its URL.`);
    const canonical = withAttr(html, 'link', 'rel', 'canonical');
    if (canonical.length !== 1 || attr(canonical[0], 'href') !== url)
      fail(`${route}: expected one self-referencing canonical URL.`);
    const robotsMeta = withAttr(html, 'meta', 'name', 'robots')
      .map((tag) => attr(tag, 'content'))
      .join(',');
    if (!/\bindex\b/i.test(robotsMeta) || /\b(noindex|nofollow|none)\b/i.test(robotsMeta))
      fail(`${route}: canonical page is not indexable/followable.`);
    const title = plain(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
    const description = attr(withAttr(html, 'meta', 'name', 'description')[0], 'content');
    for (const [label, value, seen] of [
      ['title', title, titles],
      ['description', description, descriptions],
    ]) {
      if (!value.trim()) fail(`${route}: missing ${label}.`);
      else if (seen.has(value)) fail(`${route}: duplicate ${label} with ${seen.get(value)}.`);
      seen.set(value, route);
    }
    const headings = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    if (headings.length !== 1 || !plain(headings[0]?.[1]))
      fail(`${route}: expected one descriptive H1.`);
    if (!suffix && (!/WATAD|وتد/i.test(title) || !/Oman|عُمان|عمان/i.test(title)))
      fail(`${route}: home title must identify WATAD and Oman.`);
    for (const language of ['ar', 'en']) {
      const expected = site + language + '/' + suffix;
      const alternate = withAttr(html, 'link', 'hreflang', language);
      const sitemapAlternate = withAttr(xml, 'xhtml:link', 'hreflang', language);
      if (!urls.includes(expected)) fail(`${route}: missing ${language} counterpart in sitemap.`);
      if (
        alternate.length !== 1 ||
        attr(alternate[0], 'rel') !== 'alternate' ||
        attr(alternate[0], 'href') !== expected
      )
        fail(`${route}: incorrect ${language} HTML alternate.`);
      if (sitemapAlternate.length !== 1 || attr(sitemapAlternate[0], 'href') !== expected)
        fail(`${route}: incorrect ${language} sitemap alternate.`);
    }
    const defaultAlternate = withAttr(html, 'link', 'hreflang', 'x-default');
    if (
      defaultAlternate.length !== 1 ||
      attr(defaultAlternate[0], 'href') !== site + 'ar/' + suffix
    )
      fail(`${route}: x-default must use the Arabic canonical counterpart.`);

    const graph = [];
    for (const [, attributes, json] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (attr(' ' + attributes, 'type') !== 'application/ld+json') continue;
      try {
        const value = JSON.parse(json);
        graph.push(...(Array.isArray(value) ? value : value['@graph'] || [value]));
      } catch {
        fail(`${route}: invalid JSON-LD.`);
      }
    }
    const resolve = (item) =>
      item?.['@type'] ? item : graph.find((node) => node['@id'] === item?.['@id']);
    const organization = graph.find((item) => hasType(item, 'Organization'));
    const website = graph.find((item) => hasType(item, 'WebSite'));
    const webpage = graph.find((item) => hasType(item, 'WebPage') && item.url === url);
    if (
      !organization?.name ||
      organization.url !== site ||
      !website?.name ||
      website.url !== site ||
      resolve(website?.publisher) !== organization ||
      !webpage ||
      resolve(webpage.isPartOf) !== website ||
      webpage.inLanguage !== locale
    )
      fail(`${route}: Organization, WebSite and localized WebPage must form a connected graph.`);
    const image = resolve(webpage?.primaryImageOfPage);
    const imageUrl = image?.contentUrl || image?.url;
    if (
      !hasType(image, 'ImageObject') ||
      !imageUrl?.startsWith(origin + '/') ||
      !/\.webp$/.test(imageUrl) ||
      !tags(body, 'img').some(
        (tag) =>
          urlOf(attr(tag, 'src'), url) === imageUrl &&
          attr(tag, 'alt').trim() &&
          Number(attr(tag, 'width')) >= 480,
      )
    )
      fail(
        `${route}: primary ImageObject must match a descriptive full-size image in static HTML.`,
      );
    if (suffix) {
      const breadcrumb =
        resolve(webpage?.breadcrumb) || graph.find((item) => hasType(item, 'BreadcrumbList'));
      const crumbs = breadcrumb?.itemListElement || [];
      const navs = [...body.matchAll(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gi)].map(([, nav]) => nav);
      if (
        crumbs.length < 2 ||
        !crumbs.every((crumb, i) => crumb.position === i + 1 && crumb.name?.trim()) ||
        !navs.some((nav) =>
          crumbs.every(
            (crumb, i) =>
              plain(nav).includes(plain(crumb.name)) &&
              (i === crumbs.length - 1 ||
                tags(nav, 'a').some(
                  (tag) =>
                    urlOf(attr(tag, 'href'), url) ===
                    urlOf(typeof crumb.item === 'object' ? crumb.item['@id'] : crumb.item, url),
                )),
          ),
        )
      )
        fail(`${route}: breadcrumb schema must match the visible navigation.`);
    }
  }
  for (const locale of ['ar', 'en']) {
    const home = pages.get(site + locale + '/');
    const caseUrls = urls.filter((url) => url.startsWith(site + locale + '/cases/'));
    const links = tags(home?.body || '', 'a').map((tag) =>
      urlOf(attr(tag, 'href'), site + locale + '/'),
    );
    if (!home || caseUrls.length !== 6 || caseUrls.some((url) => !links.includes(url)))
      fail(`${locale}/: all six case studies must be discoverable through real homepage links.`);
  }
  return { errors, pages: pages.size };
}
