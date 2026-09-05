import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Topbar from './components/Topbar';
import Footer from './components/Footer';
import Modal from './components/Modal';
import InstallPrompt from './components/InstallPrompt';

// Páginas
import Dashboard from './pages/Dashboard';
import Socios from './pages/Socios';
import Turnos from './pages/Turnos';
import Configuracion from './pages/Configuracion';
import GestionPlanes from './pages/GestionPlanes';
import ClientesTotales from './pages/ClientesTotales';
import Morosos from './pages/Morosos';
import Profesionales from './pages/Profesionales';
import Categorias from './pages/Categorias';
import Avisos from './pages/Avisos';
import RankingAdmin from './pages/RankingAdmin';
import Pagos from './pages/Pagos';
import PagosYSueldos from './pages/PagosYSueldos';
import LibroDiario from './pages/LibroDiario';
import Login from './pages/Login';
import Calendario from './pages/Calendario';
import Usuarios from './pages/Usuarios';
import Parametros from './pages/Parametros';
import GeneradorQR from './pages/GeneradorQR';
import AsignacionMasiva from './pages/AsignacionMasiva';
import api from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';

// Estilos globales
import './styles/style.css';

function AppContent() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeAlarms, setActiveAlarms] = useState([]);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [pendientesCount, setPendientesCount] = useState(0);
  const [pagosPendientesCount, setPagosPendientesCount] = useState(0);

  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
        window.location.href = '/login';
    }
  }, [user, loading, isLoginPage]);

  // Suscripción reactiva para rastrear el ancho de pantalla
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar sidebar al cambiar de ruta (solo en móviles/tablets)
  useEffect(() => {
    if (windowWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, [location, windowWidth]);

  // Alarma Bono: verificar recordatorios/notas de calendario que coincidan con la hora local actual
  useEffect(() => {
    if (isLoginPage) return;

    let isMounted = true;
    let alarmInterval;

    const runAlarmCheck = async () => {
      try {
        const res = await api.get('/api/calendario');
        if (!isMounted) return;
        
        const now = new Date();
        // Formato YYYY-MM-DD local
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        // Formato HH:MM
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        // Filtrar notas que coincidan hoy, a la hora indicada, y que no hayan sido notificadas
        const triggered = res.data.filter(note => 
          note.fecha === todayStr && 
          note.horaAlarma === timeStr && 
          !note.notificado
        );

        if (triggered.length > 0) {
          // Play sound alert using AudioContext
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            const playBeep = (freq, delay, duration) => {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
              gain.gain.setValueAtTime(0.3, audioCtx.currentTime + delay);
              osc.start(audioCtx.currentTime + delay);
              osc.stop(audioCtx.currentTime + delay + duration);
            };

            // Play a double notification beep
            playBeep(880, 0, 0.2);
            playBeep(880, 0.3, 0.4);
          } catch (soundErr) {
            console.warn('AudioContext failed to initialize:', soundErr);
          }

          setActiveAlarms(prev => [...prev, ...triggered]);
          setIsAlarmModalOpen(true);

          // Actualizar en la base de datos para no notificar repetidamente
          for (const note of triggered) {
            await api.put(`/api/calendario/${note.id}`, { notificado: true });
          }
        }
      } catch (err) {
        console.error('Error checking notes alarms:', err);
      }
    };

    runAlarmCheck();
    alarmInterval = setInterval(runAlarmCheck, 60000); // Revisar cada 60s

    return () => {
      isMounted = false;
      clearInterval(alarmInterval);
    };
  }, [location.pathname, isLoginPage]);

  // Chequear clientes pendientes y pagos pendientes
  useEffect(() => {
    if (isLoginPage) return;
    const fetchPendientes = async () => {
      try {
        const [resClientes, resPagos] = await Promise.all([
          api.get('/api/clientes/pendientes'),
          api.get('/api/pagos/pendientes/count')
        ]);
        if (resClientes.data.success) {
          setPendientesCount(resClientes.data.data.length);
        }
        if (resPagos.data.success) {
          setPagosPendientesCount(resPagos.data.count);
        }
      } catch (err) {
        console.error('Error fetching pendientes:', err);
      }
    };
    fetchPendientes();

    const handleUpdate = () => {
      fetchPendientes();
    };
    window.addEventListener('pendientesUpdated', handleUpdate);
    window.addEventListener('pagosUpdated', handleUpdate);
    
    // Polling cada 30 segundos
    const pollInterval = setInterval(fetchPendientes, 30000);

    return () => {
      window.removeEventListener('pendientesUpdated', handleUpdate);
      window.removeEventListener('pagosUpdated', handleUpdate);
      clearInterval(pollInterval);
    };
  }, [location.pathname, isLoginPage]);

  if (loading) return <div>Cargando sesión...</div>;

  if (isLoginPage || !user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`} style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <InstallPrompt />
      {/* Sidebar - Ancho fijo */}
      <Navbar isOpen={isSidebarOpen} /> 
      
      {/* Overlay para cerrar el menú en móviles */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* Contenedor principal - Ocupa todo el resto */}
      <div className="main-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f4f7f6', minWidth: 0 }}>
        <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        {pendientesCount > 0 && (
          <div style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: '500' }}>
              <span>🔔</span>
              <span>Tienes {pendientesCount} cliente{pendientesCount !== 1 ? 's' : ''} esperando aprobación para ingresar.</span>
            </div>
            <Link to="/clientes-totales" style={{ backgroundColor: '#f59e0b', color: 'white', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', transition: 'background-color 0.2s' }}>
              Revisar ahora
            </Link>
          </div>
        )}
        
        {pagosPendientesCount > 0 && (
          <div style={{ backgroundColor: '#e0e7ff', borderBottom: '1px solid #c7d2fe', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3730a3', fontWeight: '500' }}>
              <span>💸</span>
              <span>Tienes {pagosPendientesCount} pago{pagosPendientesCount !== 1 ? 's' : ''} pendiente{pagosPendientesCount !== 1 ? 's' : ''} de revisión.</span>
            </div>
            <Link to="/pagos" style={{ backgroundColor: '#4f46e5', color: 'white', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', transition: 'background-color 0.2s' }}>
              Ver pagos
            </Link>
          </div>
        )}

        <main className="content-area" style={{ flex: 1, padding: '6px', width: '100%', boxSizing: 'border-box' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/socios" element={<Socios />} />
            <Route path="/clientes-totales" element={<ClientesTotales />} />
            <Route path="/morosos" element={<Morosos />} />
            <Route path="/profesionales" element={<Profesionales />} />
            <Route path="/turnos" element={<Turnos />} />
            <Route path="/asignacion-mensual" element={<AsignacionMasiva />} />
            <Route path="/gestion-planes" element={<GestionPlanes />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/avisos" element={<Avisos />} />
            <Route path="/ranking" element={<RankingAdmin />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/sueldos" element={<PagosYSueldos />} />
            <Route path="/libro-diario" element={<LibroDiario />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/parametros" element={<Parametros />} />
            <Route path="/demo-qr" element={<GeneradorQR />} />
          </Routes>
        </main>
        
        <Footer />
      </div>

      {/* Modal de Alerta de Alarma */}
      <Modal
        isOpen={isAlarmModalOpen}
        onClose={() => setIsAlarmModalOpen(false)}
        title="⏰ Recordatorio de Alarma"
      >
        <div style={{ padding: '10px', color: '#333' }}>
          <p style={{ fontWeight: '600', marginBottom: '14px', fontSize: '1.05rem' }}>
            Tenes recordatorios programados para este momento:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeAlarms.map(alarm => (
              <div key={alarm.id} style={{ backgroundColor: '#fff5f5', border: '1px solid #ffccd5', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#ff4d4d', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                  Hora programada: {alarm.horaAlarma}
                </span>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#1a1a1f', fontWeight: '500' }}>
                  {alarm.contenido}
                </p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button 
              className="btn-primary" 
              onClick={() => {
                setIsAlarmModalOpen(false);
                setActiveAlarms([]);
              }}
              style={{ backgroundColor: '#00a8e8', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
