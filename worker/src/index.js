/**
 * forms.gizmentor.com: receives the website's Contact form and the website-design project brief,
 * emails them to the team through Resend, and sends the visitor a short confirmation.
 *
 * Secrets (set in Cloudflare or by .github/workflows/deploy-forms.yml, never in this repo):
 *   RESEND_API_KEY        Resend API key with sending access for the MAIL_FROM domain
 *   TURNSTILE_SECRET_KEY  Cloudflare Turnstile secret. When set, every submission must pass Turnstile.
 * Plain settings are in wrangler.toml [vars].
 *
 * Recipients are fixed here and in wrangler.toml; nothing in a request can choose where mail goes.
 * The visitor's confirmation is only sent after Turnstile passes, so the form cannot be used to
 * mail strangers.
 */

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
    package: { launch: 'Launch', business: 'Business', elite: 'Elite', care: 'Care plan', unsure: 'Not sure yet' },
    projectType: { new: 'New website', redesign: 'Redesign', landing: 'Landing page', ecommerce: 'Online store', other: 'Something else' },
    budget: { '3900-9900': 'AED 3,900–9,900', '9900-25000': 'AED 9,900–25,000', '25000-50000': 'AED 25,000–50,000', '50000+': 'AED 50,000+', unsure: 'Not sure yet' },
    timeline: { asap: 'As soon as possible', '1-2m': 'In 1–2 months', '3m+': 'In 3 months or more', flexible: 'Flexible' },
  },
  ar: {
    package: { launch: 'الانطلاق', business: 'الأعمال', elite: 'النخبة', care: 'خطة الرعاية', unsure: 'لم أقرر بعد' },
    projectType: { new: 'موقع جديد', redesign: 'إعادة تصميم', landing: 'صفحة هبوط', ecommerce: 'متجر إلكتروني', other: 'شيء آخر' },
    budget: { '3900-9900': '3,900–9,900 درهم', '9900-25000': '9,900–25,000 درهم', '25000-50000': '25,000–50,000 درهم', '50000+': '50,000+ درهم', unsure: 'لم أقرر بعد' },
    timeline: { asap: 'في أقرب وقت', '1-2m': 'خلال شهر إلى شهرين', '3m+': 'بعد ثلاثة أشهر أو أكثر', flexible: 'مرن' },
  },
};

const json = (body, status, cors) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors } });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
    pages: oneOf(b.pages, BRIEF.pages),
    features,
    featureNotes: text(b.featureNotes, 2000),
    budget: oneOf(b.budget, BRIEF.budget),
    timeline: oneOf(b.timeline, BRIEF.timeline),
    deadline: text(b.deadline, 200),
    references: text(b.references, 2000),
    assets: oneOf(b.assets, BRIEF.assets),
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

/** Plain text and HTML for the team: one "Label: value" row per filled field. */
function teamEmail(title, rows) {
  const filled = rows.filter(([, v]) => v);
  const textBody = `${title}\n\n${filled.map(([k, v]) => `${k}:\n${v}\n`).join('\n')}`;
  const html =
    `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#394854">` +
    `<h2 style="font-size:18px;margin:0 0 16px">${esc(title)}</h2>` +
    filled
      .map(([k, v]) => `<p style="margin:0 0 14px"><strong>${esc(k)}</strong><br>${esc(v).replace(/\n/g, '<br>')}</p>`)
      .join('') +
    `</div>`;
  return { text: textBody, html };
}

function contactEmails(d, env) {
  const to = PARTNER_TYPES.includes(d.inquiryType) ? env.PARTNERS_TO : env.LEADS_TO;
  const { text: t, html } = teamEmail(`Website enquiry: ${d.inquiryType}`, [
    ['Name', d.name],
    ['Email', d.email],
    ['Organisation', d.organisation],
    ['Enquiry type', d.inquiryType],
    ['Product', d.product],
    ['Message', d.message],
  ]);
  return { to, subject: `[Contact] ${d.inquiryType} enquiry from ${d.name}`, text: t, html };
}

