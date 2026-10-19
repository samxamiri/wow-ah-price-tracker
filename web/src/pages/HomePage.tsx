import { api } from "../api";
import { MoversTable } from "../components/MoversTable";
import { SearchBox } from "../components/SearchBox";
import { useFetch } from "../useFetch";

export function HomePage() {
  const movers = useFetch(() => api.getMovers(), []);

  return (
    <div className="home-grid">
      <SearchBox />
      <div className="movers">
        {movers.error && <p className="error">Couldn't load market movers: {movers.error}</p>}
        {movers.data && (
          <>
            <MoversTable title="Biggest gainers (24h)" movers={movers.data.gainers} />
            <MoversTable title="Biggest drops (24h)" movers={movers.data.losers} />
          </>
        )}
      </div>
    </div>
  );
}
