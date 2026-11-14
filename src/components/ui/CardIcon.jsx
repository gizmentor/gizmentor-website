/** A small icon in the round outline tile, at the top of a card. Decorative: the card's heading says what it is. */
export default function CardIcon({ icon: Icon }) {
  if (!Icon) return null;
  return (
    <span className="icon-tile card-icon" aria-hidden="true">
      <Icon size={20} strokeWidth={1.6} />
    </span>
  );
}
