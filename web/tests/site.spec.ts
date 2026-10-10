import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { legacyRoutes } from '../scripts/legacy-routes.mjs';
const publicOrigin = 'https://www.aloulaidc.om';
test('Arabic and English static content, metadata and contact actions', async ({
  page,
  request,
}) => {
  for (const locale of ['ar', 'en']) {
    const response = await request.get(`${locale}/`);
    const html = await response.text();
    expect(html).toContain('property="og:image"');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('hreflang="ar"');
    await page.goto(`${locale}/`);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator('section')).toHaveCount(17);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${publicOrigin}/${locale}/`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `${publicOrigin}/${locale}/`,
    );
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(image).toMatch(/^https:\/\/www\.aloulaidc\.om\/brand\/og-(ar|en)\.webp$/);
    const imageResponse = await request.get(new URL(image!).pathname);
    expect(imageResponse.ok()).toBe(true);
    expect(imageResponse.headers()['content-type']).toContain('image/webp');
    await expect(page.locator('#contact-card a[href^="mailto:"]').first()).toBeAttached();
    await expect(page.locator('#contact-card .qr-block')).toHaveAttribute(
      'href',
      publicOrigin + '/',
    );
  }
});
test('domain-root manifest and legacy links resolve to the intended page and section', async ({
  page,
  request,
  baseURL,
}) => {
  const manifestResponse = await request.get('/site.webmanifest');
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({ id: '/', start_url: '/', scope: '/' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    publicOrigin + '/ar/',
  );
  // Serve the new origin from the preview so absolute legacy redirects are tested before DNS cutover.
  await page.route(publicOrigin + '/**', async (route) => {
    const url = new URL(route.request().url());
    const response = await request.get(new URL(url.pathname + url.search, baseURL!).href);
    await route.fulfill({ response });
  });
  try {
    const legacy = Object.entries(legacyRoutes).find(([, destination]) =>
      destination.includes('#'),
    );
    expect(
      legacy,
      'At least one previous company route must preserve its section destination',
    ).toBeDefined();
    const [legacyPath, destination] = legacy!;
    const redirectResponse = await request.get(legacyPath + '/');
    expect(redirectResponse.ok()).toBe(true);
    expect(await redirectResponse.text()).toContain('data-watad-redirect');
    await page.goto(legacyPath + '/');
    await expect(page).toHaveURL(publicOrigin + destination);
    await expect(page.locator(new URL(destination, publicOrigin).hash)).toBeInViewport();
    await page.goto(new URL('/watad-presentation/en/#elements', baseURL!).href);
    await expect(page).toHaveURL(publicOrigin + '/en/#elements');
    await expect(page.locator('#elements')).toBeInViewport();
  } finally {
    // Finish forwarded requests before Playwright disposes the request fixture.
    await page.unrouteAll({ behavior: 'wait' });
  }
});
test('theme, motion, dock, presentation and keyboard states persist correctly', async ({
  page,
}) => {
  await page.goto('en/');
  await expect(page.locator('.presentation-dock')).toBeVisible();
  const theme = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: 'Switch theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    theme === 'dark' ? 'light' : 'dark',
  );
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    theme === 'dark' ? 'light' : 'dark',
  );
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'paused');
  await page.keyboard.press('h');
  await expect(page.locator('.presentation-dock')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Show controls (H)' })).toBeVisible();
  await page.keyboard.press('h');
  await expect(page.locator('.presentation-dock')).toBeVisible();
  await page.keyboard.press('p');
  await expect(page.locator('body')).toHaveClass(/presentation/);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/presentation/);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '2');
  await page.goto('ar/');
  await expect(page.getByRole('button', { name: 'تشغيل الحركة', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '2');
});
test('responsive geometry stays within viewport, including the dock', async ({
  page,
  browserName,
}) => {
  for (const locale of ['ar', 'en'])
    for (const width of [320, 390, 768, 1440, 3840]) {
      await page.setViewportSize({ width, height: width === 3840 ? 2160 : 900 });
      await page.goto(`${locale}/`);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.wheel(1200, 0);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const geometry = await page.evaluate(() => {
        const d = document.querySelector('.presentation-dock')!.getBoundingClientRect();
        const outside = (r: DOMRect) =>
          r.width > 0 && r.height > 0 && r.bottom > 0 && (r.left < -1 || r.right > innerWidth + 1);
        const controls = [...document.querySelectorAll('a,button,input,select')]
          .filter((e) => outside(e.getBoundingClientRect()))
          .map((e) => ({
            tag: e.tagName,
            text: e.textContent?.trim().slice(0, 70),
            rect: e.getBoundingClientRect().toJSON(),
          }));
        const text = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          const rect = range.getBoundingClientRect();
          if (outside(rect))
            text.push({ text: node.textContent.trim().slice(0, 100), rect: rect.toJSON() });
        }
        return {
          horizontalScroll: Math.abs(scrollX),
          controls,
          text,
          left: d.left,
          right: d.right,
          width: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
        };
      });
      if (geometry.documentWidth > width + 1)
        console.log('Viewport metrics:', JSON.stringify({ browserName, locale, ...geometry }));
      expect(
        geometry.horizontalScroll,
        JSON.stringify({ locale, ...geometry }),
      ).toBeLessThanOrEqual(1);
      expect(geometry.controls, 'Controls must remain fully in the viewport').toEqual([]);
      expect(geometry.text, 'Text must remain fully in the viewport').toEqual([]);
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(geometry.width + 1);
    }
});
test('all case collections stay on the page with arrows and nearby previews', async ({ page }) => {
  await page.goto('en/');
  const international = page.locator('#international-cases');
  await international.scrollIntoViewIfNeeded();
  await international.getByRole('combobox', { name: 'Choose country' }).selectOption('ph');
  await international
    .getByRole('combobox', { name: 'Choose photo collection' })
    .selectOption({ label: 'Meisters Uncorked, Laguna · Philippines · 15' });
  await expect(international.locator('.gallery-main')).toHaveClass(/loaded/);
  await expect(international.locator('.gallery')).toHaveAccessibleName(
    'Photo gallery: Meisters Uncorked, Laguna',
  );
  await expect(international.locator('.gallery-title .overline')).toHaveText('Philippines');
  await expect(international.locator('.gallery-main')).toHaveAttribute(
    'alt',
    'Meisters Uncorked, Laguna · Philippines · Photo 1',
  );
  const original = await international.locator('.gallery-main').getAttribute('src');
  await international.getByRole('button', { name: 'Next photo', exact: true }).click();
  await expect(international.locator('.gallery-main')).not.toHaveAttribute('src', original!);
  await expect(international.locator('.gallery-controls')).toContainText('2 / 15');
  await international.getByRole('button', { name: 'Show photo 4', exact: true }).click();
  await expect(international.locator('.gallery-controls')).toContainText('4 / 15');
  await international.getByRole('button', { name: 'Previous photo', exact: true }).click();
  await expect(international.locator('.gallery-controls')).toContainText('3 / 15');
  await expect(page).toHaveURL(/en\/$/);
  expect(await international.locator('a[href^="http"]').count()).toBe(0);
  for (const locale of ['ar', 'en']) {
    const ar = locale === 'ar';
    await page.goto(`${locale}/cases/philippines-restaurant/`);
    await expect(page.locator('h1')).toContainText(ar ? 'لاغونا' : 'Laguna');
    await expect(page.locator('.gallery-main')).toHaveClass(/loaded/);
    await expect(page.locator('.gallery')).toHaveAccessibleName(
      ar ? 'معرض الصور: مايسترز أنكوركد، لاغونا' : 'Photo gallery: Meisters Uncorked, Laguna',
    );
    await expect(page.locator('.gallery-title .overline')).toHaveText(
      ar ? 'الفلبين' : 'Philippines',
    );
    await expect(page.locator('main > .small-note')).toHaveText(
      ar
        ? 'مطعم Meisters Uncorked في لاغونا، الفلبين — تطبيق تجاري من مراجع النظام الدولية.'
        : 'Meisters Uncorked Restaurant in Laguna, Philippines — an international commercial system reference.',
    );
  }
  await page.getByRole('link', { name: 'Back to presentation' }).click();
  await expect(page.locator('section')).toHaveCount(17);
  await page.locator('details').first().locator('summary').click();
  await expect(page.locator('details').first()).toHaveAttribute('open', '');
  const range = page.getByRole('slider', { name: 'Separate layers' });
  await range.scrollIntoViewIfNeeded();
  await range.focus();
  const initial = await range.inputValue();
  await range.press('ArrowRight');
  expect(await range.inputValue()).not.toBe(initial);
});
test('no-JavaScript and reduced-motion versions retain content', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const p = await ctx.newPage();
  await p.goto('ar/');
  await expect(p.locator('section')).toHaveCount(17);
  await expect(p.locator('#contact-card .qr-block')).toBeAttached();
  await ctx.close();
  const reduced = await browser.newContext({ baseURL, reducedMotion: 'reduce' });
  const page = await reduced.newPage();
  await page.goto('en/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'paused');
  expect(
    await page
      .locator('.flag-object img')
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe('none');
  await reduced.close();
});
test('semantic and contrast accessibility checks on both languages/themes', async ({
  browser,
  baseURL,
}) => {
  for (const locale of ['ar', 'en'])
    for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({ baseURL });
      await context.addInitScript((t) => localStorage.setItem('watad-theme', t), theme);
      const page = await context.newPage();
      await page.goto(`${locale}/`);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.evaluate(() => document.fonts.ready);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target),
          theme,
          locale,
        })),
      ).toEqual([]);
      await context.close();
    }
});
test('native fullscreen or its visible fallback, with a working exit', async ({ page }) => {
  await page.goto('en/');
  await page.getByRole('button', { name: 'Enter fullscreen', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Boolean(document.fullscreenElement) ||
          document.querySelector('.toast')?.textContent?.includes('unavailable'),
      ),
    )
    .toBeTruthy();
  if (await page.evaluate(() => Boolean(document.fullscreenElement))) {
    await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  }
});
test('interactive models remount cleanly and preserve one canvas', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'GPU scene checks run in Chromium and the MCP session.');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('en/');
  for (const id of ['system-layers', 'sustainability']) {
    const section = page.locator('#' + id);
    await section.scrollIntoViewIfNeeded();
    await section.getByRole('button', { name: 'Explore in 3D' }).click();
    await expect(section.locator('[data-scene-status]')).toHaveAttribute(
      'data-scene-status',
      'ready',
      { timeout: 20000 },
    );
    await expect(page.locator('canvas')).toHaveCount(1);
    await section.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
test('a model request failure retains the image and contact route', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'The same model boundary is shared by all browsers.');
  await page.route('**/models/panel.glb', (r) => r.abort());
  await page.goto('en/');
  const s = page.locator('#system-layers');
  await s.scrollIntoViewIfNeeded();
  await s.getByRole('button', { name: 'Explore in 3D' }).click();
  await expect(s.locator('[data-scene-status]')).toHaveAttribute('data-scene-status', 'error');
  await expect(s.locator('.model-poster')).toBeVisible();
  await expect(page.locator('#contact-card a[href^="mailto:"]').first()).toBeAttached();
});

test('model endpoints remain reversible, including the lifted roof', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'GPU snapshots use Chromium and actual Edge.');
  await page.goto('en/');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  for (const [id, name] of [
    ['system-layers', 'Separate layers'],
    ['sustainability', 'Lift the roof'],
  ]) {
    const section = page.locator('#' + id);
    await section.scrollIntoViewIfNeeded();
    await section.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
    await expect(section.locator('[data-scene-status]')).toHaveAttribute(
      'data-scene-status',
      'ready',
    );
    const range = section.getByRole('slider', { name });
    await range.press('End');
    await expect(range).toHaveValue('100');
    const end = await section.locator('canvas').screenshot();
    await range.press('Home');
    await expect(range).toHaveValue('0');
    const start = await section.locator('canvas').screenshot();
    expect(end.equals(start), id + ' must move back from its endpoint').toBe(false);
    await range.press('End');
    const repeat = await section.locator('canvas').screenshot();
    expect(repeat.equals(start), id + ' must reopen').toBe(false);
    await section.getByRole('button', { name: 'Close', exact: true }).click();
  }
});
test('retry recovers a failed model, global H still works after local focus', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'The common scene boundary is covered in GPU browsers.');
  await page.route('**/models/panel.glb', (route) => route.abort());
  await page.goto('en/');
  const section = page.locator('#system-layers');
  await section.scrollIntoViewIfNeeded();
  await section.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
  await expect(section.locator('[data-scene-status]')).toHaveAttribute(
    'data-scene-status',
    'error',
  );
  await page.unroute('**/models/panel.glb');
  await section.getByRole('button', { name: 'Retry model' }).click();
  await expect(section.locator('[data-scene-status]')).toHaveAttribute(
    'data-scene-status',
    'ready',
  );
  await section.getByRole('button', { name: 'Reset view' }).focus();
  await page.keyboard.press('h');
  await expect(page.locator('.presentation-dock')).toHaveCount(0);
  await page.keyboard.press('h');
  await expect(page.locator('.presentation-dock')).toHaveCount(1);
  await expect(page.locator('canvas')).toHaveCount(1);
});
test('performance charts retain their arithmetic, assembly qualifiers and separate sources', async ({
  page,
}) => {
  for (const locale of ['ar', 'en']) {
    const ar = locale === 'ar';
    await page.goto(`${locale}/`);
    const section = page.locator('#project-comparison');
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator('.time-donut')).toHaveAttribute(
      'aria-label',
      ar ? /40 وحدة.*100 وحدة.*60%/ : /40 units.*100 conventional units.*60% saved/,
    );
    await expect(section.locator('.programme-chart')).toHaveAttribute(
      'aria-label',
      ar ? /100 وحدة.*40 وحدة.*60 وحدة موفرة/ : /100 units.*40 units.*60 units saved/,
    );
    await expect(section.locator('.programme-bar:not(.conventional) > span')).toHaveAttribute(
      'style',
      /width:\s*40%/,
    );
    await expect(section.getByRole('button', { name: /^(30|40)%$/ })).toHaveCount(0);
    await expect(section.locator('.small-note')).toContainText(
      ar ? 'البناء التقليدي = 100؛ وتد = 40' : 'conventional = 100; WATAD = 40',
    );
    const cards = section.locator('.metric-grid article');
    await expect(cards).toHaveCount(4);
    const cost = cards.filter({ hasText: ar ? 'توفير في التكلفة' : 'Cost savings' });
    await expect(cost.locator('strong')).toHaveText('25%');
    await expect(cost).toContainText(ar ? 'يصل إلى' : 'up to');
    await expect(cost).toContainText(
      ar ? 'حسب المواصفات وحجم المشروع' : 'Depending on specifications and project size',
    );
    const sound = cards.filter({ hasText: 'PSM90' });
    await expect(sound.locator('strong')).toHaveText('45dB(A)');
    await expect(sound).toContainText(ar ? 'خفض إجمالي مقاس' : 'gross reduction measured');
    await expect(sound).toContainText(ar ? 'جامعة تشيلي، 1998' : 'University of Chile, 1998');
    await expect(sound).toContainText(ar ? 'العينة المختبرة' : 'tested specimen');
    await expect(sound).not.toContainText('%');
    const wall = cards.filter({ hasText: 'PST200' });
    await expect(wall.locator('strong')).toHaveText('0.169W/m²K');
    await expect(wall).toContainText(
      ar ? 'للقواطع والواجهات غير الحاملة' : 'partition / curtain wall',
    );
    await expect(wall).toContainText(ar ? 'سماكة نهائية 25 سم' : '25 cm finished thickness');
    await expect(wall).toContainText(ar ? 'قيمة محسوبة' : 'Calculated value');
    await expect(wall.locator('.insulation-comparison')).toContainText('92.7%');
    await expect(wall.locator('.insulation-comparison')).toContainText(
      ar ? 'بسماكة نهائية 220 مم' : '220 mm finished hollow-block reference',
    );
    const floor = cards.filter({ hasText: 'PSSG240' });
    await expect(floor.locator('strong')).toHaveText('0.159W/m²K');
    await expect(floor).toContainText(ar ? 'قيمة محسوبة' : 'Calculated value');
    await expect(floor).not.toContainText('%');
    const source = section.locator('.metric-source');
    await expect(source).toContainText(
      ar
        ? 'مقارنة الوقت والتكلفة من الشركة الأولى للاستثمار والتطوير'
        : 'Time and cost comparison by Al Oula',
    );
    await expect(source).toContainText(
      ar
        ? 'مواصفات ألواح Emmedue، الإصدار 05، 01/14'
        : 'Emmedue Panel Specifications, Rev. 05, 01/14',
    );
    await expect(source).toContainText(
      ar ? 'الصفحات المطبوعة 8 و9 و13' : 'printed pages 8, 9 and 13',
    );
    await expect(section).not.toContainText(/January 2025|يناير 2025|5\.1%/);
    const comfort = page.locator('#comfort');
    const comfortSound = comfort
      .locator('.comfort-metric:not(#facade-acoustics)')
      .filter({ hasText: 'PSM90' });
    await expect(comfortSound).toContainText('45 dB(A)');
    await expect(comfortSound).not.toContainText('%');
    const comfortWall = comfort.locator('.comfort-metric').filter({ hasText: 'PST200' });
    await expect(comfortWall).toContainText('0.169');
    await expect(comfortWall.locator('.insulation-comparison')).toContainText('92.7%');
    await expect(comfortWall.locator('.insulation-comparison')).toContainText(
      ar ? 'بسماكة نهائية 220 مم' : '220 mm finished hollow-block reference',
    );
    const comfortFloor = comfort.locator('.comfort-metric').filter({ hasText: 'PSSG240' });
    await expect(comfortFloor).toContainText('0.159');
    await expect(comfortFloor).not.toContainText('%');
    const singleWall = comfort.locator('.small-note').filter({ hasText: 'PSM140' });
    await expect(singleWall).toContainText('0.240 W/m²K');
    await expect(singleWall).toContainText('89.6%');
    await expect(singleWall).toContainText(
      ar ? 'بسماكة نهائية 220 مم' : '220 mm finished hollow-block reference',
    );
    const reference = comfort.locator('#insulation-reference');
    await reference.locator('summary').click();
    await expect(reference).toHaveAttribute('open', '');
    await expect(reference).toContainText(ar ? '220 مم نهائياً' : '220 mm finished');
    await expect(reference.locator('.reference-formula')).toContainText('0.4327 m²K/W');
    await expect(reference.locator('.reference-formula')).toContainText('2.31 W/m²K');
    await expect(reference).toContainText(
      ar
        ? 'لا تمثل وفراً في فاتورة التكييف أو انخفاضاً في درجة حرارة الغرفة'
        : 'not cooling bills or room-temperature reduction',
    );
    await expect(reference).toContainText(
      ar ? 'انتقال الحرارة عبر الجدار فقط' : 'wall heat transfer only',
    );
    await expect(reference.locator('a')).toHaveCount(2);
    await expect(reference.locator('a').first()).toHaveAttribute(
      'href',
      'https://legacy.ewa.bh/en/Business/Documents/Thermal%20Insulation_Wall_Cross%20section%20Upload.pdf',
    );
    await expect(reference.locator('a').last()).toHaveAttribute(
      'href',
      'https://www.mdue.it/source/prove-acustiche-3.pdf',
    );
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const overflow = await page
        .locator(
          '.metric-grid article, .comfort-metric, .metric-source, #insulation-reference p, #insulation-reference .reference-links a',
        )
        .evaluateAll((items) =>
          items.flatMap((item) => {
            const bounds = item.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(item);
            const content = range.getBoundingClientRect();
            return bounds.left < -1 ||
              bounds.right > innerWidth + 1 ||
              content.left < bounds.left - 1 ||
              content.right > bounds.right + 1
              ? [item.textContent]
              : [];
          }),
        );
      expect(overflow, `${locale}: metric values and qualifiers must fit at ${width}px`).toEqual(
        [],
      );
    }
    await expect(page.locator('.section-concept')).toHaveCount(5);
  }
});

test('gallery recovers failed manifests and photos without leaving the page', async ({ page }) => {
  await page.route('**/galleries/*.json', (route) => route.abort());
  await page.goto('en/');
  const gallery = page.locator('#oman-cases .gallery');
  await gallery.scrollIntoViewIfNeeded();
  await expect(gallery.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await page.unroute('**/galleries/*.json');
  await page.route('**/media/gallery/*-w*.webp*', (route) => route.abort());
  await gallery.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(gallery.locator('.gallery-main')).toHaveCount(1);
  await expect(gallery.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await page.unroute('**/media/gallery/*-w*.webp*');
  await gallery.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(gallery.locator('.gallery-main')).toHaveClass(/loaded/);
  await expect(gallery.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(/\/en\/$/);
});

test('supplied element renders stay mapped, readable and keyboard selectable in both languages', async ({
  page,
}) => {
  const elementTitles = [
    { id: 'single', ar: 'لوح الجدار المفرد', en: 'Single wall panel' },
    { id: 'double', ar: 'لوح الجدار المزدوج', en: 'Double wall panel' },
    { id: 'curved', ar: 'لوح الجدار المنحني', en: 'Curved wall panel' },
    { id: 'slab', ar: 'لوح الأرضية والسقف', en: 'Floor & slab panel' },
    { id: 'landing', ar: 'لوح بسطة السلم', en: 'Stair landing panel' },
    { id: 'stairs', ar: 'عنصر السلالم', en: 'Stair element' },
  ];
  for (const locale of ['ar', 'en'] as const)
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${locale}/`);
      const section = page.locator('#elements');
      await section.scrollIntoViewIfNeeded();
      const render = section.locator('.element-render');
      const image = render.locator('img');
      const buttons = section.locator('.element-selector button');
      await expect(buttons).toHaveCount(6);
      for (const element of elementTitles) {
        const button = section.locator(`.element-selector button[data-element="${element.id}"]`);
        await button.click();
        await expect(render).toHaveAttribute('data-element', element.id);
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(section.locator('.element-selector button[aria-pressed="true"]')).toHaveCount(
          1,
        );
        await expect(image).toHaveAttribute('alt', element[locale]);
        await expect(render.locator('figcaption')).toContainText(element[locale]);
        await expect(image).toHaveAttribute(
          'src',
          new RegExp(`/media/element-${element.id}-w\\d+\\.webp$`),
        );
        await expect(image).toHaveAttribute('srcset', new RegExp(`element-${element.id}-w`));
        await render.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate((node, id) => {
              const img = node as HTMLImageElement;
              const src = new URL(img.currentSrc || img.src);
              return (
                img.complete &&
                img.naturalWidth > 0 &&
                src.origin === location.origin &&
                new RegExp(`/media/element-${id}-w\\d+\\.webp$`).test(src.pathname)
              );
            }, element.id),
          )
          .toBe(true);
        await expect(button.locator('img')).toHaveAttribute('alt', '');
        await expect(button.locator('img')).toHaveAttribute(
          'src',
          new RegExp(`/media/element-${element.id}-thumb\\.webp$`),
        );
        const bounds = await render.evaluate((figure) => {
          const frame = figure.getBoundingClientRect();
          const img = figure.querySelector('img')!;
          const image = img.getBoundingClientRect();
          const caption = figure.querySelector('figcaption')!.getBoundingClientRect();
          const controls = [...document.querySelectorAll('#elements .element-selector button')];
          return {
            imageWidth: image.width,
            imageHeight: image.height,
            objectFit: getComputedStyle(img).objectFit,
            imageInsideFrame:
              image.left >= frame.left - 1 &&
              image.right <= frame.right + 1 &&
              image.top >= frame.top - 1 &&
              image.bottom <= frame.bottom + 1,
            captionInsideFrame:
              caption.left >= frame.left - 1 &&
              caption.right <= frame.right + 1 &&
              caption.bottom <= frame.bottom + 1,
            fitsViewport: [figure, ...controls].every((node) => {
              const rect = node.getBoundingClientRect();
              return rect.left >= -1 && rect.right <= innerWidth + 1;
            }),
          };
        });
        expect(bounds.imageWidth).toBeGreaterThan(100);
        expect(bounds.imageHeight).toBeGreaterThan(100);
        expect(bounds.objectFit).toBe('contain');
        expect(bounds.imageInsideFrame, JSON.stringify({ locale, width, ...bounds })).toBe(true);
        expect(bounds.captionInsideFrame, JSON.stringify({ locale, width, ...bounds })).toBe(true);
        expect(bounds.fitsViewport, JSON.stringify({ locale, width, ...bounds })).toBe(true);
      }
      await section.locator('.element-selector button[data-element="single"]').focus();
      await page.keyboard.press('Enter');
      await expect(render).toHaveAttribute('data-element', 'single');
      await section.locator('.element-selector button[data-element="double"]').focus();
      await page.keyboard.press('Space');
      await expect(render).toHaveAttribute('data-element', 'double');
      await expect(section.locator('canvas')).toHaveCount(0);
    }
});

test('system model rotation and reset redraw cleanly', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Visual GPU checks run on Chromium and actual Edge.');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('en/');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  const layers = page.locator('#system-layers');
  await layers.locator('.model-frame').scrollIntoViewIfNeeded();
  await layers.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
  await expect(layers.locator('[data-scene-status]')).toHaveAttribute('data-scene-status', 'ready');
  const canvas = layers.locator('canvas');
  const prior = await canvas.screenshot();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  const rotated = await canvas.screenshot();
  expect(rotated.equals(prior)).toBe(false);
  await layers.getByRole('button', { name: 'Reset view' }).click();
  expect((await canvas.screenshot()).equals(rotated)).toBe(false);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});
