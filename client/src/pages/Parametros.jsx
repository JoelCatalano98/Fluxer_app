import { useState, useEffect } from 'react';
import { Settings, CircleCheck, Loader2, Server } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/style.css';
import '../styles/Servicios/configuracion_local.css';

const Parametros = () => {
  const { user } = useAuth();
  
  // Guard de seguridad robusto
  const localUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isSadmin = user?.esSuperAdmin || localUser?.esSuperAdmin;

  const [config, setConfig] = useState({
    profesoresPorTurno: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!isSadmin) return; // No cargar nada si no tiene permiso

    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/configuracion');
        if (res.data.success) {
          const configData = Array.isArray(res.data) ? res.data[0] : (res.data?.data || res.data);
          setConfig(prev => ({
            ...prev,
            profesoresPorTurno: configData.profesoresPorTurno || false
          }));
        }
      } catch (err) {
        console.error('Error al cargar configuración:', err);
        setMessage({ text: 'Error al cargar los parámetros.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [isSadmin]);

  if (!isSadmin) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#e03131', backgroundColor: '#fff1f1', padding: '40px', borderRadius: '12px', border: '1px solid #ffa8a8' }}>
          <Server size={60} style={{ margin: '0 auto 20px', opacity: 0.8 }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Acceso Denegado</h2>
          <p>Esta pantalla es de uso exclusivo para Super Administradores.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { id, type, checked, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });

      // Como la ruta PUT /api/configuracion actualiza todo, primero buscamos el resto de datos para no pisarlos.
      // Si el backend soporta PATCH o maneja bien parciales, mejor, pero enviaremos la config obtenida actualizada.
      const resOld = await api.get('/api/configuracion');
      const oldConfig = Array.isArray(resOld.data) ? resOld.data[0] : (resOld.data?.data || resOld.data);

      const payload = {
        ...oldConfig,
        profesoresPorTurno: config.profesoresPorTurno
      };

      const res = await api.put('/api/configuracion', payload);

      if (res.data.success) {
        setMessage({ text: '¡Parámetros guardados con éxito!', type: 'success' });
      }
    } catch (err) {
      console.error('Error al guardar parámetros:', err);
      setMessage({ text: 'Error al guardar los parámetros.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent-blue)', margin: '0 auto' }} />
          <p style={{ marginTop: '15px', color: '#666' }}>Cargando parámetros del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <PageHeader
        title="⚙️ Parámetros del Sistema (SADMIN)"
        subtitle="Configuración avanzada de Feature Flags y reglas del SaaS."
        image="/img/welcome-background.png"
      />

      {message.text && (
        <div style={{
          backgroundColor: message.type === 'success' ? '#ebfbee' : '#fff1f1',
          color: message.type === 'success' ? '#2f9e44' : '#e03131',
          padding: '15px',
          borderRadius: '8px',
          margin: '20px 30px 0 30px',
          fontWeight: '500',
          border: `1px solid ${message.type === 'success' ? '#b2f2bb' : '#ffc9c9'}`
        }}>
          {message.text}
        </div>
      )}

      <form className="contenedor-configuracion" onSubmit={handleSave}>
        <div className="grid-configuracion">
          <section className="seccion-configuracion">
            <div className="cabecera-seccion">
              <Settings size={24} className="icon-blue" />
              <h2>Funcionalidades Premium (Feature Flags)</h2>
            </div>
            
            <div className="cuerpo-seccion">
              <div className="grupo-conmutador" style={{ marginTop: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba' }}>
                <div className="info-conmutador">
                  <h4 style={{ color: '#856404' }}>⭐ Gestión Avanzada: Profesores por Turno</h4>
                  <p style={{ color: '#856404' }}>Permitir asignar un profesional específico a cada bloque de horario en el calendario de turnos. Activar solo para planes premium.</p>
                </div>
                <label className="interruptor">
                  <input
                    type="checkbox"
                    id="profesoresPorTurno"
                    checked={config.profesoresPorTurno}
                    onChange={handleInputChange}
                  />
                  <span className="deslizador">
                    <span className="perilla"></span>
                  </span>
                </label>
              </div>
            </div>
          </section>
        </div>

        <div className="acciones-finales-config">
          <button type="submit" className="btn-save-config" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Guardando...
              </>
            ) : (
              <>
                <CircleCheck size={20} /> Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Parametros;
