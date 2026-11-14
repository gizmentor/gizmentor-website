import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import Button from '../components/ui/Button';
import Turnstile from '../components/ui/Turnstile';
import { useLocale } from '../i18n/useLocale';
import { company, designPackages, designServices, forms } from '../config/site';
import { PriceInline } from '../components/services/Price';
import { submitForm } from '../lib/forms';

// Option values match worker/src/index.js, which rejects anything else.
const OPTIONS = {
  package: ['launch', 'business', 'elite', 'care', 'unsure'],
  projectType: ['new', 'redesign', 'landing', 'ecommerce', 'other'],
  pages: ['1', '2-5', '6-10', '10+', 'unsure'],
  features: ['bilingual', 'cms', 'blog', 'seo', 'analytics', 'booking', 'ecommerce', 'payments', 'chat', 'automation', 'integrations', 'care'],
  budget: ['3900-9900', '9900-25000', '25000-50000', '50000+', 'unsure'],
  timeline: ['asap', '1-2m', '3m+', 'flexible'],
  assets: ['ready', 'partial', 'none'],
};

// A package chosen on the pricing page suggests a budget; the visitor can change it.
const BUDGET_FOR = { launch: '3900-9900', business: '9900-25000', elite: '25000-50000' };

const empty = {
  package: null, projectType: '', goals: '', audience: '', currentSite: '', pages: '', features: [], featureNotes: '',
  budget: null, timeline: '', deadline: '', references: '', assets: '', assetsLink: '',
  name: '', email: '', company: '', country: '', agreed: false,
};

const noopSubscribe = () => () => {};

/** One radio or checkbox drawn as a tile. */
function Choice({ type = 'radio', name, value, checked, onChange, label, required }) {
  return (
    <label className={`choice${checked ? ' is-checked' : ''}`}>
      <input type={type} name={name} value={value} checked={checked} onChange={onChange} required={required} />
      <span className="choice-box" aria-hidden="true"><Check size={14} strokeWidth={2.4} /></span>
      <span>{label}</span>
    </label>
  );
}

function ChoiceGroup({ name, label, hint, options, values, value, onChange, required, type = 'radio', columns = 2 }) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <fieldset className="form-group" aria-describedby={hintId}>
      <legend className="form-legend">{label}</legend>
      {hint && <p id={hintId} className="form-hint">{hint}</p>}
      <div className={`choice-grid choice-grid-${columns}`}>
        {values.map((v) => (
          <Choice
            key={v}
            type={type}
            name={name}
            value={v}
            label={options[v]}
            checked={type === 'checkbox' ? value.includes(v) : value === v}
            onChange={onChange}
            required={required}
          />
        ))}
      </div>
    </fieldset>
  );
}

/** Step 1: the three packages as selectable cards, then the Care plan and "help me choose" as plain tiles. */
function PackagePicker({ value, onChange, label, hint, options }) {
  const { t } = useLocale();
  const p = t.websiteDesign.packages;
  return (
    <fieldset className="form-group" aria-describedby="package-hint">
      <legend className="form-legend">{label}</legend>
      <p id="package-hint" className="form-hint">{hint}</p>
      <div className="pick-grid">
        {designPackages.map((pkg) => {
          const c = p.items[pkg.key];
          const checked = value === pkg.key;
          return (
            <label key={pkg.key} className={`pick${checked ? ' is-checked' : ''}`}>
              <input type="radio" name="package" value={pkg.key} checked={checked} onChange={onChange} />
              <span className="pick-head">
                <span className="pick-name">{c.name}</span>
                <span className="choice-box" aria-hidden="true"><Check size={14} strokeWidth={2.4} /></span>
              </span>
              <PriceInline aed={pkg.fromAed} />
              <span className="pick-best">{c.bestFor}</span>
              <span className="pick-features">
                {c.features.slice(0, 3).map((f) => (
                  <span key={f}><Check size={14} strokeWidth={2} aria-hidden="true" />{f}</span>
                ))}
              </span>
            </label>
          );
        })}
      </div>
      <div className="choice-grid choice-grid-2">
        {['care', 'unsure'].map((v) => (
          <Choice key={v} name="package" value={v} label={options[v]} checked={value === v} onChange={onChange} />
        ))}
      </div>
    </fieldset>
  );
}

