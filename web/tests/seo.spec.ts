import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });

for (const locale of ['ar', 'en']) {
  test(`${locale}: discover and read a project without JavaScript`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Static crawl acceptance runs once per locale.');
    await page.goto(`/${locale}/`);
    const projectLinks = page.locator(`a[href^="/${locale}/cases/"]`);
    const destinations = await projectLinks.evaluateAll((links) => [
      ...new Set(links.map((link) => link.getAttribute('href'))),
    ]);
    expect(destinations).toHaveLength(6);
    const project = page.locator(`a[href="/${locale}/cases/oman-interior/"]`).first();
    await project.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/cases/oman-interior/$`));
    await expect(page.locator('main h1')).toBeVisible();
    const image = page.locator('main img').filter({ visible: true }).first();
    await expect(image).toHaveAttribute('src', /\.webp$/);
    await expect(image).toHaveAttribute('alt', /\S/);
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThanOrEqual(480);
    await page.locator(`main nav a[href="/${locale}/"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/$`));
    await expect(page.locator('#hero h1')).toBeVisible();
  });
}
