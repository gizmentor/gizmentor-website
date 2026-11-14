/** A line icon at the top of a card, without a frame. Decorative: the card's heading says what it is. */
export default function CardIcon({ icon: Icon }) {
  if (!Icon) return null;
  return (
    <span className="card-icon" aria-hidden="true">
      <Icon size={36} strokeWidth={1.4} />
    </span>
  );
}
