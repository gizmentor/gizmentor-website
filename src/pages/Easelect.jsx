import { Globe, Smartphone, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Section from '../components/ui/Section';
import CtaBand from '../components/ui/CtaBand';
import StatusBadge, { StatusList } from '../components/ui/StatusBadge';
import PageHero from '../components/ui/PageHero';
import JourneySteps from '../components/easelect/JourneySteps';
import { useLocale } from '../i18n/useLocale';
import { ventures } from '../config/site';
import challengeImg from '../assets/easelect/easelect-challenge.webp';
import electronicsImg from '../assets/easelect/category-electronics.webp';
import fashionImg from '../assets/easelect/category-fashion.webp';
import accessoriesImg from '../assets/easelect/category-accessories.webp';
import webLight from '../assets/easelect/easelect-web-light.webp';
import webDark from '../assets/easelect/easelect-web-dark.webp';
import inHandImg from '../assets/easelect/easelect-in-hand.webp';
import inHandLight from '../assets/easelect/easelect-in-hand-light.webp';
import ThemedImage from '../components/ui/ThemedImage';

const categoryImages = { electronics: electronicsImg, fashion: fashionImg, accessories: accessoriesImg };

export default function Easelect() {
  const { t } = useLocale();
  const e = t.easelect;
  const venture = ventures.easelect;
  const [web, mobile] = venture.status;
  return (
    <div data-venture="easelect">
      <PageHero
        id="es-title"
        word="Easelect"
        eyebrow={e.hero.eyebrow}
        title={<><span className="sr-only">{e.hero.title} </span>{e.hero.tagline}</>}
        lead={<><strong className="hero-subline">{e.hero.subline}</strong>{e.hero.lead}</>}
        next="challenge"
        actions={
          <>
            <Button href={venture.url}>{e.hero.primary}</Button>
            <Button to="/contact?type=easelect" variant="secondary">{e.hero.secondary}</Button>
          </>
        }
        media={<div className="banner"><ThemedImage light={webLight} dark={webDark} alt={e.platform.web.imageAlt} width="1400" height="809" eager /></div>}
      >
        <StatusList items={venture.status} />
      </PageHero>

      {/* The customer's challenge */}
      <Section id="challenge" eyebrow={e.problem.eyebrow} title={e.problem.title}>
        <div className="split-media">
          <div className="media-frame media-light reveal"><img src={challengeImg} alt={e.problem.imageAlt} width="1536" height="1024" loading="lazy" /></div>
          <ul className="issue-list reveal reveal-delay-1">
            {e.problem.items.map((item) => (
              <li key={item}><span className="issue-icon" aria-hidden="true"><X size={14} strokeWidth={2} /></span>{item}</li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Understanding before recommending */}
      <Section tone="accent" eyebrow={e.solution.eyebrow}>
        <p className="statement reveal">{e.solution.statement}<span className="text-muted">{e.solution.muted}</span></p>
      </Section>

      {/* The six-step journey, with real app screens */}
      <Section tone="muted" eyebrow={e.journey.eyebrow} title={e.journey.title}>
        <JourneySteps />
        <p className="fine journey-note reveal">{e.journey.continuity}</p>
      </Section>

      {/* Intelligence engine */}
      <Section tone="dark" eyebrow={e.engine.eyebrow} title={e.engine.title} lead={e.engine.lead}>
        <ol className="engine">
          {e.engine.steps.map((s, i) => (
            <li key={s.title} className={`engine-step reveal reveal-delay-${(i % 3) + 1}`}>
              <span className="engine-index">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow={e.platform.eyebrow} title={e.platform.title}>
        <div className="card-grid card-grid-2">
          <article className="card card-media card-platform reveal">
            <div className="card-media-frame"><ThemedImage light={webLight} dark={webDark} alt={e.platform.web.imageAlt} width="1400" height="809" /></div>
            <div className="card-media-body">
              <span className="icon-tile" aria-hidden="true"><Globe size={20} strokeWidth={1.6} /></span>
              <h3>{e.platform.web.title}</h3>
              <p>{e.platform.web.body}</p>
              <StatusBadge label={t.common.status[web.key]} tone={web.tone} />
            </div>
          </article>
          <article className="card card-media card-platform reveal reveal-delay-1">
            <div className="card-media-frame"><ThemedImage light={inHandLight} dark={inHandImg} alt={e.platform.mobile.imageAlt} width="800" height="1200" /></div>
            <div className="card-media-body">
              <span className="icon-tile" aria-hidden="true"><Smartphone size={20} strokeWidth={1.6} /></span>
              <h3>{e.platform.mobile.title}</h3>
              <p>{e.platform.mobile.body}</p>
              <StatusBadge label={t.common.status[mobile.key]} tone={mobile.tone} />
            </div>
          </article>
        </div>
      </Section>

      {/* Categories and markets */}
      <Section tone="muted" eyebrow={e.categories.eyebrow} title={e.categories.title} lead={e.categories.note}>
        <ul className="card-grid card-grid-3">
          {e.categories.items.map((c, i) => (
            <li key={c.title} className={`card card-media reveal reveal-delay-${i + 1}`}>
              <img src={categoryImages[c.key]} alt={c.imageAlt} width="800" height="800" loading="lazy" />
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
        <dl className="markets reveal">
          <div className="market is-now">
            <dt>{e.categories.marketLabel}</dt>
            <dd className="market-name">{e.categories.market}</dd>
            <dd className="market-body">{e.categories.marketBody}</dd>
          </div>
          <div className="market">
            <dt>{e.categories.nextLabel}</dt>
            <dd className="market-name">{e.categories.next}</dd>
            <dd className="market-body">{e.categories.nextBody}</dd>
          </div>
        </dl>
      </Section>

      {/* Partnership value and business model */}
      <Section layout="split" eyebrow={e.partnership.eyebrow} title={e.partnership.title}>
        <dl className="facts facts-principles reveal">
          {e.partnership.items.map((p) => <div key={p.title}><dt>{p.title}</dt><dd>{p.body}</dd></div>)}
        </dl>
        <div className="note-panel reveal">
          <p className="note-panel-title">{e.partnership.modelTitle}</p>
          <p>{e.partnership.model}</p>
        </div>
      </Section>

      <CtaBand
        title={e.cta.title}
        body={e.cta.body}
        primary={{ href: venture.url, label: e.cta.primary }}
        secondary={{ to: '/contact?type=easelect', label: e.cta.secondary }}
      />
    </div>
  );
}
