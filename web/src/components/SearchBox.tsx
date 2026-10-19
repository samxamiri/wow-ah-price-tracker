import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { ItemSummary } from "../types";
import { Gold } from "./Gold";
import { ItemIcon, qualityClass } from "./ItemIcon";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Debounce: wait until the user stops typing for 250ms before calling the API.
    const timer = setTimeout(() => {
      api
        .searchItems(query)
        .then((items) => {
          setResults(items);
          setError(null);
        })
        .catch((err: Error) => setError(err.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <section className="panel">
      <label htmlFor="search" className="panel-title">
        Search items
      </label>
      <input
        id="search"
        className="search-input"
        type="search"
        placeholder="e.g. Bismuth, Potion, Flask…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {error && <p className="error">{error}</p>}
      <ul className="item-list">
        {results.map((item) => (
          <li key={item.id}>
            <Link to={`/items/${item.id}`} className="item-row">
              <ItemIcon name={item.name} iconUrl={item.iconUrl} quality={item.quality} />
              <span className={`item-name ${qualityClass(item.quality)}`}>{item.name}</span>
              <span className="item-price">
                <Gold copper={item.currentPrice} />
              </span>
            </Link>
          </li>
        ))}
        {!error && results.length === 0 && <li className="muted">No items found.</li>}
      </ul>
    </section>
  );
}
