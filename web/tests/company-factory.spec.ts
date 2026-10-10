import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page }) => {
  // Validate our embed and layout without depending on YouTube availability in CI.
  await page.route('https://www.youtube-nocookie.com/embed/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><head><title>Video test frame</title></head><body><main>Video test frame</main></body></html>',
    }),
  );
});

async function expectContentToFit(section: Locator, context: string) {
  const overflow = await section.evaluate((root) => {
    const nodes = [root, ...root.querySelectorAll('h2,h3,p,a,img,iframe,figcaption')];
    return nodes.flatMap((node) => {
      const bounds = node.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return [];
      const outside = bounds.left < -1 || bounds.right > innerWidth + 1;
      const range = document.createRange();
      range.selectNodeContents(node);
      const text = range.getBoundingClientRect();
      const textOutside = text.width > 0 && (text.left < -1 || text.right > innerWidth + 1);
      return outside || textOutside ? [node.textContent?.trim() || node.tagName] : [];
    });
  });
  expect(overflow, context).toEqual([]);
}

for (const locale of ['ar', 'en'] as const) {
  const ar = locale === 'ar';
  test(`${locale}: company and factory navigation preserves section destinations`, async ({
    page,
  }) => {
    await page.goto(`${locale}/`);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'paused');
    expect(
      await page
        .locator('main > section')
        .evaluateAll((nodes) => nodes.slice(0, 4).map((n) => n.id)),
    ).toEqual(['hero', 'about-al-oula', 'factory', 'applications']);
    const progress = page.locator('[role="progressbar"]');
    await expect(progress).toHaveAttribute('aria-valuemax', '17');
    const next = page.getByRole('button', {
      name: ar ? 'القسم التالي' : 'Next section',
      exact: true,
    });
    const previous = page.getByRole('button', {
      name: ar ? 'القسم السابق' : 'Previous section',
      exact: true,
    });
    for (const [id, position] of [
      ['about-al-oula', '2'],
      ['factory', '3'],
      ['applications', '4'],
    ]) {
      await next.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/#${id}$`));
      await expect(page.locator('#' + id)).toBeInViewport();
      await expect(progress).toHaveAttribute('aria-valuenow', position);
    }
    await previous.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/#factory$`));
    await expect(progress).toHaveAttribute('aria-valuenow', '3');
    for (const id of ['about-al-oula', 'factory']) {
      await page.locator('button[aria-controls="section-menu"]').click();
      const menu = page.locator('#section-menu');
      await expect(menu.locator('a')).toHaveCount(17);
      await menu.locator(`a[href="#${id}"]`).click();
      await expect(page.locator('#' + id)).toBeInViewport();
      await expect(page).toHaveURL(new RegExp(`/${locale}/#${id}$`));
    }
    for (const id of ['about-al-oula', 'factory']) {
      await page.goto(`${locale}/#${id}`);
      await expect(page.locator('#' + id)).toBeInViewport();
      await page.locator('.language-button').click();
      const destination = ar ? 'en' : 'ar';
      await expect(page).toHaveURL(new RegExp(`/${destination}/#${id}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', destination);
      await expect(page.locator('#' + id)).toBeInViewport();
    }
  });

  for (const theme of ['dark', 'light']) {
    test(`${locale}/${theme}: company and factory remain accessible on mobile and desktop`, async ({
      page,
      request,
    }) => {
      await page.addInitScript((value) => localStorage.setItem('watad-theme', value), theme);
      const response = await request.get('galleries/mdue-production.json');
      expect(response.ok()).toBe(true);
      const manifest = await response.json();
      expect(manifest.id).toBe('mdue-production');
      expect(manifest.images).toHaveLength(1);
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`${locale}/#factory`);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await page.evaluate(() => document.fonts.ready);
        const factory = page.locator('#factory');
        const photo = factory.locator('.factory-photo');
        const image = photo.locator('img');
        await photo.scrollIntoViewIfNeeded();
        await expect(image).toHaveAttribute('src', '/' + manifest.images[0].src);
        await expect(image).toHaveAttribute(
          'alt',
          ar ? /[\u0600-\u06ff]+/ : /Emmedue.*production hall/,
        );
        await expect(photo.locator('figcaption')).toContainText('Emmedue');
        await expect(factory.locator('.factory-credit a')).toHaveAttribute(
          'href',
          'https://www.mdue.it/en/plants',
        );
        await expect(factory.locator('.gallery, .gallery-controls')).toHaveCount(0);
        await expect
          .poll(() =>
            image.evaluate((element) => {
              const img = element as HTMLImageElement;
              const url = new URL(img.currentSrc || img.src);
              return (
                img.complete &&
                img.naturalWidth > 0 &&
                url.origin === location.origin &&
                /^\/images\/factory\/emmedue-production-hall(?:-w\d+)?\.webp$/.test(url.pathname)
              );
            }),
          )
          .toBe(true);
        const bounds = (await image.boundingBox())!;
        expect(bounds.width).toBeGreaterThan(width * 0.7);
        expect(bounds.width / bounds.height).toBeCloseTo(20 / 9, 1);
        await expectContentToFit(factory, `${locale}/${theme}: factory at ${width}px`);
        const company = page.locator('#about-al-oula');
        await company.scrollIntoViewIfNeeded();
        await expect(company.locator('h2')).toBeVisible();
        await expect(company.locator('img')).toHaveAttribute('alt', /.+/);
        await expectContentToFit(company, `${locale}/${theme}: company at ${width}px`);
        const result = await new AxeBuilder({ page })
          .include('#about-al-oula')
          .include('#factory')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(
          result.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            targets: violation.nodes.map((node) => node.target),
          })),
          `${locale}/${theme}: accessibility at ${width}px`,
        ).toEqual([]);
      }
    });
  }

  for (const video of [
    {
      section: 'construction-process',
      id: ar ? 'ol1l4r8T22w' : 'wa7dS2YSNvM',
      title: /WATAD.*installation/,
      fallback: ar ? 'شاهد على YouTube' : 'Watch on YouTube',
    },
    {
      section: 'performance-evidence',
      id: '4yfrkU9H2vo',
      title: /Emmedue.*tests/,
      fallback: ar ? 'شاهد الفيديو الكامل على YouTube' : 'Watch the full film on YouTube',
    },
  ]) {
    test(`${locale}: ${video.section} embeds its film with a usable fallback`, async ({ page }) => {
      await page.goto(`${locale}/#${video.section}`);
      const section = page.locator('#' + video.section);
      const frame = section.locator('iframe');
      await expect(frame).toHaveCount(1);
      const url = new URL((await frame.getAttribute('src'))!);
      expect(url.origin + url.pathname).toBe(`https://www.youtube-nocookie.com/embed/${video.id}`);
      expect(url.searchParams.get('hl')).toBe(locale);
      expect(url.searchParams.get('autoplay')).not.toBe('1');
      await expect(frame).toHaveAttribute('title', ar ? /[\u0600-\u06ff]+/ : video.title);
      await expect(frame).toHaveAttribute('loading', 'lazy');
      await expect(frame).toHaveAttribute('allowfullscreen', '');
      await expect(frame).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      await expect(frame).toHaveAttribute('allow', /encrypted-media/);
      await expect(frame).toHaveAttribute('allow', /picture-in-picture/);
      await expect(frame).not.toHaveAttribute('allow', /autoplay/);
      await expect(section.locator('canvas, .model-frame, .stage-buttons')).toHaveCount(0);
      const fallback = section.getByRole('link', {
        name: video.fallback,
      });
      await expect(fallback).toHaveAttribute('href', `https://www.youtube.com/watch?v=${video.id}`);
      await expect(fallback).toHaveAttribute('target', '_blank');
      await expect(fallback).toHaveAttribute('rel', /noopener/);
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await frame.scrollIntoViewIfNeeded();
        await expect(page.frameLocator(`#${video.section} iframe`).getByRole('main')).toHaveText(
          'Video test frame',
        );
        const bounds = (await frame.boundingBox())!;
        expect(bounds.width).toBeGreaterThan(width * 0.7);
        expect(bounds.width / bounds.height).toBeCloseTo(16 / 9, 1);
        await expectContentToFit(section, `${locale}: video and fallback at ${width}px`);
      }
      if (video.section === 'construction-process') {
        await page.locator('.language-button').click();
        const destination = ar ? 'en' : 'ar';
        const translatedVideo = ar ? 'wa7dS2YSNvM' : 'ol1l4r8T22w';
        await expect(page).toHaveURL(new RegExp(`/${destination}/#construction-process$`));
        await expect(frame).toHaveAttribute(
          'src',
          `https://www.youtube-nocookie.com/embed/${translatedVideo}?rel=0&hl=${destination}`,
        );
        await expect(section.locator('a[href^="https://www.youtube.com/watch"]')).toHaveAttribute(
          'href',
          `https://www.youtube.com/watch?v=${translatedVideo}`,
        );
      }
      if (video.section === 'performance-evidence') {
        const cards = section.locator('.evidence-grid article');
        await expect(cards).toHaveCount(4);
        const chapters = [
          { label: ar ? /الزلازل/ : /Seismic tests/, time: null },
          { label: ar ? /الأحمال/ : /Static and load tests/, time: '30s' },
          { label: ar ? /الرياح/ : /Wind projectile tests/, time: '146s' },
        ];
        for (const chapter of chapters) {
          const card = cards.filter({ has: page.getByRole('heading', { name: chapter.label }) });
          await expect(card).toHaveCount(1);
          const link = card.locator('a[href^="https://www.youtube.com/"]');
          await expect(link).toHaveAccessibleName(ar ? /شاهد/ : /^Watch .*tests$/);
          const target = new URL((await link.getAttribute('href'))!);
          expect(target.origin + target.pathname).toBe('https://www.youtube.com/watch');
          expect(target.searchParams.get('v')).toBe(video.id);
          expect(target.searchParams.get('t')).toBe(chapter.time);
          await expect(link).toHaveAttribute('target', '_blank');
          await expect(link).toHaveAttribute('rel', /noopener/);
        }
        await page.goto(`${locale}/#system-layers`);
        await page.locator('#system-layers a[href="#performance-evidence"]').click();
        await expect(page).toHaveURL(new RegExp(`/${locale}/#performance-evidence$`));
        await expect(section).toBeInViewport();
      }
    });
  }
}
