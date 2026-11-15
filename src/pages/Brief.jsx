import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Button from '../components/ui/Button';
import Turnstile from '../components/ui/Turnstile';
import { useLocale } from '../i18n/useLocale';
import { company, designPackages, designServices, forms } from '../config/site';
import { submitForm } from '../lib/forms';

// Option values match worker/src/index.js, which rejects anything else.
const OPTIONS = {
  package: ['launch', 'business', 'elite', 'care', 'unsure'],
  projectType: ['new', 'redesign', 'landing', 'ecommerce', 'other'],
  timeline: ['asap', '1-2m', '3m+', 'flexible'],
};

// The budget question was removed (2026-11-15). The forms Worker deployed before then requires a budget,
// so the brief still sends 'unsure'; the current Worker leaves it out of the emails.
const NO_BUDGET = 'unsure';

const PRICE = Object.fromEntries(designPackages.map((p) => [p.key, p.fromAed]));

const empty = { package: null, projectType: '', goals: '', timeline: '', name: '', email: '', company: '', agreed: false };

const noopSubscribe = () => () => {};

function Select({ name, label, options, values, value, onChange, placeholder, describe }) {
  return (
    <div className="form-group">
      <label htmlFor={`brief-${name}`}>{label}</label>
      <select id={`brief-${name}`} name={name} className="form-control" required value={value} onChange={onChange}>
        <option value="" disabled>{placeholder}</option>
        {values.map((v) => <option key={v} value={v}>{describe ? describe(v, options[v]) : options[v]}</option>)}
      </select>
    </div>
  );
}

function Field({ name, label, hint, optional, multiline, ...rest }) {
  const hintId = hint ? `${name}-hint` : undefined;
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div className="form-group">
      <label htmlFor={`brief-${name}`}>{label}{optional && <> <span className="optional">{optional}</span></>}</label>
      {hint && <p id={hintId} className="form-hint">{hint}</p>}
      <Tag id={`brief-${name}`} name={name} className="form-control" aria-describedby={hintId} {...rest} />
    </div>
  );
}

/** The project brief: one short form, dropdowns for the fixed choices (simplified 2026-11-15). */
export default function Brief() {
  const { t, locale, to } = useLocale();
  const b = t.brief;
  const f = b.fields;
  const [params] = useSearchParams();
  // Prerendered HTML has no query string, so ?package= is applied on the client only (as on Contact).
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const urlPackage = isClient && OPTIONS.package.includes(params.get('package')) ? params.get('package') : '';

  const [data, setData] = useState(empty);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const startedAt = useRef(0);
  const headingRef = useRef(null);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  useEffect(() => {
    if (status === 'sent') headingRef.current?.focus({ preventScroll: true });
  }, [status]);

  const pkg = data.package ?? urlPackage;
  const set = (name, value) => setData((d) => ({ ...d, [name]: value }));
  const onText = (e) => set(e.target.name, e.target.value);
  const describePackage = (v, name) => (PRICE[v] ? `${name} · ${b.from(PRICE[v])}` : name);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError(null);
    const res = await submitForm({
      form: 'brief',
      locale,
      ...data,
      package: pkg,
      budget: NO_BUDGET,
      features: [],
      website: e.currentTarget.elements.website?.value || '',
      startedAt: startedAt.current,
      turnstileToken: token,
    });
    if (res.ok) {
      setStatus('sent');
    } else {
      setStatus('error');
      setError(res.error);
    }
  };

  return (
    <>
      <PageHero id="brief-title" word={b.hero.word} eyebrow={b.hero.eyebrow} title={b.hero.title} lead={b.hero.lead} next="brief" />

      <section className="section" id="brief" aria-labelledby="brief-title">
        <div className="container container-narrow">
          {status === 'sent' ? (
            <div className="brief-done">
              <h2 className="section-title" tabIndex={-1} ref={headingRef}>{b.success.title}</h2>
              <p className="section-lead">
                {b.success.body}
                {forms.turnstileSiteKey && <> {b.success.confirmation(data.email)}</>}
              </p>
              <div className="btn-row"><Button to={designServices.path} variant="secondary">{b.success.back}</Button></div>
            </div>
          ) : (
            <form className="brief-form" onSubmit={onSubmit}>
              <div className="form-row">
                <Select name="package" label={f.package.label} options={f.package.options} values={OPTIONS.package} value={pkg} onChange={onText} placeholder={b.choose} describe={describePackage} />
                <Select name="projectType" label={f.projectType.label} options={f.projectType.options} values={OPTIONS.projectType} value={data.projectType} onChange={onText} placeholder={b.choose} />
              </div>
              <Field name="goals" label={f.goals.label} hint={f.goals.hint} multiline rows={3} required maxLength={3000} value={data.goals} onChange={onText} />
              <Select name="timeline" label={f.timeline.label} options={f.timeline.options} values={OPTIONS.timeline} value={data.timeline} onChange={onText} placeholder={b.choose} />
              <div className="form-row">
                <Field name="name" label={f.name} autoComplete="name" required maxLength={120} value={data.name} onChange={onText} />
                <Field name="email" label={f.email} type="email" dir="ltr" autoComplete="email" required maxLength={254} value={data.email} onChange={onText} />
              </div>
              <Field name="company" label={f.company} optional={b.optional} autoComplete="organization" maxLength={160} value={data.company} onChange={onText} />
              <label className="consent">
                <input type="checkbox" name="agreed" checked={data.agreed} onChange={(e) => set('agreed', e.target.checked)} required />
                <span>{f.agreed}</span>
              </label>
              <div className="hp-field" aria-hidden="true">
                <label htmlFor="brief-website">Website</label>
                <input id="brief-website" name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <Turnstile onToken={setToken} language={locale} />

              {status === 'error' && (
                <p className="form-error" role="alert">
                  {error === 'invalid' || error === 'verification' ? b.errors[error] : (
                    <>{b.errors.other} <a href={`mailto:${company.email}`} className="latin">{company.email}</a>.</>
                  )}
                </p>
              )}

              <div className="brief-nav">
                <p className="form-note">{b.privacy} <Link to={to('/privacy')}>{b.privacyLink}</Link>.</p>
                <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
                  <span>{status === 'sending' ? b.sending : b.submit}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
