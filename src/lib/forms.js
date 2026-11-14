import { forms } from '../config/site.js';

/**
 * Posts a form to the forms Worker. Resolves to { ok: true } or { ok: false, error }, where error is
 * 'invalid' | 'verification' | 'send' | 'unavailable' | 'network'. Never throws.
 */
export async function submitForm(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(forms.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) return { ok: true };
    return { ok: false, error: data.error || 'unavailable' };
  } catch {
    return { ok: false, error: 'network' };
  } finally {
    clearTimeout(timer);
  }
}

/** "3,900" in Latin digits for both languages (prices sit in .latin spans). */
export const formatAmount = (n) => new Intl.NumberFormat('en-US').format(n);

/** Rounded USD equivalent of an AED amount: to the nearest 5 under 1,000, else the nearest 10. */
export function usdFromAed(aed, rate) {
  const usd = aed / rate;
  const step = usd < 1000 ? 5 : 10;
  return Math.round(usd / step) * step;
}
