import { useLocale } from '../../i18n/useLocale';
import { PhoneShot } from './AppScreens';

/** The app screen that illustrates each journey stage, in stage order. */
const stageScreens = ['homeLower', 'question', 'sources', 'compare', 'prices', 'product'];

export default function JourneySteps() {
  const { t } = useLocale();
  return (
    <ol className="journey">
      {t.easelect.journey.stages.map((s, i) => (
        <li key={s.title} className={`journey-stage reveal reveal-delay-${(i % 3) + 1}`}>
          <PhoneShot name={stageScreens[i]} className="journey-shot" />
          <div className="journey-copy">
            <span className="journey-index" aria-hidden="true">{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
