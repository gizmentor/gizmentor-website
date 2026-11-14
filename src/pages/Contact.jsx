import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Handshake, Mail, MapPin } from 'lucide-react';
import { useLocale } from '../i18n/useLocale';
import { company, emailFor, inquiryTypes } from '../config/site';
import { submitForm } from '../lib/forms';
import PageHero from '../components/ui/PageHero';
import Turnstile from '../components/ui/Turnstile';

const validTypes = new Set(inquiryTypes);
const empty = { name: '', email: '', organisation: '', message: '' };
const noopSubscribe = () => () => {};

export default function Contact() {
  const { t, locale } = useLocale();
  const c = t.contact;
  const { address } = t.common;
  const [params] = useSearchParams();
  const initialType = validTypes.has(params.get('type')) ? params.get('type') : 'general';
  const product = params.get('product');
  // Prerendered HTML has no query string: render 'general' on the server and during hydration,
  // then apply ?type= on the client. Once the visitor picks a type, their choice wins.
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [form, setForm] = useState({ ...empty, inquiryType: null });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  const inquiryType = form.inquiryType ?? (isClient ? initialType : 'general');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Sent by the forms Worker (worker/, forms.gizmentor.com) to company.email, or to
  // company.partnersEmail for partner enquiries. The visitor's email app is never opened.
  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError(null);
    const website = e.currentTarget.elements.website?.value || '';
    const res = await submitForm({
      form: 'contact',
      locale,
      ...form,
      inquiryType,
      product: product || '',
      website,
      startedAt: startedAt.current,
      turnstileToken: token,
    });
    if (res.ok) {
      setStatus('sent');
      setForm({ ...empty, inquiryType });
    } else {
      setStatus('error');
      setError(res.error);
    }
  };

  return (
    <>
      <PageHero id="contact-title" word={t.common.contact} eyebrow={c.eyebrow} title={c.title} lead={c.lead} next="enquiry" />
      <section className="section" id="enquiry" aria-label={c.fields.type}>
        <div className="container contact-grid">
          <ul className="contact-details reveal">
            <li>
              <span className="icon-tile" aria-hidden="true"><Mail size={18} strokeWidth={1.6} /></span>
              <span><span className="contact-label">{c.emailLabel}</span><a href={`mailto:${company.email}`} className="latin">{company.email}</a></span>
            </li>
            <li>
              <span className="icon-tile" aria-hidden="true"><Handshake size={18} strokeWidth={1.6} /></span>
              <span><span className="contact-label">{c.partnersLabel}</span><a href={`mailto:${company.partnersEmail}`} className="latin">{company.partnersEmail}</a></span>
            </li>
            <li>
              <span className="icon-tile" aria-hidden="true"><MapPin size={18} strokeWidth={1.6} /></span>
              <span>
                <span className="contact-label">{c.addressLabel}</span>
                <span className="latin">{company.legalName}</span><br />
                {address.line1}, {address.line2}<br />
                {address.city}, {address.country}
              </span>
            </li>
          </ul>

          <form onSubmit={onSubmit} className="contact-form reveal reveal-delay-1">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">{c.fields.name}</label>
                <input id="name" name="name" autoComplete="name" value={form.name} onChange={onChange} required className="form-control" />
              </div>
              <div className="form-group">
                <label htmlFor="email">{c.fields.email}</label>
                <input id="email" type="email" name="email" dir="ltr" autoComplete="email" value={form.email} onChange={onChange} required className="form-control" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="organisation">{c.fields.organisation} <span className="optional">{c.fields.optional}</span></label>
              <input id="organisation" name="organisation" autoComplete="organization" value={form.organisation} onChange={onChange} className="form-control" />
            </div>
            <div className="form-group">
              <label htmlFor="inquiryType">{c.fields.type}</label>
              <select id="inquiryType" name="inquiryType" value={inquiryType} onChange={onChange} className="form-control">
                {inquiryTypes.map((v) => <option key={v} value={v}>{c.types[v]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message">{c.fields.message}</label>
              <textarea id="message" name="message" rows="6" value={form.message} onChange={onChange} required className="form-control" />
            </div>
            <div className="hp-field" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <Turnstile onToken={setToken} language={locale} />
            <button type="submit" className="btn btn-primary btn-block" disabled={status === 'sending'}>
              {status === 'sending' ? c.sending : c.submit}
            </button>
            <p className={`form-note${status === 'error' ? ' form-error' : ''}`} role="status" aria-live="polite">
              {status === 'sent' && c.sent}
              {status === 'error' && (
                error === 'invalid' || error === 'verification' ? c.errors[error] : (
                  <>{c.errors.other} <a href={`mailto:${emailFor(inquiryType)}`} className="latin">{emailFor(inquiryType)}</a>.</>
                )
              )}
              {(status === 'idle' || status === 'sending') && c.noteBefore}
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
