import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Topbar from './components/Topbar';
import Footer from './components/Footer';
import Modal from './components/Modal';
import Calendar from './components/Calendar';

// Páginas
import Dashboard from './pages/Dashboard';
import Socios from './pages/Socios';
import Turnos from './pages/Turnos';
import ConfiguracionLocal from './pages/ConfiguracionLocal';
import GestionPlanes from './pages/GestionPlanes';
import ClientesTotales from './pages/ClientesTotales';
import Morosos from './pages/Morosos';
import Profesionales from './pages/Profesionales';
import Categorias from './pages/Categorias';
import Feriados from './pages/Feriados';
import Pagos from './pages/Pagos';
import Login from './pages/Login';

// Estilos globales
import './styles/style.css';

function AppContent() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Cerrar sidebar al cambiar de ruta (solo en móviles/tablets)
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, [location]);

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`} style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Sidebar - Ancho fijo */}
      <Navbar onOpenCalendar={() => setIsCalendarOpen(true)} isOpen={isSidebarOpen} /> 
      
      {/* Overlay para cerrar el menú en móviles */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* Contenedor principal - Ocupa todo el resto */}
      <div className="main-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f4f7f6', minWidth: 0 }}>
        <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="content-area" style={{ flex: 1, padding: '20px', width: '100%', boxSizing: 'border-box' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/socios" element={<Socios />} />
            <Route path="/clientes-totales" element={<ClientesTotales />} />
            <Route path="/morosos" element={<Morosos />} />
            <Route path="/profesionales" element={<Profesionales />} />
            <Route path="/turnos" element={<Turnos />} />
            <Route path="/gestion-planes" element={<GestionPlanes />} />
            <Route path="/configuracion-local" element={<ConfiguracionLocal />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/feriados" element={<Feriados />} />
            <Route path="/pagos" element={<Pagos />} />
          </Routes>
        </main>
        
        <Footer />
      </div>

      <Modal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        title="Agenda de Turnos Mensual"
      >
        <div style={{ padding: '10px' }}>
          <Calendar />
        </div>
      </Modal>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
