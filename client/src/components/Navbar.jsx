import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Settings, 
  Briefcase,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ isOpen }) => {
  const { hasPermission } = useAuth();
  const [config, setConfig] = useState({
    nombreGimnasio: 'FLUXER',
    logoBase64: null
  });

  const loadConfig = async () => {
    try {
      const res = await api.get('/api/configuracion');
      if (res.data.success) {
        setConfig(res.data.data);
      }
    } catch (err) {
      console.error('Error al cargar config en Navbar:', err);
    }
  };

  useEffect(() => {
    loadConfig();

    window.addEventListener('configUpdated', loadConfig);
    return () => {
      window.removeEventListener('configUpdated', loadConfig);
    };
  }, []);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px 10px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '15px' }}>
        {config.logoBase64 ? (
          <img src={config.logoBase64} alt="Logo" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain', borderRadius: '8px' }} />
        ) : (
          <h2 style={{ letterSpacing: '2px', color: '#00a8e8', margin: 0 }}>FLUXER</h2>
        )}
        {config.logoBase64 && config.nombreGimnasio && (
          <span style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', fontWeight: '500' }}>
            {config.nombreGimnasio}
          </span>
        )}
      </div>
      <ul className="nav-links">
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
            <Home size={20} style={{ marginRight: '10px' }} /> <span>Inicio</span>
          </NavLink>
        </li>
        
        <li>
          <details open>
            <summary style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', listStyle: 'none', padding: '10px 0' }}>
              <Briefcase size={20} style={{ marginRight: '10px', color: '#00a8e8' }} /> <span>Servicios</span>
            </summary>
            <ul className="submenu">
              <li>
                <NavLink to="/gestion-planes" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Gestión de Planes
                </NavLink>
              </li>
              <li>
                <NavLink to="/turnos" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Turnos / Horarios
                </NavLink>
              </li>
              <li>
                <NavLink to="/configuracion" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Configuración General
                </NavLink>
              </li>
            </ul>
          </details>
        </li>

        <li>
          <details open>
            <summary style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', listStyle: 'none', padding: '10px 0' }}>
              <Users size={20} style={{ marginRight: '10px', color: '#00a8e8' }} /> <span>Clientes</span>
            </summary>
            <ul className="submenu">
              <li>
                <NavLink to="/profesionales" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Profesionales
                </NavLink>
              </li>
              <li>
                <NavLink to="/socios" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Gestión de Socios
                </NavLink>
              </li>
              <li>
                <NavLink to="/clientes-totales" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Clientes Totales
                </NavLink>
              </li>
              <li>
                <NavLink to="/morosos" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Morosos
                </NavLink>
              </li>
            </ul>
          </details>
        </li>


        <li>
          <details open>
            <summary style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', listStyle: 'none', padding: '10px 0' }}>
              <Settings size={20} style={{ marginRight: '10px', color: '#00a8e8' }} /> <span>Utilidades</span>
            </summary>
            <ul className="submenu">
              <li>
                <NavLink to="/categorias" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Categorías / Etiquetas
                </NavLink>
              </li>
              {hasPermission('permisoFinanzas') && (
                <li>
                  <NavLink to="/pagos" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                    Medios de Pago
                  </NavLink>
                </li>
              )}
              <li>
                <NavLink to="/avisos" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Avisos
                </NavLink>
              </li>
            </ul>
          </details>
        </li>

        <li>
          <NavLink to="/calendario" end className={({ isActive }) => isActive ? 'active' : ''} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', padding: '10px 0' }}>
            <Calendar size={20} style={{ marginRight: '10px', color: '#00a8e8' }} /> <span>Calendario</span>
          </NavLink>
        </li>

        {hasPermission('esAdmin') && (
          <li>
            <NavLink to="/usuarios" end className={({ isActive }) => isActive ? 'active' : ''} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', padding: '10px 0' }}>
              <Users size={20} style={{ marginRight: '10px', color: '#00a8e8' }} /> <span>Usuarios</span>
            </NavLink>
          </li>
        )}
      </ul>
    </aside>
  );
};

export default Navbar;
