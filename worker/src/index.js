/**
 * Forms Worker (gizmentor-forms on workers.dev): receives the website's Contact form and the website-design project brief,
 * emails them to the team through Resend, and sends the visitor a short confirmation.
 *
 * Secrets (set in Cloudflare or by .github/workflows/deploy-forms.yml, never in this repo):
 *   RESEND_API_KEY        Resend API key with sending access for the MAIL_FROM domain
 *   TURNSTILE_SECRET_KEY  Cloudflare Turnstile secret. When set, every submission must pass Turnstile.
 * Plain settings are in wrangler.toml [vars].
 * Error codes in the JSON reply match what src/lib/forms.js shows the visitor.
 *
 * Recipients are fixed here and in wrangler.toml; nothing in a request can choose where mail goes.
 * The visitor's confirmation is only sent after Turnstile passes, so the form cannot be used to
 * mail strangers.
 */

import { renderEmail } from './email.js';

const MAX_BODY = 24_000;
const MIN_FILL_MS = 3_000;

// Same values as src/config/site.js; the website shows the labels.
const INQUIRY_TYPES = ['investor', 'partnership', 'retail', 'easelect', 'magfusion', 'support', 'press', 'general'];
const PARTNER_TYPES = ['partnership', 'retail'];
const BRIEF = {
  package: ['launch', 'business', 'elite', 'care', 'unsure'],
  projectType: ['new', 'redesign', 'landing', 'ecommerce', 'other'],
  pages: ['1', '2-5', '6-10', '10+', 'unsure'],
  features: ['bilingual', 'cms', 'blog', 'seo', 'analytics', 'booking', 'ecommerce', 'payments', 'chat', 'automation', 'integrations', 'care'],
  budget: ['3900-9900', '9900-25000', '25000-50000', '50000+', 'unsure'],
  timeline: ['asap', '1-2m', '3m+', 'flexible'],
  assets: ['ready', 'partial', 'none'],
};

// Labels for the team's email (English) and the visitor's confirmation (their language).
const LABELS = {
  en: {
    inquiry: {
      investor: 'Investor relations', partnership: 'Strategic / technology partnership', retail: 'Merchant & affiliate partnership',
      easelect: 'Easelect', magfusion: 'MagFusion: sales & wholesale', support: 'Product support', press: 'Press & media', general: 'General enquiry',
    },
    package: { launch: 'Launch', business: 'Business', elite: 'Elite', care: 'Care plan', unsure: 'Not sure yet' },
    projectType: { new: 'New website', redesign: 'Redesign', landing: 'Landing page', ecommerce: 'Online store', other: 'Something else' },
    budget: { '3900-9900': 'AED 3,900–9,900', '9900-25000': 'AED 9,900–25,000', '25000-50000': 'AED 25,000–50,000', '50000+': 'AED 50,000+', unsure: 'Not sure yet' },
    timeline: { asap: 'As soon as possible', '1-2m': 'In 1–2 months', '3m+': 'In 3 months or more', flexible: 'Flexible' },
  },
  ar: {
    inquiry: {
      investor: 'علاقات المستثمرين', partnership: 'شراكة استراتيجية أو تقنية', retail: 'شراكة التجّار والتسويق بالعمولة',
      easelect: 'Easelect', magfusion: 'MagFusion: المبيعات والجملة', support: 'دعم المنتجات', press: 'الصحافة والإعلام', general: 'استفسار عام',
    },
    package: { launch: 'الانطلاق', business: 'الأعمال', elite: 'النخبة', care: 'خطة الرعاية', unsure: 'لم أقرر بعد' },
    projectType: { new: 'موقع جديد', redesign: 'إعادة تصميم', landing: 'صفحة هبوط', ecommerce: 'متجر إلكتروني', other: 'شيء آخر' },
    budget: { '3900-9900': 'من 3,900 إلى 9,900 درهم', '9900-25000': 'من 9,900 إلى 25,000 درهم', '25000-50000': 'من 25,000 إلى 50,000 درهم', '50000+': 'أكثر من 50,000 درهم', unsure: 'لم أقرر بعد' },
    timeline: { asap: 'في أقرب وقت', '1-2m': 'خلال شهر إلى شهرين', '3m+': 'بعد ثلاثة أشهر أو أكثر', flexible: 'مرن' },
  },
};