function Field({ name, label, hint, optional, multiline, ...rest }) {
  const hintId = hint ? `${name}-hint` : undefined;
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div className="form-group">
      <label htmlFor={`brief-${name}`}>{label}{optional && <> <span className="optional">{optional}</span></>}</label>
      {hint && <p id={hintId} className="form-hint">{hint}</p>}
      <Tag id={`brief-${name}`} name={name} className="form-control" aria-describedby={hintId} rows={multiline ? 4 : undefined} {...rest} />
    </div>
  );
}

export default function Brief() {
  const { t, locale, to } = useLocale();
  const b = t.brief;
  const f = b.fields;
  const [params] = useSearchParams();
  // Prerendered HTML has no query string, so ?package= is applied on the client only (as on Contact).
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const urlPackage = isClient && OPTIONS.package.includes(params.get('package')) ? params.get('package') : 'unsure';

  const [data, setData] = useState(empty);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const startedAt = useRef(0);
  const headingRef = useRef(null);
  const moved = useRef(false);
  useEffect(() => { startedAt.current = Date.now(); }, []);

  const pkg = data.package ?? urlPackage;
  const budget = data.budget ?? BUDGET_FOR[pkg] ?? '';
  const { features } = data;
  const total = b.steps.length;
  const last = step === total - 1;

  // Move focus to the new step's heading so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step, status]);

  const set = (name, value) => setData((d) => ({ ...d, [name]: value }));
  const onText = (e) => set(e.target.name, e.target.value);
  const onRadio = (e) => set(e.target.name, e.target.value);
  const onFeature = (e) => {
    const v = e.target.value;
    set('features', features.includes(v) ? features.filter((x) => x !== v) : [...features, v]);
  };

  const go = (n) => { moved.current = true; setStep(n); };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!last) return go(step + 1);
    if (status === 'sending') return;
    setStatus('sending');
    setError(null);
    const res = await submitForm({
      form: 'brief',
      locale,
      ...data,
      package: pkg,
      budget,
      features,
      website: e.currentTarget.elements.website?.value || '',
      startedAt: startedAt.current,
      turnstileToken: token,
    });
    moved.current = true;
    if (res.ok) {
      setStatus('sent');
    } else {
      setStatus('error');
      setError(res.error);
    }
  };

  const steps = [
    <>
      <PackagePicker value={pkg} onChange={onRadio} label={f.package.label} hint={f.package.hint} options={f.package.options} />
      <ChoiceGroup name="projectType" label={f.projectType.label} options={f.projectType.options} values={OPTIONS.projectType} value={data.projectType} onChange={onRadio} required />
    </>,
    <>
      <Field name="goals" label={f.goals.label} hint={f.goals.hint} multiline required maxLength={3000} value={data.goals} onChange={onText} />
      <Field name="audience" label={f.audience.label} hint={f.audience.hint} optional={b.optional} multiline maxLength={2000} value={data.audience} onChange={onText} />
      <Field name="currentSite" label={f.currentSite.label} hint={f.currentSite.hint} optional={b.optional} dir="ltr" inputMode="url" autoCapitalize="off" spellCheck={false} maxLength={300} value={data.currentSite} onChange={onText} />
    </>,
    <>
      <ChoiceGroup name="pages" label={f.pages.label} options={f.pages.options} values={OPTIONS.pages} value={data.pages} onChange={onRadio} required columns={3} />
      <ChoiceGroup type="checkbox" name="features" label={f.features.label} options={f.features.options} values={OPTIONS.features} value={features} onChange={onFeature} />
      <Field name="featureNotes" label={f.featureNotes.label} optional={b.optional} multiline maxLength={2000} value={data.featureNotes} onChange={onText} />
    </>,
    <>
      <ChoiceGroup name="budget" label={f.budget.label} hint={f.budget.hint} options={f.budget.options} values={OPTIONS.budget} value={budget} onChange={onRadio} required />
      <p className="policy-note">{b.policyNote}</p>
    </>,
    <>
      <ChoiceGroup name="timeline" label={f.timeline.label} options={f.timeline.options} values={OPTIONS.timeline} value={data.timeline} onChange={onRadio} required />
      <Field name="deadline" label={f.deadline.label} hint={f.deadline.hint} optional={b.optional} maxLength={200} value={data.deadline} onChange={onText} />
    </>,
    <>
      <Field name="references" label={f.references.label} hint={f.references.hint} optional={b.optional} multiline maxLength={2000} value={data.references} onChange={onText} />
      <ChoiceGroup name="assets" label={f.assets.label} options={f.assets.options} values={OPTIONS.assets} value={data.assets} onChange={onRadio} required columns={3} />
      <Field name="assetsLink" label={f.assetsLink.label} hint={f.assetsLink.hint} optional={b.optional} dir="ltr" inputMode="url" autoCapitalize="off" spellCheck={false} maxLength={500} value={data.assetsLink} onChange={onText} />
    </>,
    <>
      <div className="form-row">
        <Field name="name" label={f.name} autoComplete="name" required maxLength={120} value={data.name} onChange={onText} />
        <Field name="email" label={f.email} type="email" dir="ltr" autoComplete="email" required maxLength={254} value={data.email} onChange={onText} />
      </div>
      <div className="form-row">
        <Field name="company" label={f.company} optional={b.optional} autoComplete="organization" maxLength={160} value={data.company} onChange={onText} />
        <Field name="country" label={f.country} optional={b.optional} autoComplete="country-name" maxLength={80} value={data.country} onChange={onText} />
      </div>
      <label className="consent">
        <input type="checkbox" name="agreed" checked={data.agreed} onChange={(e) => set('agreed', e.target.checked)} required />
        <span>{f.agreed}</span>
      </label>
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="brief-website">Website</label>
        <input id="brief-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <Turnstile onToken={setToken} language={locale} />
      <p className="form-note">{b.privacy} <Link to={to('/privacy')}>{b.privacyLink}</Link>.</p>
    </>,
  ];

  return (
    <>
      <PageHero id="brief-title" word={b.hero.word} eyebrow={b.hero.eyebrow} title={b.hero.title} lead={b.hero.lead} next="brief" />

      <section className="section" id="brief" aria-labelledby="brief-step-title">
        <div className="container container-narrow">
          {status === 'sent' ? (
            <div className="brief-done">
              <h2 id="brief-step-title" className="section-title" tabIndex={-1} ref={headingRef}>{b.success.title}</h2>
              <p className="section-lead">
                {b.success.body}
                {forms.turnstileSiteKey && <> {b.success.confirmation(data.email)}</>}
              </p>
              <div className="btn-row"><Button to={designServices.path} variant="secondary">{b.success.back}</Button></div>
            </div>
          ) : (
            <form className="brief-form" onSubmit={onSubmit}>
              <div className="brief-progress">
                <p className="brief-count">{b.progress(step + 1, total)}</p>
                <div className="brief-bar" aria-hidden="true"><span style={{ width: `${((step + 1) / total) * 100}%` }} /></div>
                <ol className="brief-steps" aria-hidden="true">
                  {b.steps.map((s, i) => <li key={s} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}>{s}</li>)}
                </ol>
              </div>

              <h2 id="brief-step-title" className="brief-step-title" tabIndex={-1} ref={headingRef}>{b.steps[step]}</h2>
              <div className="brief-fields" key={step}>{steps[step]}</div>

              {status === 'error' && (
                <p className="form-error" role="alert">
                  {error === 'invalid' || error === 'verification' ? b.errors[error] : (
                    <>{b.errors.other} <a href={`mailto:${company.email}`} className="latin">{company.email}</a>.</>
                  )}
                </p>
              )}

              <div className="brief-nav">
                {step > 0 && (
                  <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)}>
                    <span>{b.back}</span>
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
                  <span>{last ? (status === 'sending' ? b.sending : b.submit) : b.next}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
