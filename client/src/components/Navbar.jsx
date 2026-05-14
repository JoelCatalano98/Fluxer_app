import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Settings, 
  Briefcase,
  Calendar
} from 'lucide-react';

const Navbar = ({ onOpenCalendar, isOpen }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="logo">
        <h2 style={{ letterSpacing: '2px', color: '#00a8e8' }}>FLUXER</h2>
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
                <NavLink to="/configuracion-local" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Configuración Local
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
              <li>
                <NavLink to="/pagos" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Medios de Pago
                </NavLink>
              </li>
              <li>
                <NavLink to="/feriados" className={({ isActive }) => isActive ? 'active-link' : ''} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Feriados
                </NavLink>
              </li>
            </ul>
          </details>
        </li>

        <li>
          <details open>
            <summary style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', listStyle: 'none', padding: '10px 0' }}>
              <Calendar size={20} style={{ marginRight: '10px', color: '#00a8e8' }} /> <span>Calendario</span>
            </summary>
            <ul className="submenu">
              <li onClick={onOpenCalendar} style={{ cursor: 'pointer' }}>
                Mensual
              </li>
            </ul>
          </details>
        </li>
      </ul>
    </aside>
  );
};

export default Navbar;
