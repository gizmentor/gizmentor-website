// Renders the email logos (emblem + "GizMentor" wordmark) to public/email/logo-{light,dark}.png at 2x.
// Run once after a logo change: node scripts/email-logos.cjs (needs Playwright with Chromium).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const svg = fs.readFileSync(path.join(root, 'src/assets/gizmentor-emblem.svg'), 'utf8');
const font = fs.readFileSync(path.join(root, 'node_modules/@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2')).toString('base64');
const page = (ink) => `<html><head><style>
@font-face{font-family:IT;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}
html,body{margin:0;background:transparent}
#l{display:inline-flex;align-items:center;gap:10px;padding:0}
#l svg{width:36px;height:36px}
#l span{font-family:IT;font-weight:600;font-size:26px;letter-spacing:-0.03em;color:${ink}}
</style></head><body><div id="l">${svg}<span>GizMentor</span></div></body></html>`;
(async () => {
  const b = await chromium.launch();
  for (const [name, ink] of [['light', '#394854'], ['dark', '#e8ecef']]) {
    const p = await b.newPage({ deviceScaleFactor: 2 });
    await p.setContent(page(ink));
    await p.evaluate(() => document.fonts.ready);
    const el = await p.$('#l');
    console.log(name, await el.boundingBox());
    await el.screenshot({ path: path.join(root, `public/email/logo-${name}.png`), omitBackground: true });
  }
  await b.close();
})();
