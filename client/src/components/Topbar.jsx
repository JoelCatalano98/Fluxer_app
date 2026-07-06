import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleHelp, LogOut, Menu, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROUTES_DATA = [
  { nombre: 'Dashboard (Inicio)', path: '/' },
  { nombre: 'Clientes Totales', path: '/clientes-totales' },
  { nombre: 'Gestión de Socios', path: '/socios' },
  { nombre: 'Morosos', path: '/morosos' },
  { nombre: 'Profesionales', path: '/profesionales' },
  { nombre: 'Turnos y Horarios', path: '/turnos' },
  { nombre: 'Gestión de Planes', path: '/gestion-planes' },
  { nombre: 'Categorías', path: '/categorias' },
  { nombre: 'Feriados', path: '/feriados' },
  { nombre: 'Medios de Pago', path: '/pagos' },
  { nombre: 'Configuración General', path: '/configuracion' },
  { nombre: 'Calendario', path: '/calendario' },
  { nombre: 'Usuarios y Empleados', path: '/usuarios' }
];

const Topbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setSearchResults([]);
      setIsDropdownOpen(false);
    } else {
      const filtered = ROUTES_DATA.filter(route => 
        route.nombre.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(filtered);
      setIsDropdownOpen(true);
    }
  };

  const handleSelectRoute = (path) => {
    navigate(path);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="topbar">
      <button id="menu-toggle" className="hamburger-btn" onClick={onToggleSidebar}>
        <Menu size={24} />
      </button>
      
      <div className="search-bar" ref={searchRef} style={{ position: 'relative' }}>
        <input 
          type="text" 
          placeholder="Buscar pantalla..." 
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => {
            if (searchResults.length > 0) setIsDropdownOpen(true);
          }}
        />
        
        {/* Spotlight Dropdown */}
        {isDropdownOpen && searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
            marginTop: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {searchResults.map((route, idx) => (
              <div 
                key={idx}
                onClick={() => handleSelectRoute(route.path)}
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid #f0f0f0',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <Search size={14} color="#666" />
                <span>{route.nombre}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="user-actions">
        <a 
          href="mailto:soporte@fluxer.local?subject=Solicitud%20de%20Soporte%20-%20Fluxer"
          className="btn-help" 
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: '#666' }}
        >
          <CircleHelp size={18} /> <span style={{ marginLeft: '5px' }}>Ayuda</span>
        </a>
        <button className="btn-logout" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
          <LogOut size={18} /> <span>Salir</span>
        </button>
      </div>
    </nav>
  );
};

export default Topbar;
