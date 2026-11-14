# Forms Worker (gizmentor-forms)

Receives the website's two forms and emails them, so visitors never need their own email app:

- **Contact** (`/contact`): to `LEADS_TO`, or `PARTNERS_TO` for partner and merchant enquiries.
- **Project brief** (`/services/website-design/brief`): to `LEADS_TO`, subject starting `[Brief]`.

Each visitor also gets a short confirmation in their language, once Turnstile has verified them.

Address: `https://gizmentor-forms.soft-hill-9932.workers.dev` (Cloudflare `workers.dev`). gizmentor.com's DNS
is not on Cloudflare, so there is no custom domain; visitors never see this address.

Code: `src/index.js`; settings: `wrangler.toml`; deploy: `.github/workflows/deploy-forms.yml` (on merges that
change `worker/`, or by hand: Actions → Deploy forms → Run workflow). It can also be deployed with the
Cloudflare API (script upload with the same `[vars]` as plain-text bindings, keeping secrets).

## Setup (done November 2026)

- **Turnstile:** widget "gizmentor forms" for `gizmentor.com` and `www.gizmentor.com`. The site key is public
  and in `src/config/site.js`; the secret is stored only in the Worker as `TURNSTILE_SECRET_KEY`.
- **Resend:** sending domain `send.gizmentor.com` (eu-west-1). Its DNS records (DKIM TXT
  `resend._domainkey.send`, MX and SPF TXT on `send.send`, CNAME `rsend.send`) live with gizmentor.com's DNS
  provider. The Worker's `RESEND_API_KEY` secret is a sending-only key for that domain.
- **GitHub deploy (optional):** production environment secrets `CLOUDFLARE_API_TOKEN` (template "Edit
  Cloudflare Workers") and `CLOUDFLARE_ACCOUNT_ID`. Without them the workflow skips with a warning.

Never commit any key. Without `TURNSTILE_SECRET_KEY` the Worker still accepts forms (with a hidden field and a
minimum fill time against bots) but sends no confirmations to visitors.

## Limits (free plans, checked November 2026)

- Workers: 100,000 requests a day.
- Resend: 100 emails a day and 3,000 a month, shared with every other sender on the same Resend account
  (Easelect's sign-in codes). Each form sends two (team + confirmation). Past that, Resend Pro is a paid plan:
  ask before upgrading.
