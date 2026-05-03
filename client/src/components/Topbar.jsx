import { CircleHelp, LogOut, Menu } from 'lucide-react';

const Topbar = () => {
  return (
    <nav className="topbar">
      <button id="menu-toggle" className="hamburger-btn">
        <Menu size={24} />
      </button>
      <div className="search-bar">
        <input type="text" placeholder="Buscar en Fluxer..." />
      </div>
      <div className="user-actions">
        <button className="btn-help">
          <CircleHelp size={18} /> <span>Ayuda</span>
        </button>
        <button className="btn-logout">
          <LogOut size={18} /> <span>Salir</span>
        </button>
      </div>
    </nav>
  );
};

export default Topbar;