function briefEmails(d, env) {
  const L = LABELS.en;
  const { text: t, html } = teamEmail('New website project brief', [
    ['Name', d.name],
    ['Email', d.email],
    ['Company', d.company],
    ['Country', d.country],
    ['Package', L.package[d.package]],
    ['Project type', L.projectType[d.projectType]],
    ['Goals', d.goals],
    ['Audience', d.audience],
    ['Current website', d.currentSite],
    ['Pages', d.pages],
    ['Features', d.features.join(', ')],
    ['Feature notes', d.featureNotes],
    ['Budget', L.budget[d.budget]],
    ['Timeline', L.timeline[d.timeline]],
    ['Deadline', d.deadline],
    ['Reference sites', d.references],
    ['Brand assets', d.assets],
    ['Assets link', d.assetsLink],
    ['Revision policy', d.agreed ? 'Accepted (2 revision rounds; later changes from Care hours or quoted)' : ''],
  ]);
  return { to: env.LEADS_TO, subject: `[Brief] ${L.projectType[d.projectType]} · ${L.budget[d.budget]} · ${d.name}`, text: t, html };
}

/** The visitor's confirmation. Only their name and choices from fixed lists are echoed back. */
function confirmation(form, d, locale, env) {
  const ar = locale === 'ar';
  const L = LABELS[ar ? 'ar' : 'en'];
  const name = d.name.slice(0, 60);
  const lines = ar
    ? [
        `مرحباً ${name}،`,
        form === 'brief'
          ? 'شكراً لكم، وصلنا موجز مشروعكم. سنراجعه ونرد عليكم عبر البريد الإلكتروني، وغالباً خلال يومَي عمل، بالخطوات التالية وعرض سعر مبدئي.'
          : 'شكراً لتواصلكم مع GizMentor. وصلتنا رسالتكم وسيرد عليكم الشخص المناسب من فريقنا عبر البريد الإلكتروني.',
        ...(form === 'brief'
          ? [`نوع المشروع: ${L.projectType[d.projectType]}`, `الميزانية: ${L.budget[d.budget]}`, `الجدول الزمني: ${L.timeline[d.timeline]}`]
          : []),
        'إذا أردتم إضافة شيء، يكفي الرد على هذه الرسالة.',
        'فريق GizMentor',
      ]
    : [
        `Hello ${name},`,
        form === 'brief'
          ? 'Thank you, we have your project brief. We will review it and reply by email, usually within two working days, with next steps and an initial quote.'
          : 'Thank you for contacting GizMentor. We have your message and the right person on our team will reply by email.',
        ...(form === 'brief'
          ? [`Project type: ${L.projectType[d.projectType]}`, `Budget: ${L.budget[d.budget]}`, `Timeline: ${L.timeline[d.timeline]}`]
          : []),
        'To add anything, just reply to this email.',
        'The GizMentor team',
      ];
  const dir = ar ? 'rtl' : 'ltr';
  return {
    to: d.email,
    reply_to: form === 'contact' && PARTNER_TYPES.includes(d.inquiryType) ? env.PARTNERS_TO : env.LEADS_TO,
    subject: ar
      ? form === 'brief' ? 'وصلنا موجز مشروعكم — GizMentor' : 'وصلتنا رسالتكم — GizMentor'
      : form === 'brief' ? 'We received your project brief — GizMentor' : 'We received your message — GizMentor',
    text: lines.join('\n\n'),
    html:
      `<div dir="${dir}" style="font-family:system-ui,Tahoma,sans-serif;font-size:15px;line-height:1.6;color:#394854;max-width:560px">` +
      lines.map((l) => `<p style="margin:0 0 14px">${esc(l)}</p>`).join('') +
      `<p style="margin:24px 0 0;font-size:13px;color:#8b959d">GizMentor FZCO · <a href="https://gizmentor.com" style="color:#8b959d">gizmentor.com</a></p>` +
      `</div>`,
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
