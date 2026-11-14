import { useEffect, useRef } from 'react';
import { forms } from '../../config/site';

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading;

function loadScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = () => { loading = null; reject(new Error('turnstile')); };
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * Cloudflare Turnstile check, rendered only when a site key is configured (src/config/site.js).
 * Calls onToken(token) when the visitor passes and onToken('') when the token expires.
 */
export default function Turnstile({ onToken, language }) {
  const ref = useRef(null);
  const cb = useRef(onToken);
  useEffect(() => { cb.current = onToken; }, [onToken]);

  useEffect(() => {
    if (!forms.turnstileSiteKey) return undefined;
    let id;
    let cancelled = false;
    loadScript()
      .then((ts) => {
        if (cancelled || !ref.current) return;
        id = ts.render(ref.current, {
          sitekey: forms.turnstileSiteKey,
          language,
          theme: 'auto',
          callback: (token) => cb.current(token),
          'expired-callback': () => cb.current(''),
          'error-callback': () => cb.current(''),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (id !== undefined && window.turnstile) window.turnstile.remove(id);
    };
  }, [language]);

  if (!forms.turnstileSiteKey) return null;
  return <div ref={ref} className="turnstile" />;
}
