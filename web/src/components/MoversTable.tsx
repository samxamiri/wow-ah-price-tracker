import { Link } from "react-router-dom";
import type { Mover } from "../types";
import { formatPct } from "../utils/money";
import { Gold } from "./Gold";
import { ItemIcon, qualityClass } from "./ItemIcon";

interface Props {
  title: string;
  movers: Mover[];
}

export function MoversTable({ title, movers }: Props) {
  return (
    <section className="panel">
      <h2 className="panel-title">{title}</h2>
      {movers.length === 0 ? (
        <p className="muted">Need at least 24 hours of data.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th className="num">Price</th>
              <th className="num">24h</th>
            </tr>
          </thead>
          <tbody>
            {movers.map((m) => (
              <tr key={m.id}>
                <td>
                  <Link to={`/items/${m.id}`} className="item-cell">
                    <ItemIcon name={m.name} iconUrl={m.iconUrl} quality={m.quality} size={28} />
                    <span className={qualityClass(m.quality)}>{m.name}</span>
                  </Link>
                </td>
                <td className="num">
                  <Gold copper={m.currentPrice} />
                </td>
                <td className={`num ${m.changePct >= 0 ? "up" : "down"}`}>{formatPct(m.changePct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
