import PageHero from '../components/ui/PageHero';
import Section from '../components/ui/Section';
import VentureCards from '../components/ui/VentureCards';
import PillarGrid from '../components/ui/PillarGrid';
import CtaBand from '../components/ui/CtaBand';
import { Coins, Expand, Repeat } from 'lucide-react';
import CardIcon from '../components/ui/CardIcon';
import { useLocale } from '../i18n/useLocale';

// One icon per criteria card, in the order of content.ventures.criteria.items.
const criteriaIcons = [Repeat, Coins, Expand];

export default function Ventures() {
  const { t } = useLocale();
  const v = t.ventures;
  return (
    <>
      <PageHero id="ventures-title" word={t.common.nav.ventures} eyebrow={v.hero.eyebrow} title={v.hero.title} lead={v.hero.lead} next="portfolio" />

      <Section id="portfolio" eyebrow={v.portfolio.eyebrow} title={v.portfolio.title}>
        <VentureCards />
      </Section>

      <Section tone="dark" eyebrow={v.criteria.eyebrow} title={v.criteria.title}>
        <ul className="card-grid card-grid-3">
          {v.criteria.items.map((c, i) => (
            <li key={c.title} className={`card reveal reveal-delay-${i + 1}`}><CardIcon icon={criteriaIcons[i]} /><h3>{c.title}</h3><p>{c.body}</p></li>
          ))}
        </ul>
      </Section>

      <Section eyebrow={v.model.eyebrow} title={v.model.title}>
        <PillarGrid />
      </Section>

      <CtaBand title={v.cta.title} body={v.cta.body} primary={{ to: '/contact?type=partnership', label: v.cta.primary }} />
    </>
  );
}
