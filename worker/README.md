# Forms Worker (forms.gizmentor.com)

Receives the website's two forms and emails them, so visitors never need their own email app:

- **Contact** (`/contact`): to `LEADS_TO`, or `PARTNERS_TO` for partner and merchant enquiries.
- **Project brief** (`/services/website-design/brief`): to `LEADS_TO`, subject starting `[Brief]`.

Each visitor also gets a short confirmation in their language, once Turnstile has verified them.

Runs on the Cloudflare Workers free plan and sends through Resend's free plan. Code: `src/index.js`;
settings: `wrangler.toml`; deploy: `.github/workflows/deploy-forms.yml` (on merges that change
`worker/`, or by hand: Actions → Deploy forms → Run workflow).

## One-time setup

1. **Resend:** create an account at resend.com, add the domain `send.gizmentor.com`, and add the DNS
   records it shows in Cloudflare (gizmentor.com → DNS). Wait until Resend says *Verified*, then create
   an API key with *Sending access* for that domain.
2. **Turnstile:** Cloudflare dashboard → Turnstile → Add widget, hostnames `gizmentor.com` and
   `www.gizmentor.com`, mode *Managed*. The **site key** is public: put it in `src/config/site.js`
   (`forms.turnstileSiteKey`). The **secret key** is not.
3. **Cloudflare API token:** Cloudflare → My Profile → API Tokens → Create token → template
   *Edit Cloudflare Workers*, limited to GizMentor's account and the gizmentor.com zone.
4. **GitHub:** repo → Settings → Environments → `production` → add secrets
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`.
5. Run Actions → Deploy forms → Run workflow. It deploys, copies the two secrets into the Worker and
   checks that forms.gizmentor.com answers.

Never commit any of these values. Without `TURNSTILE_SECRET_KEY` the Worker still accepts forms (with
a hidden field and a minimum fill time against bots) but sends no confirmations to visitors.

## Limits (free plans, checked November 2026)

- Workers: 100,000 requests a day.
- Resend: 100 emails a day. Each form sends two (team + confirmation), so about 50 submissions a day.
  Past that, Resend Pro is a paid plan: ask before upgrading.
