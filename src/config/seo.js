import { SITE_URL, carePlan, company, designPackages, designServices, ventures } from './site.js';
import { LOCALES, localeFromPath, localizePath, stripLocale } from '../i18n/locales.js';

export const DEFAULT_OG_IMAGE = '/og/gizmentor-og.png';

/** Per-route settings that do not change with language. Titles and descriptions live in content.meta. */
const routeSettings = {
  '/': {},
  '/about': {},
  '/ventures': {},
  '/easelect': { ogImage: '/og/easelect-og.png' },
  '/products/magfusion': { ogImage: '/og/magfusion-og.png' },
  '/investors': {},
  '/services': {},
  '/services/website-design': {},
  '/services/website-design/brief': {},
  '/contact': {},
  '/terms': {},
  '/privacy': {},
  '/returns': {},
  '/404': { noindex: true },
};

const basePaths = Object.keys(routeSettings).filter((r) => !routeSettings[r].noindex);

/** Every indexable URL path, in every locale — prerendered and listed in sitemap.xml. */
export const indexableRoutes = Object.keys(LOCALES).flatMap((l) => basePaths.map((p) => localizePath(l, p)));

/** Locale-neutral path for a route, or '/404' if it is not a known page. */
function basePathOf(pathname) {
  const base = stripLocale(pathname);
  return routeSettings[base] ? base : '/404';
}

const absolute = (path) => SITE_URL + (path === '/' ? '/' : path);

/** { locale-code: absolute URL } for each language version of a page (plus x-default). */
export function getAlternates(pathname) {
  const base = basePathOf(pathname);
  if (routeSettings[base].noindex) return {};
  const alt = Object.fromEntries(Object.keys(LOCALES).map((l) => [l, absolute(localizePath(l, base))]));
  return { ...alt, 'x-default': alt.en };
}

export function getMeta(pathname) {
  const locale = localeFromPath(pathname);
  const base = basePathOf(pathname);
  const settings = routeSettings[base];
  const { title, description } = LOCALES[locale].content.meta[base];
  return {
    title,
    description,
    noindex: Boolean(settings.noindex),
    canonical: absolute(base === '/404' ? pathname : localizePath(locale, base)),
    ogImage: SITE_URL + (settings.ogImage || DEFAULT_OG_IMAGE),
    ogLocale: LOCALES[locale].ogLocale,
    lang: locale,
    dir: LOCALES[locale].dir,
  };
}

/** JSON-LD graph for a given route. */
export function getStructuredData(pathname) {
  const locale = localeFromPath(pathname);
  const base = basePathOf(pathname);
  const c = LOCALES[locale].content;
  const organization = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: company.legalName,
    alternateName: [company.name, company.registeredName],
    url: SITE_URL,
    logo: `${SITE_URL}/og/gizmentor-logo.png`,
    email: company.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${c.common.address.line1}, ${c.common.address.line2}`,
      addressLocality: c.common.address.city,
      addressCountry: company.countryCode,
    },
  };
  const graph = [
    organization,
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: company.name,
      inLanguage: Object.keys(LOCALES),
      publisher: { '@id': organization['@id'] },
    },
  ];
  if (base === '/products/magfusion') {
    graph.push({
      '@type': 'Product',
      name: ventures.magfusion.name,
      brand: { '@type': 'Brand', name: ventures.magfusion.family },
      manufacturer: { '@id': organization['@id'] },
      description: c.meta[base].description,
      image: `${SITE_URL}/og/magfusion-og.png`,
      category: 'Power banks',
    });
  }
  if (base === '/easelect') {
    graph.push({
      '@type': 'WebApplication',
      name: ventures.easelect.name,
      url: ventures.easelect.url,
      applicationCategory: 'ShoppingApplication',
      operatingSystem: 'Web',
      publisher: { '@id': organization['@id'] },
      description: c.meta[base].description,
    });
  }
  if (base === designServices.path) {
    const w = c.websiteDesign;
    const offer = (name, price, unitText) => ({
      '@type': 'Offer',
      name,
      priceSpecification: {
        '@type': unitText ? 'UnitPriceSpecification' : 'PriceSpecification',
        minPrice: price,
        priceCurrency: 'AED',
        valueAddedTaxIncluded: false,
        ...(unitText && { unitText }),
      },
    });
    graph.push({
      '@type': 'Service',
      name: c.services.items.websiteDesign.title,
      serviceType: 'Website design',
      description: c.meta[base].description,
      url: absolute(localizePath(locale, base)),
      provider: { '@id': organization['@id'] },
      areaServed: [{ '@type': 'Country', name: 'United Arab Emirates' }, 'Worldwide'],
      availableLanguage: ['en', 'ar'],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: w.packages.title,
        itemListElement: [
          ...designPackages.map((p) => offer(w.packages.items[p.key].name, p.fromAed)),
          offer(w.care.eyebrow, carePlan.fromAed, 'MONTH'),
        ],
      },
    });
    graph.push({
      '@type': 'FAQPage',
      mainEntity: w.faq.items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
