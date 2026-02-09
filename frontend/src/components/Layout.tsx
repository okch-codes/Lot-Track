import { NavLink } from 'react-router-dom';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">LotTrack</div>
        <div className="nav-links">
          <NavLink to="/recipes">Recipes</NavLink>
          <NavLink to="/ingredients">Ingredients</NavLink>
          <NavLink to="/lots">Lots</NavLink>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}
