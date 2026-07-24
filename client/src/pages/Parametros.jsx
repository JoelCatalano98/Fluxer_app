import { useState, useEffect } from 'react';
import { Settings, CircleCheck, Loader2, Server, AlertTriangle } from 'lucide-react';
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
    profesoresPorTurno: false,
    maxReservasSemana: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Estados para la herramienta de reset financiero
  const [clientes, setClientes] = useState([]);
  const [clienteResetId, setClienteResetId] = useState("");
  const [resetting, setResetting] = useState(false);

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
            profesoresPorTurno: configData.profesoresPorTurno || false,
            maxReservasSemana: configData.maxReservasSemana || 0
          }));
        }
      } catch (err) {
        console.error('Error al cargar configuración:', err);
        setMessage({ text: 'Error al cargar los parámetros.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    const fetchClientes = async () => {
      try {
        const res = await api.get('/api/clientes?limit=9999');
        if (res.data.success) {
          setClientes(res.data.data.clientes || []);
        }
      } catch (err) {
        console.error('Error al cargar clientes para reset:', err);
      }
    };

    fetchConfig();
    fetchClientes();
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
        profesoresPorTurno: config.profesoresPorTurno,
        maxReservasSemana: parseInt(config.maxReservasSemana) || 0
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

  const handleResetFinanzas = async () => {
    if (!clienteResetId) {
      alert('Selecciona un cliente primero.');
      return;
    }

    const clienteSeleccionado = clientes.find(c => c.id === parseInt(clienteResetId));
    const nombreCompleto = clienteSeleccionado
      ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`
      : `ID ${clienteResetId}`;

    const confirmado = window.confirm(
      `⚠️ ¿ESTÁS SEGURO?\n\nEsto borrará permanentemente TODOS los pagos, movimientos y el saldo del cliente:\n\n➤ ${nombreCompleto}\n\nEsta acción NO se puede deshacer.`
    );

    if (!confirmado) return;

    try {
      setResetting(true);
      const res = await api.delete(`/api/clientes/${clienteResetId}/reset-finanzas`);
      if (res.data.success) {
        alert(`✅ ${res.data.message}`);
        setClienteResetId("");
      } else {
        alert(`❌ Error: ${res.data.message}`);
      }
    } catch (err) {
      console.error('Error al resetear finanzas:', err);
      alert(`❌ Error al resetear finanzas: ${err.response?.data?.message || err.message}`);
    } finally {
      setResetting(false);
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

              <div className="grupo-input" style={{ marginTop: '20px' }}>
                <label htmlFor="maxReservasSemana">Límite de Reservas por Semana (0 = Sin límite)</label>
                <input
                  type="number"
                  id="maxReservasSemana"
                  value={config.maxReservasSemana}
                  onChange={handleInputChange}
                  min="0"
                  className="input-base"
                />
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

      {/* ═══════════════════════════════════════════════════════════════
          ZONA PELIGROSA — Herramientas de Desarrollador
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        margin: '40px 30px 30px 30px',
        border: '2px solid #e03131',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: '#fff1f1',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: '1px solid #ffc9c9'
        }}>
          <AlertTriangle size={24} style={{ color: '#e03131', flexShrink: 0 }} />
          <div>
            <h3 style={{ color: '#c92a2a', margin: 0, fontSize: '1.1rem' }}>Zona Peligrosa / Herramientas de Desarrollador</h3>
            <p style={{ color: '#e03131', margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.85 }}>
              Las acciones en esta sección son destructivas e irreversibles. Usar solo para limpieza de datos de testing.
            </p>
          </div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#fff8f8' }}>
          <h4 style={{ color: '#c92a2a', marginBottom: '12px', fontSize: '0.95rem' }}>
            🔄 Hard Reset Financiero de Cliente
          </h4>
          <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '16px' }}>
            Elimina <strong>todos los pagos</strong> y <strong>movimientos de cuenta</strong> del cliente seleccionado y devuelve su saldo a $0.
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={clienteResetId}
              onChange={(e) => setClienteResetId(e.target.value)}
              className="input-base"
              style={{
                flex: '1 1 300px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '0.9rem',
                minWidth: '250px'
              }}
            >
              <option value="">-- Seleccionar cliente --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido} (ID: {c.id})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleResetFinanzas}
              disabled={!clienteResetId || resetting}
              style={{
                backgroundColor: !clienteResetId || resetting ? '#ccc' : '#e03131',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: !clienteResetId || resetting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (clienteResetId && !resetting) e.target.style.backgroundColor = '#c92a2a';
              }}
              onMouseLeave={(e) => {
                if (clienteResetId && !resetting) e.target.style.backgroundColor = '#e03131';
              }}
            >
              {resetting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Reseteando...
                </>
              ) : (
                '⚠️ Resetear Finanzas del Cliente'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametros;
