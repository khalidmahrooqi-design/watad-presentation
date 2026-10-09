// Exact public Wix routes observed on 9 October 2026. Commerce and bookings now lead to enquiries.
export const legacyRoutes = {
  '/book-online': '/en/#contact-card',
  '/blog': '/en/#system-layers',
  '/blank': '/en/#contact-card',
  '/blank-1': '/en/#contact-card',
  '/blank-2': '/en/#contact-card',
  '/blank-3': '/en/#contact-card',
  '/blank-4': '/en/#contact-card',
  '/portfolio': '/en/#oman-cases',
  '/service-page/installation-workshop': '/en/#contact-card',
  '/service-page/project-design-consultation': '/en/#contact-card',
  '/service-page/watad-system-training': '/en/#contact-card',
  '/booking-calendar/installation-workshop': '/en/#contact-card',
  '/booking-calendar/project-design-consultation': '/en/#contact-card',
  '/product-page/eps-panesl-for-heat-insullation-no-mesh': '/en/#system-layers',
  '/product-page/foundation-support-system': '/en/#elements',
  '/product-page/acoustic-insulation-roll': '/en/#elements',
  '/product-page/fire-resistant-insulation-board': '/en/#elements',
  '/product-page/eco-friendly-concrete-mix': '/en/#elements',
  '/product-page/modular-wall-system': '/en/#elements',
  '/product-page/prefabricated-roof-panels': '/en/#elements',
  '/category/all-products': '/en/#elements',
  '/category/insulation-solutions': '/en/#system-layers',
  '/category/construction-systems': '/en/#elements',
  '/portfolio-collections/my-portfolio': '/en/#oman-cases',
  '/portfolio-collections/watad-system-project-pipeline': '/en/#oman-cases',
  '/portfolio-collections/my-portfolio/multi-story-building-in-al-mawalleh-oman': '/en/#oman-cases',
  '/portfolio-collections/my-portfolio/villa-in-al-ansab-oman': '/en/#oman-cases',
  '/portfolio-collections/my-portfolio/worldwide-projects': '/en/#international-cases',
  '/portfolio-collections/my-portfolio/other-projects-in-oman': '/en/#oman-cases',
  '/portfolio-collections/watad-system-project-pipeline/salalah-camp': '/en/#oman-cases',
  '/portfolio-collections/my-portfolio/uae-projects': '/en/#international-cases',
  '/portfolio-collections/my-portfolio/projects-in-qatar': '/en/#international-cases',
  '/post/sustainable-building-solutions-with-m2-emmedue-technology': '/en/#sustainability',
  '/post/revolutionizing-construction-cips-advanced-building-system': '/en/#system-layers',
  '/post/cost-efficient-building-the-future-of-construction-in-oman': '/en/#project-comparison',
};

const caseIds = [
  'oman-interior',
  'oman-installation',
  'saudi-chalet',
  'philippines-restaurant',
  'panama-resort',
  'qatar-gardens',
];

// Only former catalogue routes are aliased; unknown paths retain the normal 404 response.
export const prefixAliases = Object.fromEntries([
  ['/watad-presentation', '/'],
  ...['ar', 'en'].flatMap((locale) => [
    [`/watad-presentation/${locale}`, `/${locale}/`],
    ...caseIds.map((id) => [
      `/watad-presentation/${locale}/cases/${id}`,
      `/${locale}/cases/${id}/`,
    ]),
  ]),
]);
