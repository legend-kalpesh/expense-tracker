import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

// Page frame used by every logged-in page: sidebar + top bar + page content
export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false); // only matters on small screens

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-area">
        <Navbar onMenuClick={() => setMenuOpen(true)} />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
