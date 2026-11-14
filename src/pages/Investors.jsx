import { Link } from 'react-router-dom';
import { BrainCircuit, Package, PenTool } from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import MetricGrid from '../components/ui/MetricGrid';
import CtaBand from '../components/ui/CtaBand';
import Button from '../components/ui/Button';
import { StatusList } from '../components/ui/StatusBadge';
import { useLocale } from '../i18n/useLocale';
import { company, ventures, investorMetrics } from '../config/site';
import magfusionImg from '../assets/magfusion/magfusion-hero.webp';
import facadeImg from '../assets/images/investors-facade.webp';

// One icon per capability card, in the order of content.investors.capability.items.
const capabilityIcons = [PenTool, BrainCircuit, Package];

const sections = ['overview', 'vision', 'problem', 'strategy', 'easelect', 'capability', 'execution', 'foundation', 'growth', 'contact'];
const num = (id) => String(sections.indexOf(id) + 1).padStart(2, '0');

export default function Investors() {
  const { t, to } = useLocale();
  const v = t.investors;
  const { easelect, magfusion } = ventures;
  const eyebrow = (id) => `${num(id)} · ${v.toc[id]}`;
  return (
    <>
      <PageHero
        id="inv-title"
        word={t.common.nav.investors}
        eyebrow={v.hero.eyebrow}
        title={v.hero.title}
        lead={v.hero.lead}
        media={<div className="banner"><img src={facadeImg} alt={v.hero.imageAlt} width="1536" height="1024" fetchPriority="high" /></div>}
      >
        <nav className="toc" aria-label={v.hero.tocAria}>
          <ol>
            {sections.map((id) => (
              <li key={id}><a href={`#${id}`}><span>{num(id)}</span>{v.toc[id]}</a></li>
            ))}
          </ol>
        </nav>
      </PageHero>

      <MetricGrid metrics={investorMetrics} caption={v.metricsCaption} />

      <Section id="overview" layout="split" eyebrow={eyebrow('overview')} title={company.legalName}>
        <p className="section-lead reveal">{v.overview.lead}</p>
        <dl className="facts reveal reveal-delay-1">
          {v.overview.facts.map((f) => <div key={f.dt}><dt>{f.dt}</dt><dd>{f.dd}</dd></div>)}
        </dl>
      </Section>

      <Section id="vision" tone="accent" eyebrow={eyebrow('vision')}>
        <p className="statement reveal">{v.vision.statement}<span className="text-muted">{v.vision.muted}</span></p>
      </Section>

      <Section id="problem" tone="muted" layout="split" eyebrow={eyebrow('problem')} title={v.problem.title}>
        <p className="section-lead reveal">{v.problem.p1}</p>
        <p className="section-lead reveal reveal-delay-1">{v.problem.p2}</p>
      </Section>

      <Section id="strategy" tone="dark" eyebrow={eyebrow('strategy')} title={v.strategy.title} lead={v.strategy.lead}>
        <ol className="timeline timeline-labelled">
          {t.about.evolution.items.map((s, i) => (
            <li key={s.title} className={`timeline-item reveal reveal-delay-${(i % 3) + 1}`}>
              <p className="timeline-label">{s.label}</p>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="easelect" layout="split" eyebrow={eyebrow('easelect')} title={v.easelect.title}>
        <div data-venture="easelect" className="reveal">
          <p className="section-lead">{v.easelect.lead}</p>
          <StatusList items={easelect.status} />
          <ul className="point-list">
            {v.easelect.points.map((p) => <li key={p.strong}><strong>{p.strong}</strong><span>{p.text}</span></li>)}
          </ul>
          <div className="btn-row">
            <Button to="/easelect">{v.easelect.primary}</Button>
            <Button href={easelect.url} variant="ghost">{v.easelect.secondary}</Button>
          </div>
        </div>
      </Section>

      <Section id="capability" tone="muted" eyebrow={eyebrow('capability')} title={v.capability.title}>
        <ul className="card-grid card-grid-3">
          {v.capability.items.map((c, i) => {
            const Icon = capabilityIcons[i];
            return (
              <li key={c.title} className={`card reveal reveal-delay-${i + 1}`}>
                {Icon && <span className="icon-tile card-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.6} /></span>}
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="execution" eyebrow={eyebrow('execution')} title={v.execution.title}>
        <div className="split-media" data-venture="magfusion">
          <div className="media-frame reveal"><img src={magfusionImg} alt={v.execution.imageAlt} width="1024" height="576" loading="lazy" /></div>
          <div className="reveal reveal-delay-1">
            <h3 className="h3 latin">{magfusion.name}</h3>
            <p className="section-lead">{v.execution.body}</p>
            <StatusList items={magfusion.status} />
            <div className="btn-row"><Button to={magfusion.path} variant="secondary">{v.execution.cta}</Button></div>
          </div>
        </div>
      </Section>

      <Section id="foundation" tone="dark" eyebrow={eyebrow('foundation')} title={v.foundation.title}>
        <ul className="card-grid card-grid-3">
          <li className="card reveal">
            <h3>{v.foundation.licence.title}</h3>
            <p>{v.foundation.licence.body}</p>
            <ul className="mini-list">{t.common.licensedActivities.map((a) => <li key={a}>{a}</li>)}</ul>
            {company.tradeLicenceNumber && <p className="fine">{v.foundation.licence.number} <span className="latin">{company.tradeLicenceNumber}</span></p>}
          </li>
          <li className="card reveal reveal-delay-1">
            <h3>{v.foundation.trademark.title}</h3>
            <p>{t.common.trademark}</p>
            {company.trademarkRegistrationNumber && <p className="fine">{v.foundation.trademark.number} <span className="latin">{company.trademarkRegistrationNumber}</span></p>}
          </li>
          <li className="card reveal reveal-delay-2">
            <h3>{v.foundation.product.title}</h3>
            <p>{t.common.tdra}</p>
            {magfusion.tdraRegistrationNumber && <p className="fine">{v.foundation.product.number} <span className="latin">{magfusion.tdraRegistrationNumber}</span></p>}
          </li>
        </ul>
        <p className="disclaimer reveal">{v.foundation.disclaimer}</p>
      </Section>

      <Section id="growth" eyebrow={eyebrow('growth')} title={v.growth.title} lead={v.growth.note}>
        <ul className="card-grid card-grid-3">
          {v.growth.items.map((g, i) => (
            <li key={g.title} className={`card reveal reveal-delay-${(i % 3) + 1}`}><h3>{g.title}</h3><p>{g.body}</p></li>
          ))}
        </ul>
      </Section>

      <CtaBand
        id="contact"
        title={v.cta.title}
        body={v.cta.body}
        primary={{ to: '/contact?type=investor', label: v.cta.primary }}
        secondary={{ to: '/contact?type=partnership', label: v.cta.secondary }}
      />

      <div className="container">
        <p className="disclaimer">
          {v.disclaimer} <Link to={to('/terms')}>{v.disclaimerLink}</Link>.
        </p>
      </div>
    </>
  );
}
