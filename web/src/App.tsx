import { Link, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ItemPage } from "./pages/ItemPage";

export function App() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="logo">
          <span className="logo-coin" aria-hidden="true" />
          AH Price Tracker
        </Link>
        <span className="muted">World of Warcraft commodity prices</span>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/items/:id" element={<ItemPage />} />
          <Route path="*" element={<p className="error">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
