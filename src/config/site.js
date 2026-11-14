/**
 * Single source of truth for corporate facts that do not change with language.
 * All wording (in English and Arabic) lives in src/content/en.js and src/content/ar.js.
 *
 * RULE: only put verified, publishable facts here. Anything set to `null`
 * is intentionally hidden by the UI until a confirmed value is supplied.
 */

export const SITE_URL = 'https://gizmentor.com';

export const company = {
  name: 'GizMentor',
  legalName: 'GizMentor FZCO',
  registeredName: 'GIZMENTOR - FZCO', // as on the trade licence
  founded: null, // e.g. '2024' — hidden until confirmed
  countryCode: 'AE',
  email: 'info@gizmentor.com',
  // Partner, merchant and affiliate applications (Maurice, 2026-11-08).
  partnersEmail: 'partners@easelect.ai',
  // Registration numbers are optional; leave null to show statements only.
  tradeLicenceNumber: null,
  trademarkRegistrationNumber: null,
  social: {
    linkedin: null,
    instagram: null,
  },
};

export const ventures = {
  easelect: {
    name: 'Easelect',
    url: 'https://www.easelect.ai',
    path: '/easelect',
    // Status keys map to labels in content.common.status.
    status: [
      { key: 'webLive', tone: 'live' },
      { key: 'mobileSoon', tone: 'soon' },
    ],
  },
  magfusion: {
    name: 'MagFusion Air',
    family: 'MagFusion',
    path: '/products/magfusion',
    status: [{ key: 'onEnquiry', tone: 'live' }],
    tdraRegistrationNumber: null,
  },
};

/**
 * Investor metrics. Leave the array empty to hide the metrics band entirely.
 * Add only verified figures, with the label in both languages, e.g.
 *   { value: '12', label: { en: 'Retail partners', ar: 'شركاء التجزئة' }, note: { en: 'As of Q4 2026', ar: 'حتى الربع الرابع 2026' } }
 */
export const investorMetrics = [];

/** Primary navigation. Labels live in content.common.nav under the same key. */
export const nav = [
  { key: 'about', to: '/about' },
  { key: 'ventures', to: '/ventures' },
  { key: 'easelect', to: '/easelect' },
  { key: 'magfusion', to: '/products/magfusion' },
  { key: 'services', to: '/services' },
  { key: 'investors', to: '/investors' },
];

/** Contact form enquiry types. Labels live in content.contact.types under the same value. */
export const inquiryTypes = ['investor', 'partnership', 'retail', 'easelect', 'magfusion', 'support', 'press', 'general'];

/** Enquiry types addressed to company.partnersEmail; every other type goes to company.email. */
export const partnerInquiryTypes = ['partnership', 'retail'];

export const emailFor = (inquiryType) =>
  partnerInquiryTypes.includes(inquiryType) ? company.partnersEmail : company.email;

/**
 * Form delivery: both forms post to the Worker in worker/ (gizmentor-forms on workers.dev), which
 * emails the team. The Turnstile site key is public; the secret lives only in the Worker.
 */
export const forms = {
  endpoint: 'https://gizmentor-forms.soft-hill-9932.workers.dev',
  turnstileSiteKey: '0x4AAAAAAGAufdgJ92StZQ_K',
};

/**
 * Website design packages. Prices are public "from" prices in AED, excluding VAT where applicable
 * (approved by the owner, 2026-11-14). USD is shown next to AED at the dirham's fixed rate.
 * Labels and descriptions live in content.websiteDesign.packages under the same key.
 */
export const AED_PER_USD = 3.6725;

export const designPackages = [
  { key: 'launch', fromAed: 3900 },
  { key: 'business', fromAed: 9900, recommended: true },
  { key: 'elite', fromAed: 25000, customQuote: true },
];

export const carePlan = { fromAed: 790, hoursPerMonth: 2 };

export const designServices = {
  revisionRounds: 2,
  path: '/services/website-design',
  briefPath: '/services/website-design/brief',
};

/** In-house work shown as the portfolio. Descriptions live in content.websiteDesign.portfolio. */
export const portfolio = [
  { key: 'gizmentor', url: 'https://gizmentor.com', host: 'gizmentor.com' },
  { key: 'easelect', url: 'https://www.easelect.ai', host: 'easelect.ai' },
];
