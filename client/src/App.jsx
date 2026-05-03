import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Topbar from './components/Topbar';
import Footer from './components/Footer';

// Páginas
import Dashboard from './pages/Dashboard';
import Socios from './pages/Socios';
import Abonos from './pages/Abonos';
import Turnos from './pages/Turnos';
import ConfiguracionLocal from './pages/ConfiguracionLocal';
import GestionPlanes from './pages/GestionPlanes';
import ClientesTotales from './pages/ClientesTotales';
import Morosos from './pages/Morosos';
import Profesionales from './pages/Profesionales';
import Categorias from './pages/Categorias';
import Feriados from './pages/Feriados';
import Pagos from './pages/Pagos';

// Estilos globales
import './styles/style.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Topbar />
      <Routes>
        {/* Inicio */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Clientes */}
        <Route path="/socios" element={<Socios />} />
        <Route path="/abonos" element={<Abonos />} />
        <Route path="/clientes-totales" element={<ClientesTotales />} />
        <Route path="/morosos" element={<Morosos />} />
        <Route path="/profesionales" element={<Profesionales />} />
        
        {/* Servicios */}
        <Route path="/turnos" element={<Turnos />} />
        <Route path="/gestion-planes" element={<GestionPlanes />} />
        <Route path="/configuracion-local" element={<ConfiguracionLocal />} />
        
        {/* Utilidades */}
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/feriados" element={<Feriados />} />
        <Route path="/pagos" element={<Pagos />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
