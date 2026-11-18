// GizMentor's branded email, used for the visitor's confirmation and the team's copy of each form.
// Same structure as Easelect's customer email (easelect-web email/build.mjs): logo, one card with an
// eyebrow, heading and message, a summary table, numbered next steps, a button, then the footer.
// Colours are the site's tokens (src/styles/index.css). Light colours are inline, what every client
// gets; the dark set is applied by prefers-color-scheme (Apple Mail, Outlook for Mac and iOS) and by
// Outlook.com's data-ogsc. Gmail ignores both and inverts colours itself.
// Logos are served by gizmentor.com from public/email/ (made by scripts/email-logos.cjs).

const SITE = 'https://gizmentor.com';
const IMG = `${SITE}/email`;

// [light, dark]
const C = {
  page: ['#F2F3F4', '#11171C'],
  card: ['#FFFFFF', '#1B242B'],
  line: ['#DADEE1', '#2C363E'],
  muted: ['#F2F3F4', '#161E24'],
  text: ['#394854', '#E8ECEF'],
  body: ['#4A5864', '#C4CCD2'],
  sub: ['#5D6A74', '#AAB3BA'],
  red: ['#D0000F', '#FF4553'],
  button: ['#394854', '#E8ECEF'],
  onButton: ['#FFFFFF', '#11171C'],
};

const FONT = {
  en: "'Inter Tight', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  ar: "'Readex Pro', 'IBM Plex Sans Arabic', 'Geeza Pro', Tahoma, 'Segoe UI', Arial, sans-serif",
};

const FOOTER = {
  en: { company: 'GizMentor FZCO · United Arab Emirates', privacy: 'Privacy' },
  ar: { company: 'GizMentor FZCO · الإمارات العربية المتحدة', privacy: 'الخصوصية' },
};

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const darkRules = (pre) => `
${pre}.bg-page{background-color:${C.page[1]}!important}
${pre}.bg-card{background-color:${C.card[1]}!important;border-color:${C.line[1]}!important}
${pre}.bar{border-top-color:${C.red[1]}!important}
${pre}.bg-muted{background-color:${C.muted[1]}!important}
${pre}.bg-button{background-color:${C.button[1]}!important}
${pre}.t-text{color:${C.text[1]}!important}
${pre}.t-body{color:${C.body[1]}!important}
${pre}.t-sub{color:${C.sub[1]}!important}
${pre}.t-red{color:${C.red[1]}!important}
${pre}.t-onbutton{color:${C.onButton[1]}!important}
${pre}.rule{border-color:${C.line[1]}!important}`;

/**
 * One email as HTML. Every string is escaped here, so callers pass plain text.
 * @param {object} o
 * @param {'en'|'ar'} o.lang
 * @param {string} o.title       <title> and the preheader fallback
 * @param {string} [o.preheader] inbox preview line
 * @param {string} o.eyebrow     small red line above the heading
 * @param {string} o.heading
 * @param {string[]} o.paragraphs
 * @param {string} [o.summaryTitle]
 * @param {[string,string][]} [o.summary] label/value rows; empty values are left out
 * @param {string} [o.stepsTitle]
 * @param {[string,string][]} [o.steps] numbered title/line pairs
 * @param {{label:string,url:string}} [o.cta]
 * @param {string} [o.signoff]
 * @param {string} [o.note]      small line under the sign-off
 * @param {string} [o.why]       footer line: why this email came
 */
