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
import Configuracion from './pages/Configuracion';
import GestionPlanes from './pages/GestionPlanes';
import ClientesTotales from './pages/ClientesTotales';
import Morosos from './pages/Morosos';
import Profesionales from './pages/Profesionales';
import Categorias from './pages/Categorias';
import Feriados from './pages/Feriados';
import Pagos from './pages/Pagos';
import Login from './pages/Login';
import Calendario from './pages/Calendario';
import api from './services/api';

// Estilos globales
import './styles/style.css';

function AppContent() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeAlarms, setActiveAlarms] = useState([]);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);

  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

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
        
        <main className="content-area" style={{ flex: 1, padding: '6px', width: '100%', boxSizing: 'border-box' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/socios" element={<Socios />} />
            <Route path="/clientes-totales" element={<ClientesTotales />} />
            <Route path="/morosos" element={<Morosos />} />
            <Route path="/profesionales" element={<Profesionales />} />
            <Route path="/turnos" element={<Turnos />} />
            <Route path="/gestion-planes" element={<GestionPlanes />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/feriados" element={<Feriados />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/calendario" element={<Calendario />} />
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
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
