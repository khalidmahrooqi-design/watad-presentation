import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.route('https://www.youtube-nocookie.com/embed/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><title>Video placeholder</title><body><main>Video</main></body></html>',
    }),
  );
});

for (const locale of ['ar', 'en']) {
  test(`${locale}: all 14 supplied photos navigate with captions and thumbnails`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${locale}/#elements`);
    const gallery = page.locator('#architectural-gallery');
    await gallery.scrollIntoViewIfNeeded();
    const main = gallery.locator('.gallery-main');
    const seen = new Set<string>();
    for (let index = 1; index <= 14; index++) {
      await expect(gallery.locator('.gallery-controls span')).toHaveText(`${index} / 14`);
      await expect(main).toHaveClass(/loaded/);
      expect(await main.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
      expect(await main.getAttribute('alt')).toBe(
        await gallery.locator('.gallery-caption').textContent(),
      );
      seen.add((await main.getAttribute('src'))!);
      await gallery
        .getByRole('button', {
          name: locale === 'ar' ? 'الصورة التالية' : 'Next photo',
          exact: true,
        })
        .click();
    }
    expect(seen.size).toBe(14);
    await expect(gallery.locator('.gallery-controls span')).toHaveText('1 / 14');
    await gallery
      .getByRole('button', { name: locale === 'ar' ? 'عرض الصورة 3' : 'Show photo 3', exact: true })
      .click();
    await expect(gallery.locator('.gallery-controls span')).toHaveText('3 / 14');
    await page.keyboard.press('End');
    await expect(gallery.locator('.gallery-controls span')).toHaveText('14 / 14');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

  test(`${locale}: qualified reports have working links and accessible layouts`, async ({
    page,
    request,
  }) => {
    await page.goto(`${locale}/#performance-evidence`);
    const reports = [
      ['#facade-acoustics', 'acoustic-facade-psme80-2005.pdf'],
      ['#rainfall-test', 'rainfall-idiem-1994.pdf'],
      ['#performance-evidence', 'seismic-enea-2009.pdf'],
      ['#performance-evidence', 'static-panels-eucentre-2008.pdf'],
      ['#performance-evidence', 'cyclic-panels-eucentre-2008.pdf'],
      ['#performance-evidence', 'wind-projectile-2005.pdf'],
      ['#fire-test', 'fire-psme80-csi-2003.pdf'],
      ['#sustainability', 'durability-emmedue-2025.pdf'],
    ];
    for (const [section, file] of reports) {
      const link = page.locator(`${section} a[href="/reports/${file}"]`);
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toContainText('PDF');
      const response = await request.head(`/reports/${file}`);
      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toContain('application/pdf');
    }
    await expect(page.locator('#facade-acoustics')).toContainText('D₂m,nT,w');
    await expect(page.locator('#facade-acoustics')).toContainText('51');
    await expect(page.locator('#fire-test')).toContainText('150');
    await expect(page.locator('#fire-test')).toContainText('REI 120');
    await expect(page.locator('#performance-evidence')).toContainText('0.45g');
    for (const theme of ['dark', 'light']) {
      await page.evaluate(
        (value) => document.documentElement.setAttribute('data-theme', value),
        theme,
      );
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const overflow = await page
          .locator('#comfort, #performance-evidence, #sustainability')
          .evaluateAll((roots) =>
            roots.flatMap((root) =>
              [...root.querySelectorAll('h3,p,a')]
                .filter((node) => {
                  const bounds = node.getBoundingClientRect();
                  return (
                    bounds.width &&
                    (bounds.left < -1 ||
                      bounds.right > innerWidth + 1 ||
                      node.scrollWidth > node.clientWidth + 1)
                  );
                })
                .map((node) => node.textContent),
            ),
          );
        expect(overflow, `${locale}/${theme}/${width}`).toEqual([]);
      }
      const a11y = await new AxeBuilder({ page })
        .include('#comfort')
        .include('#performance-evidence')
        .include('#sustainability')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(a11y.violations).toEqual([]);
    }
  });
}
