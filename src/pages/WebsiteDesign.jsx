import { Bot, ChartLine, Check, FilePlus, Gauge, Languages, ShieldCheck, Smartphone, Sparkles, Workflow } from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import PillarGrid from '../components/ui/PillarGrid';
import CtaBand from '../components/ui/CtaBand';
import Button from '../components/ui/Button';
import ThemedImage from '../components/ui/ThemedImage';
import CircleIcon from '../components/ui/CircleIcon';
import Price from '../components/services/Price';
import CardIcon from '../components/ui/CardIcon';
import { useLocale } from '../i18n/useLocale';
import { carePlan, designPackages, designServices, portfolio } from '../config/site';
import gizLight from '../assets/services/gizmentor-web-light.webp';
import gizDark from '../assets/services/gizmentor-web-dark.webp';
import easelectLight from '../assets/easelect/easelect-web-light.webp';
import easelectDark from '../assets/easelect/easelect-web-dark.webp';

const shots = {
  gizmentor: { light: gizLight, dark: gizDark },
  easelect: { light: easelectLight, dark: easelectDark },
};

// One icon per "In every build" card, in the order of content.websiteDesign.included.items.
const includedIcons = [Smartphone, Gauge, Languages, ChartLine, ShieldCheck, Sparkles];
// One icon per add-on card, in the order of content.websiteDesign.addOns.items.
const addOnIcons = [Bot, Workflow, FilePlus];

const brief = (pkg) => `${designServices.briefPath}?package=${pkg}`;

export default function WebsiteDesign() {
  const { t } = useLocale();
  const w = t.websiteDesign;
  const p = w.packages;
  return (
    <>
      <PageHero
        id="design-title"
        word={w.hero.word}
        eyebrow={w.hero.eyebrow}
        title={w.hero.title}
        lead={w.hero.lead}
        actions={
          <>
            <Button to={designServices.briefPath}>{w.hero.primary}</Button>
            <Button to="#packages" variant="secondary">{w.hero.secondary}</Button>
          </>
        }
      />

      <Section id="packages" eyebrow={p.eyebrow} title={p.title} lead={p.lead}>
        <ul className="package-grid">
          {designPackages.map((pkg, i) => {
            const c = p.items[pkg.key];
            return (
              <li key={pkg.key} className={`package reveal reveal-delay-${i + 1}${pkg.recommended ? ' package-recommended' : ''}`}>
                <div className="package-head">
                  <h3 className="package-name">{c.name}</h3>
                  {pkg.recommended && <span className="badge">{p.recommended}</span>}
                </div>
                <p className="package-tagline">{c.tagline}</p>
                <p className="package-best"><span>{p.bestForLabel}</span>{c.bestFor}</p>
                {pkg.customQuote && <p className="package-quote">{p.customQuote}</p>}
                <Price aed={pkg.fromAed} />
                <ul className="check-list">
                  {c.features.map((f) => (
                    <li key={f}><Check size={16} strokeWidth={2} aria-hidden="true" />{f}</li>
                  ))}
                </ul>
                <p className="package-choose"><strong>{p.chooseIfLabel}</strong> {c.chooseIf}</p>
                <p className="package-timeline"><span>{p.timelineLabel}</span>{c.timeline}</p>
                {c.notIncluded && <p className="package-excluded">{c.notIncluded}</p>}
                <Button to={brief(pkg.key)} variant={pkg.recommended ? 'primary' : 'secondary'} className="btn-block">
                  {p.choose(c.name)}
                </Button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="add-ons" tone="muted" eyebrow={w.addOns.eyebrow} title={w.addOns.title} lead={w.addOns.lead}>
        <ul className="card-grid card-grid-3">
          {w.addOns.items.map((c, i) => (
            <li key={c.title} className={`card reveal reveal-delay-${i + 1}`}>
              <CardIcon icon={addOnIcons[i]} />
              <h3>{c.title}</h3>
              <p>{c.body}</p>
              <p className="addon-price">{w.addOns.priceLabel}</p>
            </li>
          ))}
        </ul>
        <p className="policy-note addon-note reveal">{w.addOns.aiNote}</p>
      </Section>

      <Section id="care" layout="split" eyebrow={w.care.eyebrow} title={w.care.title} lead={w.care.lead}>
        <div className="care reveal">
          <Price aed={carePlan.fromAed} suffix={w.care.perMonth} />
          <ul className="check-list">
            {w.care.includes(carePlan.hoursPerMonth).map((f) => (
              <li key={f}><Check size={16} strokeWidth={2} aria-hidden="true" />{f}</li>
            ))}
          </ul>
          <p className="fine">{w.care.note}</p>
          <div className="btn-row"><Button to={brief('care')} variant="secondary">{w.care.cta}</Button></div>
        </div>
      </Section>

      <Section eyebrow={w.included.eyebrow} title={w.included.title}>
        <ul className="card-grid card-grid-3">
          {w.included.items.map((c, i) => (
            <li key={c.title} className={`card reveal reveal-delay-${(i % 3) + 1}`}>
              <CardIcon icon={includedIcons[i]} />
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="process" tone="dark" eyebrow={w.process.eyebrow} title={w.process.title}>
        <PillarGrid items={w.process.steps} />
      </Section>

      <Section id="revisions" tone="accent" eyebrow={w.policy.eyebrow}>
        <p className="statement reveal">{w.policy.statement}<span className="text-muted">{w.policy.muted}</span></p>
      </Section>

      <Section id="portfolio" eyebrow={w.portfolio.eyebrow} title={w.portfolio.title} lead={w.portfolio.lead}>
        <div className="ventures-grid">
          {portfolio.map((item, i) => {
            const c = w.portfolio.items[item.key];
            return (
              <a key={item.key} href={item.url} target="_blank" rel="noopener" className={`venture-card reveal ${i ? 'reveal-delay-1' : ''}`}>
                <span className="venture-media">
                  <ThemedImage light={shots[item.key].light} dark={shots[item.key].dark} alt={c.imageAlt} width="1400" height="809" />
                </span>
                <div className="venture-body">
                  <p className="venture-top">
                    <span className="venture-kind">{c.kind}</span>
                    <span className="venture-num" aria-hidden="true">0{i + 1}</span>
                  </p>
                  <h3 className="venture-name latin">{c.name}</h3>
                  <p className="venture-desc">{c.body}</p>
                  <span className="venture-link">
                    <CircleIcon icon="external" />
                    <span>{w.portfolio.visit(item.host)}</span>
                    <span className="sr-only"> {t.common.opensNewTab}</span>
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </Section>

      <Section id="faq" tone="muted" layout="split" eyebrow={w.faq.eyebrow} title={w.faq.title}>
        <div className="faq reveal">
          {w.faq.items.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <CtaBand
        title={w.cta.title}
        body={w.cta.body}
        primary={{ to: designServices.briefPath, label: w.cta.primary }}
        secondary={{ to: '/contact', label: w.cta.secondary }}
      />
    </>
  );
}
