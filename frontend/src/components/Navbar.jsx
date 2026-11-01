import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light');

  // Dark mode: switch the data-theme attribute and remember the choice
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <header className="navbar">
      <button className="icon-btn menu-btn" onClick={onMenuClick} aria-label="Open menu">☰</button>
      <div className="navbar-greeting">
        Hello, <strong>{user?.name}</strong>
      </div>
      <button className="btn btn-outline btn-sm" onClick={toggleTheme}>
        {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
      </button>
    </header>
  );
}
