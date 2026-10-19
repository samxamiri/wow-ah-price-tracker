import { toCoins } from "../utils/money";

/** Renders a copper amount the way WoW does: 123g 45s 67c with colored coins. */
export function Gold({ copper }: { copper: number | null | undefined }) {
  if (copper == null) return <span className="muted">—</span>;
  const { gold, silver, copper: c } = toCoins(copper);
  return (
    <span className="gold-amount">
      {gold > 0 && <span className="coin coin-gold">{gold.toLocaleString("en-US")}</span>}
      {(gold > 0 || silver > 0) && <span className="coin coin-silver">{silver}</span>}
      <span className="coin coin-copper">{c}</span>
    </span>
  );
}
