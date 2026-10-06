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
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '2');
});
test('responsive geometry stays within viewport, including the dock', async ({ page }) => {
  for (const locale of ['ar', 'en'])
    for (const width of [320, 390, 768, 1440, 3840]) {
      await page.setViewportSize({ width, height: width === 3840 ? 2160 : 900 });
      await page.goto(`${locale}/`);
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => {
        const d = document.querySelector('.presentation-dock')!.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          left: d.left,
          right: d.right,
          width: innerWidth,
        };
      });
      expect(geometry.overflow, `${locale} ${width}`).toBe(false);
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(geometry.width + 1);
    }
});
test('case filters, case routes, FAQ and local sliders work', async ({ page }) => {
  await page.goto('en/');
  await page.locator('#international-cases').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Philippines', exact: true }).click();
  await expect(page.locator('.international-grid .case-card')).toHaveCount(1);
  await page.locator('.international-grid .case-card').click();
  await expect(page).toHaveURL(/en\/cases\/philippines-restaurant\//);
  await expect(page.locator('h1')).toContainText('Laguna');
  await page.getByRole('link', { name: 'Back to presentation' }).click();
  await expect(page.locator('section')).toHaveCount(15);
  await page.locator('details').first().locator('summary').click();
  await expect(page.locator('details').first()).toHaveAttribute('open', '');
  const range = page.getByRole('slider', { name: 'Separate layers' });
  await range.scrollIntoViewIfNeeded();
  await range.focus();
  const initial = await range.inputValue();
  await page.keyboard.press('ArrowRight');
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
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target),
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