const json = (body, status, cors) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors } });

const EMAIL = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,24}$/i;

/** Trimmed string: '' when missing, null when longer than `max` (which fails validation). */
function text(value, max) {
  if (typeof value !== 'string') return '';
  const v = value.replace(/\r\n?/g, '\n').trim();
  return v.length > max ? null : v;
}
const oneOf = (value, list) => (list.includes(value) ? value : null);

function validateContact(b) {
  const out = {
    name: text(b.name, 120),
    email: text(b.email, 254),
    organisation: text(b.organisation, 160),
    inquiryType: oneOf(b.inquiryType, INQUIRY_TYPES),
    product: text(b.product, 120),
    message: text(b.message, 5000),
  };
  if (Object.values(out).includes(null) || !out.name || !EMAIL.test(out.email) || !out.message) return null;
  return out;
}

function validateBrief(b) {
  const features = Array.isArray(b.features) ? [...new Set(b.features)] : [];
  if (!features.every((f) => BRIEF.features.includes(f))) return null;
  const out = {
    package: b.package ? oneOf(b.package, BRIEF.package) : 'unsure',
    projectType: oneOf(b.projectType, BRIEF.projectType),
    goals: text(b.goals, 3000),
    audience: text(b.audience, 2000),
    currentSite: text(b.currentSite, 300),
    pages: b.pages ? oneOf(b.pages, BRIEF.pages) : '',
    features,
    featureNotes: text(b.featureNotes, 2000),
    // The brief stopped asking a budget (2026-11-15); older pages still send one.
    budget: b.budget ? oneOf(b.budget, BRIEF.budget) : '',
    timeline: oneOf(b.timeline, BRIEF.timeline),
    deadline: text(b.deadline, 200),
    references: text(b.references, 2000),
    assets: b.assets ? oneOf(b.assets, BRIEF.assets) : '',
    assetsLink: text(b.assetsLink, 500),
    name: text(b.name, 120),
    email: text(b.email, 254),
    company: text(b.company, 160),
    country: text(b.country, 80),
    agreed: b.agreed === true,
  };
  if (Object.values(out).includes(null) || !out.goals || !out.name || !EMAIL.test(out.email) || !out.agreed) return null;
  return out;
}

async function passesTurnstile(env, token, ip) {
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET_KEY);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success === true;
}

async function send(env, message) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, ...message }),
  });
  if (!res.ok) console.error('resend', res.status, (await res.text()).slice(0, 300));
  return res.ok;
}

/** The team's copy: every filled field as a summary row, a button to reply, and the same rows as plain text. */
function teamEmail({ eyebrow, title, intro, rows, replyTo, name }) {
  const filled = rows.filter(([, v]) => v);
  const text = `${title}\n\n${filled.map(([k, v]) => `${k}:\n${v}\n`).join('\n')}`;
  const html = renderEmail({
    lang: 'en',
    title,
    preheader: intro,
    eyebrow,
    heading: title,
    paragraphs: [intro],
    summaryTitle: 'Details',
    summary: filled,
    cta: { label: `Reply to ${name}`, url: `mailto:${replyTo}` },
    note: 'Replying to this email also goes to them.',
    why: 'Sent by the form on gizmentor.com.',
  });
  return { text, html };
}

function contactEmails(d, env) {
  const to = PARTNER_TYPES.includes(d.inquiryType) ? env.PARTNERS_TO : env.LEADS_TO;
  const type = LABELS.en.inquiry[d.inquiryType];
  const { text: t, html } = teamEmail({
    eyebrow: 'Website enquiry',
    title: `${type} from ${d.name}`,
    intro: `${d.name} sent an enquiry through the contact form.`,
    replyTo: d.email,
    name: d.name,
    rows: [
      ['Name', d.name],
      ['Email', d.email],
      ['Organisation', d.organisation],
      ['Enquiry type', type],
      ['Product', d.product],
      ['Message', d.message],
    ],
  });
  return { to, subject: `[Contact] ${type} enquiry from ${d.name}`, text: t, html };
}

