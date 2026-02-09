import { NavLink } from 'react-router-dom';
import { ReactNode, useState } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">LotTrack</div>
        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '\u2715' : '\u2630'}
        </button>
        <div className={`nav-links${menuOpen ? ' open' : ''}`}>
          <NavLink to="/recipes" onClick={() => setMenuOpen(false)}>Recipes</NavLink>
          <NavLink to="/ingredients" onClick={() => setMenuOpen(false)}>Ingredients</NavLink>
          <NavLink to="/lots" onClick={() => setMenuOpen(false)}>Lots</NavLink>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}
