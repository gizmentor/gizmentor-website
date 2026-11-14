import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import CtaBand from '../components/ui/CtaBand';
import ThemedImage from '../components/ui/ThemedImage';
import CircleIcon from '../components/ui/CircleIcon';
import { useLocale } from '../i18n/useLocale';
import { designServices } from '../config/site';
import gizLight from '../assets/services/gizmentor-web-light.webp';
import gizDark from '../assets/services/gizmentor-web-dark.webp';

/** Services overview. One service today; each new service adds a card here and its own page under /services. */
export default function Services() {
  const { t, to } = useLocale();
  const s = t.services;
  const w = s.items.websiteDesign;
  return (
    <>
      <PageHero id="services-title" word={t.common.nav.services} eyebrow={s.hero.eyebrow} title={s.hero.title} lead={s.hero.lead} next="services" />

      <Section id="services" eyebrow={s.list.eyebrow} title={s.list.title}>
        <div className="ventures-grid services-grid">
          <Link to={to(designServices.path)} className="venture-card reveal">
            <span className="venture-media">
              <ThemedImage light={gizLight} dark={gizDark} alt={t.websiteDesign.portfolio.items.gizmentor.imageAlt} width="1400" height="809" />
            </span>
            <div className="venture-body">
              <p className="venture-top">
                <span className="venture-kind">{s.list.eyebrow}</span>
                <span className="venture-num" aria-hidden="true">01</span>
              </p>
              <h3 className="venture-name">{w.title}</h3>
              <p className="venture-desc">{w.body}</p>
              <span className="venture-link"><CircleIcon /><span>{w.cta}</span></span>
            </div>
          </Link>
        </div>
      </Section>

      <CtaBand
        title={s.cta.title}
        body={s.cta.body}
        primary={{ to: designServices.briefPath, label: s.cta.primary }}
        secondary={{ to: '/contact', label: s.cta.secondary }}
      />
    </>
  );
}
