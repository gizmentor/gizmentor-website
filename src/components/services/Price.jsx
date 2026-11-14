import { useLocale } from '../../i18n/useLocale';
import { AED_PER_USD } from '../../config/site';
import { formatAmount, usdFromAed } from '../../lib/forms';

/** "From AED 3,900 (≈ USD 1,060)"; in Arabic "تبدأ من 3,900 درهم". `suffix` follows the amount (e.g. "/ month"). */
export default function Price({ aed, suffix }) {
  const { t, locale } = useLocale();
  const p = t.websiteDesign.packages;
  const amount = <span className="latin price-amount">{formatAmount(aed)}</span>;
  const currency = <span className="price-currency">{p.currency}</span>;
  return (
    <p className="price">
      <span className="price-from">{p.from}</span>
      <span className="price-main">
        {locale === 'ar' ? <>{amount} {currency}</> : <>{currency} {amount}</>}
        {suffix && <span className="price-suffix"> {suffix}</span>}
      </span>
      <span className="price-usd">{p.approxUsd(formatAmount(usdFromAed(aed, AED_PER_USD)))}</span>
    </p>
  );
}

/** One line: "From AED 3,900" (Arabic: "تبدأ من 3,900 درهم"), for compact places such as the brief's package cards. */
export function PriceInline({ aed }) {
  const { t, locale } = useLocale();
  const p = t.websiteDesign.packages;
  const amount = <strong className="latin">{formatAmount(aed)}</strong>;
  return (
    <span className="price-inline">
      {p.from} {locale === 'ar' ? <>{amount} {p.currency}</> : <>{p.currency} {amount}</>}
    </span>
  );
}