export function renderEmail(o) {
  const lang = o.lang === 'ar' ? 'ar' : 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const align = lang === 'ar' ? 'right' : 'left';
  const font = FONT[lang];
  const home = lang === 'ar' ? `${SITE}/ar` : SITE;
  const f = FOOTER[lang];
  const p = (text, cls, style) => `<p class="${cls}" style="margin:0;font-family:${font};${style}">${esc(text)}</p>`;

  const paragraphs = o.paragraphs
    .map((t, i) => `<p class="t-body" style="margin:${i ? 14 : 16}px 0 0 0;font-family:${font};font-size:16px;line-height:26px;color:${C.body[0]}">${esc(t).replace(/\n/g, '<br>')}</p>`)
    .join('');

  const rows = (o.summary || []).filter(([, v]) => v);
  const summary = rows.length
    ? `
        <tr><td class="pad" style="padding:24px 32px 0 32px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-muted" style="background-color:${C.muted[0]};border-radius:12px" dir="${dir}">
            ${o.summaryTitle ? `<tr><td colspan="2" style="padding:18px 20px 6px 20px;text-align:${align}">${p(o.summaryTitle, 't-red', `font-size:12px;line-height:16px;font-weight:600;letter-spacing:${lang === 'ar' ? '0' : '.06em'};text-transform:uppercase;color:${C.red[0]}`)}</td></tr>` : ''}
            ${rows
              .map(
                ([k, v], i) => `<tr>
              <td valign="top" style="padding:${i ? 8 : 10}px 12px ${i === rows.length - 1 ? 18 : 0}px 20px;width:38%;text-align:${align}">${p(k, 't-sub', `font-size:14px;line-height:21px;color:${C.sub[0]}`)}</td>
              <td valign="top" style="padding:${i ? 8 : 10}px 20px ${i === rows.length - 1 ? 18 : 0}px 0;text-align:${align}"><p class="t-text" style="margin:0;font-family:${font};font-size:14px;line-height:21px;font-weight:500;color:${C.text[0]}">${esc(v).replace(/\n/g, '<br>')}</p></td>
            </tr>`,
              )
              .join('')}
          </table>
        </td></tr>`
    : '';

  const steps = (o.steps || []).length
    ? `
        <tr><td class="pad" style="padding:32px 32px 0 32px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="rule" style="border-top:1px solid ${C.line[0]};font-size:0;line-height:0">&nbsp;</td></tr></table>
        </td></tr>
        <tr><td class="pad" style="padding:24px 32px 0 32px;text-align:${align}">
          ${o.stepsTitle ? p(o.stepsTitle, 't-text', `margin:0 0 16px 0;font-size:16px;line-height:22px;font-weight:600;color:${C.text[0]}`) : ''}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${dir}">${o.steps
            .map(
              ([head, line], i) => `
            <tr>
              <td width="40" valign="top" style="padding:${o.stepsTitle && i === 0 ? 16 : 0}px 0 14px 0">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td class="bg-muted t-red" width="28" height="28" align="center" valign="middle" style="width:28px;height:28px;border-radius:14px;background-color:${C.muted[0]};color:${C.red[0]};font-family:${font};font-size:13px;font-weight:600;line-height:28px">${i + 1}</td>
                </tr></table>
              </td>
              <td valign="top" style="padding:${o.stepsTitle && i === 0 ? 16 : 0}px 0 14px 0;text-align:${align}">
                ${p(head, 't-text', `font-size:15px;line-height:22px;font-weight:600;color:${C.text[0]}`)}
                ${p(line, 't-sub', `margin-top:2px;font-size:14px;line-height:21px;color:${C.sub[0]}`)}
              </td>
            </tr>`,
            )
            .join('')}
          </table>
        </td></tr>`
    : '';

  const cta = o.cta
    ? `
        <tr><td class="pad" style="padding:24px 32px 0 32px" align="${align}">
          <table role="presentation" class="button" cellpadding="0" cellspacing="0" border="0" align="${align}"><tr>
            <td class="bg-button" align="center" bgcolor="${C.button[0]}" style="background-color:${C.button[0]};border-radius:999px">
              <a class="t-onbutton" href="${esc(o.cta.url)}" style="display:inline-block;padding:14px 28px;font-family:${font};font-size:15px;line-height:20px;font-weight:600;color:${C.onButton[0]};text-decoration:none;border-radius:999px">${esc(o.cta.label)}</a>
            </td>
          </tr></table>
        </td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(o.title)}</title>
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
html{background-color:${C.page[0]}}
body{margin:0!important;padding:0!important;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}
img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;display:block}
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
.logo-dark{display:none;mso-hide:all;max-height:0;overflow:hidden}
@media screen and (max-width:620px){
  .wrap{width:100%!important}
  .pad{padding-left:20px!important;padding-right:20px!important}
  .gutter{padding-left:12px!important;padding-right:12px!important}
  .h1{font-size:24px!important;line-height:31px!important}
}
@media (prefers-color-scheme:dark){
  html{background-color:${C.page[1]}!important}
${darkRules('')}
  .logo-light{display:none!important;max-height:0!important;overflow:hidden!important}
  .logo-dark{display:block!important;max-height:none!important;overflow:visible!important}
}
${darkRules('[data-ogsc] ')}
</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:${C.page[0]}">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${esc(o.preheader || o.title)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" class="bg-page" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.page[0]}">
<tr><td align="center" class="gutter" style="padding:32px 16px">
  <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
  <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;border-collapse:separate" dir="${dir}">

    <tr><td align="center" style="padding:0 0 20px 0">
      <a href="${home}" style="text-decoration:none">
        <img class="logo-light" src="${IMG}/logo-light.png" width="163" height="36" alt="GizMentor" style="width:163px;height:36px">
        <!--[if !mso]><!--><img class="logo-dark" src="${IMG}/logo-dark.png" width="163" height="36" alt="GizMentor" style="width:163px;height:36px"><!--<![endif]-->
      </a>
    </td></tr>

    <tr><td class="bg-card bar" style="background-color:${C.card[0]};border:1px solid ${C.line[0]};border-top:3px solid ${C.red[0]};border-radius:4px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="pad" style="padding:32px 32px 0 32px;text-align:${align}">
          ${p(o.eyebrow, 't-red', `margin:0 0 10px 0;font-size:13px;line-height:18px;font-weight:600;letter-spacing:${lang === 'ar' ? '0' : '.02em'};color:${C.red[0]}`)}
          <h1 class="h1 t-text" style="margin:0;font-family:${font};font-size:28px;line-height:35px;font-weight:600;letter-spacing:${lang === 'ar' ? '0' : '-.02em'};color:${C.text[0]}">${esc(o.heading)}</h1>
          ${paragraphs}
        </td></tr>
        ${summary}
        ${cta}
        ${steps}
        <tr><td class="pad" style="padding:${o.steps?.length ? 8 : 28}px 32px 32px 32px;text-align:${align}">
          ${o.signoff ? p(o.signoff, 't-text', `font-size:15px;line-height:22px;font-weight:600;color:${C.text[0]}`) : ''}
          ${o.note ? p(o.note, 't-sub', `margin-top:4px;font-size:14px;line-height:21px;color:${C.sub[0]}`) : ''}
        </td></tr>
      </table>
    </td></tr>

    <tr><td align="center" style="padding:24px 8px 0 8px">
      ${o.why ? `<p class="t-sub" style="margin:0 0 6px 0;font-family:${font};font-size:13px;line-height:20px;color:${C.sub[0]}">${esc(o.why)}</p>` : ''}
      <p class="t-sub" style="margin:0;font-family:${font};font-size:13px;line-height:20px;color:${C.sub[0]}">${esc(f.company)}<br>
        <a class="t-sub" href="${home}" style="color:${C.sub[0]};text-decoration:underline">gizmentor.com</a>
        &nbsp;·&nbsp;<a class="t-sub" href="${home}/privacy" style="color:${C.sub[0]};text-decoration:underline">${f.privacy}</a></p>
    </td></tr>

  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}
