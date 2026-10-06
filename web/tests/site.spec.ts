import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
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
    await expect(page.locator('section')).toHaveCount(15);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('#contact-card a[href^="mailto:"]').first()).toBeAttached();
    await expect(page.locator('#contact-card .qr-block')).toHaveAttribute(
      'href',
      'https://khalidmahrooqi-design.github.io/watad-presentation/',
    );
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
test('responsive geometry stays within viewport, including the dock', async ({ page }) => {
  for (const locale of ['ar', 'en'])
    for (const width of [320, 390, 768, 1440, 3840]) {
      await page.setViewportSize({ width, height: width === 3840 ? 2160 : 900 });
      await page.goto(`${locale}/`);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width + 1);
      const geometry = await page.evaluate(() => {
        const d = document.querySelector('.presentation-dock')!.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          left: d.left,
          right: d.right,
          width: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          overflowing: [...document.querySelectorAll('body *')]
            .map((element) => ({
              element: element.tagName + '.' + element.className,
              section: element.closest('section')?.id,
              right: element.getBoundingClientRect().right,
              width: element.getBoundingClientRect().width,
            }))
            .filter((element) => element.right > innerWidth + 1)
            .slice(0, 12),
        };
      });
      expect(geometry.overflow, JSON.stringify({ locale, ...geometry })).toBe(false);
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
  await page.goto('en/cases/philippines-restaurant/');
  await expect(page.locator('h1')).toContainText('Laguna');
  await expect(page.locator('.gallery-main')).toHaveClass(/loaded/);
  await page.getByRole('link', { name: 'Back to presentation' }).click();
  await expect(page.locator('section')).toHaveCount(15);
  await page.locator('details').first().locator('summary').click();
  await expect(page.locator('details').first()).toHaveAttribute('open', '');
  const range = page.getByRole('slider', { name: 'Separate layers' });
  await range.scrollIntoViewIfNeeded();
  await range.focus();
  const initial = await range.inputValue();
  await range.press('ArrowRight');
  expect(await range.inputValue()).not.toBe(initial);
});
test('no-JavaScript and reduced-motion versions retain content', async ({ browser }) => {
  const ctx = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4173/watad-presentation/ar/');
  await expect(p.locator('section')).toHaveCount(15);
  await expect(p.locator('#contact-card .qr-block')).toBeAttached();
  await ctx.close();
  const reduced = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await reduced.newPage();
  await page.goto('http://127.0.0.1:4173/watad-presentation/en/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'paused');
  expect(
    await page
      .locator('.flag-object img')
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe('none');
  await reduced.close();
});
test('semantic and contrast accessibility checks on both languages/themes', async ({ page }) => {
  for (const locale of ['ar', 'en'])
    for (const theme of ['dark', 'light']) {
      await page.goto(`${locale}/`);
      await page.evaluate((t) => {
        localStorage.setItem('watad-theme', t);
      }, theme);
      await page.reload();
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
  for (const id of ['system-layers', 'elements', 'construction-process', 'sustainability']) {
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
test('comparison charts preserve source, units and selectable range', async ({ page }) => {
  await page.goto('en/');
  const s = page.locator('#project-comparison');
  await s.scrollIntoViewIfNeeded();
  await expect(s.locator('.time-donut')).toHaveAttribute('aria-label', /70 units.*30% saved/);
  await s.getByRole('button', { name: '40%', exact: true }).click();
  await expect(s.locator('.time-donut')).toHaveAttribute('aria-label', /60 units.*40% saved/);
  await expect(s.locator('.metric-source')).toContainText('January 2025');
  await expect(s.locator('.metric-grid')).toContainText('Including construction-time savings');
  await expect(s.locator('.small-note')).toContainText('not actual days');
  await expect(page.locator('.section-concept')).toHaveCount(6);
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

test('element selection, construction stages and rotation redraw cleanly', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Visual GPU checks run on Chromium and actual Edge.');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('en/');
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  const elements = page.locator('#elements');
  await elements.locator('.model-frame').scrollIntoViewIfNeeded();
  await elements.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
  await expect(elements.locator('[data-scene-status]')).toHaveAttribute(
    'data-scene-status',
    'ready',
  );
  let prior = await elements.locator('canvas').screenshot();
  const buttons = elements.locator('.element-selector button');
  for (let i = 1; i < (await buttons.count()); i++) {
    await buttons.nth(i).click();
    await expect(buttons.nth(i)).toHaveAttribute('aria-pressed', 'true');
    await elements.locator('canvas').scrollIntoViewIfNeeded();
    const next = await elements.locator('canvas').screenshot();
    expect(next.equals(prior), 'Selected element must change').toBe(false);
    prior = next;
  }
  const canvas = elements.locator('canvas');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  const rotated = await canvas.screenshot();
  expect(rotated.equals(prior)).toBe(false);
  await elements.getByRole('button', { name: 'Reset view' }).click();
  expect((await canvas.screenshot()).equals(rotated)).toBe(false);
  const process = page.locator('#construction-process');
  await process.locator('.model-frame').scrollIntoViewIfNeeded();
  await process.getByRole('button', { name: 'Explore in 3D', exact: true }).click();
  await expect(process.locator('[data-scene-status]')).toHaveAttribute(
    'data-scene-status',
    'ready',
  );
  const stages = process.locator('.stage-buttons button');
  await stages.last().click();
  await process.locator('canvas').scrollIntoViewIfNeeded();
  const finish = await process.locator('canvas').screenshot();
  await stages.first().click();
  await process.locator('canvas').scrollIntoViewIfNeeded();
  const foundation = await process.locator('canvas').screenshot();
  expect(finish.equals(foundation)).toBe(false);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});