function briefEmails(d, env) {
  const L = LABELS.en;
  const { text: t, html } = teamEmail({
    eyebrow: 'Website design · New project brief',
    title: `New brief from ${d.name}`,
    intro: `${d.name} sent a project brief. Reply within two working days with next steps and an initial quote.`,
    replyTo: d.email,
    name: d.name,
    rows: [
      ['Name', d.name],
      ['Email', d.email],
      ['Company', d.company],
      ['Country', d.country],
      ['Package', L.package[d.package]],
      ['Project type', L.projectType[d.projectType]],
      ['Timeline', L.timeline[d.timeline]],
      ['What they need', d.goals],
      ['Audience', d.audience],
      ['Current website', d.currentSite],
      ['Pages', d.pages],
      ['Features', d.features.join(', ')],
      ['Feature notes', d.featureNotes],
      ['Deadline', d.deadline],
      ['Links', d.references],
      ['Brand assets', d.assets],
      ['Assets link', d.assetsLink],
      ['Revision policy', d.agreed ? 'Accepted (2 revision rounds; later changes from Care hours or quoted)' : ''],
    ],
  });
  return { to: env.LEADS_TO, subject: `[Brief] ${L.projectType[d.projectType]} · ${L.package[d.package]} · ${d.name}`, text: t, html };
}

// The visitor's confirmation copy, by language. Steps follow the website-design process on the site.
const CONFIRM = {
  en: {
    brief: {
      subject: 'We received your project brief — GizMentor',
      eyebrow: 'Website design · Project brief',
      heading: (n) => `Thank you, ${n}. Your brief is with us.`,
      body: 'We will review it and reply by email, usually within two working days, with next steps and an initial quote.',
      summaryTitle: 'Your brief',
      stepsTitle: 'What happens next',
      steps: [
        ['We review your brief', 'We look at what you need and which package fits.'],
        ['Proposal and quote', 'We reply with scope, price and dates. Work starts once you approve them.'],
        ['Design, build and launch', 'Two revision rounds are included, then we test and go live.'],
      ],
      cta: 'See our packages',
      ctaPath: '/services/website-design',
      why: 'You are receiving this because you sent a project brief on gizmentor.com.',
    },
    contact: {
      subject: 'We received your message — GizMentor',
      eyebrow: 'GizMentor · Contact',
      heading: (n) => `Thank you, ${n}. We have your message.`,
      body: 'The right person on our team will reply by email.',
      summaryTitle: 'Your enquiry',
      cta: 'Visit gizmentor.com',
      ctaPath: '/',
      why: 'You are receiving this because you contacted us on gizmentor.com.',
    },
    labels: { package: 'Package', projectType: 'Project type', timeline: 'Timeline', inquiry: 'Enquiry type' },
    signoff: 'The GizMentor team',
    note: 'To add anything, just reply to this email.',
  },
  ar: {
    brief: {
      subject: 'وصلنا موجز مشروعكم — GizMentor',
      eyebrow: 'تصميم المواقع · موجز المشروع',
      heading: (n) => `شكراً لكم، ${n}. وصلنا موجز مشروعكم.`,
      body: 'سنراجعه ونرد عليكم عبر البريد الإلكتروني، وغالباً خلال يومَي عمل، بالخطوات التالية وعرض سعر مبدئي.',
      summaryTitle: 'موجزكم',
      stepsTitle: 'ماذا يحدث بعد ذلك',
      steps: [
        ['نراجع موجزكم', 'ندرس ما تحتاجون إليه والباقة الأنسب لكم.'],
        ['العرض والسعر', 'نرد بالنطاق والسعر والمواعيد، ويبدأ العمل بعد موافقتكم.'],
        ['التصميم والتطوير والإطلاق', 'تشمل الباقة جولتَي تعديل، ثم نختبر الموقع ونطلقه.'],
      ],
      cta: 'تعرّفوا على باقاتنا',
      ctaPath: '/services/website-design',
      why: 'تصلكم هذه الرسالة لأنكم أرسلتم موجز مشروع عبر gizmentor.com.',
    },
    contact: {
      subject: 'وصلتنا رسالتكم — GizMentor',
      eyebrow: 'GizMentor · تواصل معنا',
      heading: (n) => `شكراً لكم، ${n}. وصلتنا رسالتكم.`,
      body: 'سيرد عليكم الشخص المناسب من فريقنا عبر البريد الإلكتروني.',
      summaryTitle: 'استفساركم',
      cta: 'زوروا gizmentor.com',
      ctaPath: '/',
      why: 'تصلكم هذه الرسالة لأنكم تواصلتم معنا عبر gizmentor.com.',
    },
    labels: { package: 'الباقة', projectType: 'نوع المشروع', timeline: 'الجدول الزمني', inquiry: 'نوع الاستفسار' },
    signoff: 'فريق GizMentor',
    note: 'إذا أردتم إضافة شيء، يكفي الرد على هذه الرسالة.',
  },
};

/** The visitor's confirmation. Only their name and choices from fixed lists are echoed back. */
function confirmation(form, d, locale, env) {
  const lang = locale === 'ar' ? 'ar' : 'en';
  const L = LABELS[lang];
  const c = CONFIRM[lang];
  const k = c[form === 'brief' ? 'brief' : 'contact'];
  const name = d.name.slice(0, 60);
  const summary = form === 'brief'
    ? [[c.labels.package, L.package[d.package]], [c.labels.projectType, L.projectType[d.projectType]], [c.labels.timeline, L.timeline[d.timeline]]]
    : [[c.labels.inquiry, L.inquiry[d.inquiryType]]];
  const site = lang === 'ar' ? 'https://gizmentor.com/ar' : 'https://gizmentor.com';
  const heading = k.heading(name);
  return {
    to: d.email,
    reply_to: form === 'contact' && PARTNER_TYPES.includes(d.inquiryType) ? env.PARTNERS_TO : env.LEADS_TO,
    subject: k.subject,
    text: [heading, k.body, ...summary.map(([a, b]) => `${a}: ${b}`), c.note, c.signoff].join('\n\n'),
    html: renderEmail({
      lang,
      title: k.subject,
      preheader: k.body,
      eyebrow: k.eyebrow,
      heading,
      paragraphs: [k.body],
      summaryTitle: k.summaryTitle,
      summary,
      stepsTitle: k.stepsTitle,
      steps: k.steps,
      cta: { label: k.cta, url: `${site}${k.ctaPath === '/' ? '' : k.ctaPath}` },
      signoff: c.signoff,
      note: c.note,
      why: k.why,
    }),
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const cors = allowed.includes(origin)
      ? { 'access-control-allow-origin': origin, vary: 'origin', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' }
      : {};

    if (request.method === 'OPTIONS') return new Response(null, { status: cors['access-control-allow-origin'] ? 204 : 403, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors);
    if (!cors['access-control-allow-origin']) return json({ ok: false, error: 'origin' }, 403, cors);
    if (!env.RESEND_API_KEY || !env.MAIL_FROM || !env.LEADS_TO) return json({ ok: false, error: 'unavailable' }, 503, cors);

    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ ok: false, error: 'invalid' }, 413, cors);
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ ok: false, error: 'invalid' }, 400, cors);
    }
    if (!body || typeof body !== 'object') return json({ ok: false, error: 'invalid' }, 400, cors);

    // Bots fill the hidden field or submit instantly: answer as if it worked and send nothing.
    const elapsed = Date.now() - Number(body.startedAt);
    if (body.website || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return json({ ok: true }, 200, cors);

    const form = body.form === 'brief' ? 'brief' : body.form === 'contact' ? 'contact' : null;
    const data = form === 'brief' ? validateBrief(body) : form === 'contact' ? validateContact(body) : null;
    if (!data) return json({ ok: false, error: 'invalid' }, 400, cors);
    const locale = body.locale === 'ar' ? 'ar' : 'en';

    let verified = false;
    if (env.TURNSTILE_SECRET_KEY) {
      verified = await passesTurnstile(env, body.turnstileToken, request.headers.get('cf-connecting-ip'));
      if (!verified) return json({ ok: false, error: 'verification' }, 403, cors);
    }

    const team = form === 'brief' ? briefEmails(data, env) : contactEmails(data, env);
    if (!(await send(env, { ...team, reply_to: data.email }))) return json({ ok: false, error: 'send' }, 502, cors);
    if (verified) await send(env, confirmation(form, data, locale, env)); // a failed confirmation does not lose the lead

    return json({ ok: true }, 200, cors);
  },
};
