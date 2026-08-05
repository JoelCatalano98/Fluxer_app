import { useState, useEffect } from 'react';
import { Settings, CircleCheck, Loader2, Server, AlertTriangle, ChevronDown } from 'lucide-react';
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
  const [parametros, setParametros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Estados para la herramienta de reset financiero
  const [clientes, setClientes] = useState([]);
  const [clienteResetId, setClienteResetId] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!isSadmin) return; // No cargar nada si no tiene permiso

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [resConfig, resParams, resClientes] = await Promise.all([
          api.get('/api/configuracion'),
          api.get('/api/parametros').catch(() => ({ data: { success: false } })),
          api.get('/api/clientes?limit=9999')
        ]);

        if (resConfig.data.success) {
          const configData = Array.isArray(resConfig.data) ? resConfig.data[0] : (resConfig.data?.data || resConfig.data);
          setConfig(prev => ({
            ...prev,
            profesoresPorTurno: configData.profesoresPorTurno || false,
            maxReservasSemana: configData.maxReservasSemana || 0
          }));
        }

        if (resParams.data.success && Array.isArray(resParams.data.data)) {
          setParametros(resParams.data.data);
        }

        if (resClientes.data.success) {
          setClientes(resClientes.data.data.clientes || []);
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setMessage({ text: 'Error al cargar los parámetros.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
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

  // --- Handlers de Configuracion (profesoresPorTurno, maxReservasSemana) ---
  const handleConfigChange = (e) => {
    const { id, type, checked, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  // --- Handler de ParametroSistema (toggle booleano) ---
  const handleParametroToggle = async (clave, valorActual) => {
    const nuevoValor = valorActual === 'true' ? 'false' : 'true';
    try {
      const res = await api.put(`/api/parametros/${clave}`, { valor: nuevoValor });
      if (res.data.success) {
        setParametros(prev => prev.map(p => p.clave === clave ? { ...p, valor: nuevoValor } : p));
        setMessage({ text: `Parámetro "${clave}" actualizado.`, type: 'success' });
        // Notificar al Navbar para que re-evalúe visibilidad
        window.dispatchEvent(new Event('configUpdated'));
      }
    } catch (err) {
      console.error('Error al actualizar parámetro:', err);
      setMessage({ text: 'Error al actualizar el parámetro.', type: 'error' });
    }
  };

  // --- Guardar config (profesoresPorTurno + maxReservasSemana) ---
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
        window.dispatchEvent(new Event('configUpdated'));
      }
    } catch (err) {
      console.error('Error al guardar parámetros:', err);
      setMessage({ text: 'Error al guardar los parámetros.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // --- Reset financiero (sin cambios funcionales) ---
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
          padding: '12px 20px',
          borderRadius: '8px',
          margin: '16px 30px 0 30px',
          fontWeight: '500',
          fontSize: '0.9rem',
          border: `1px solid ${message.type === 'success' ? '#b2f2bb' : '#ffc9c9'}`
        }}>
          {message.text}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TABLA DE PARÁMETROS — Estilo plano tipo Excel
      ═══════════════════════════════════════════════════════════════ */}
      <form onSubmit={handleSave} style={{ margin: '24px 30px 0 30px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem',
          backgroundColor: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#495057' }}>Parámetro</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#495057' }}>Descripción</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600', color: '#495057', width: '140px' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {/* --- Fila 1: profesoresPorTurno (desde Configuracion, checkbox) --- */}
            <tr style={{ borderBottom: '1px solid #e9ecef' }}>
              <td style={{ padding: '12px 16px', fontWeight: '500', color: '#212529' }}>Profesores por Turno</td>
              <td style={{ padding: '12px 16px', color: '#6c757d' }}>Asignar un profesional específico a cada bloque de horario en el calendario de turnos.</td>
              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                <label className="interruptor" style={{ margin: '0 auto' }}>
                  <input
                    type="checkbox"
                    id="profesoresPorTurno"
                    checked={config.profesoresPorTurno}
                    onChange={handleConfigChange}
                  />
                  <span className="deslizador">
                    <span className="perilla"></span>
                  </span>
                </label>
              </td>
            </tr>

            {/* --- Fila 2: maxReservasSemana (desde Configuracion, input numérico) --- */}
            <tr style={{ borderBottom: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
              <td style={{ padding: '12px 16px', fontWeight: '500', color: '#212529' }}>Máx. Reservas por Semana</td>
              <td style={{ padding: '12px 16px', color: '#6c757d' }}>Límite de reservas semanales por cliente. 0 = sin límite.</td>
              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                <input
                  type="number"
                  id="maxReservasSemana"
                  value={config.maxReservasSemana}
                  onChange={handleConfigChange}
                  min="0"
                  style={{
                    width: '80px',
                    padding: '6px 10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                  }}
                />
              </td>
            </tr>

            {/* --- Filas dinámicas desde ParametroSistema --- */}
            {parametros.map((param, idx) => (
              <tr key={param.id} style={{
                borderBottom: '1px solid #e9ecef',
                backgroundColor: (idx % 2 === 0) ? '#fff' : '#f8f9fa'
              }}>
                <td style={{ padding: '12px 16px', fontWeight: '500', color: '#212529' }}>{param.clave}</td>
                <td style={{ padding: '12px 16px', color: '#6c757d' }}>{param.descripcion}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {param.tipo === 'boolean' ? (
                    <label className="interruptor" style={{ margin: '0 auto' }}>
                      <input
                        type="checkbox"
                        checked={param.valor === 'true'}
                        onChange={() => handleParametroToggle(param.clave, param.valor)}
                      />
                      <span className="deslizador">
                        <span className="perilla"></span>
                      </span>
                    </label>
                  ) : (
                    <span style={{ color: '#868e96', fontStyle: 'italic' }}>{param.valor}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Botón guardar (solo para los campos de Configuracion) */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-save-config" disabled={saving} style={{ fontSize: '0.9rem' }}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Guardando...
              </>
            ) : (
              <>
                <CircleCheck size={18} /> Guardar Cambios de Configuración
              </>
            )}
          </button>
        </div>
      </form>

      {/* ═══════════════════════════════════════════════════════════════
          ZONA PELIGROSA — Acordeón compacto, cerrado por defecto
      ═══════════════════════════════════════════════════════════════ */}
      <details style={{
        margin: '30px 30px 30px 30px',
        border: '1px solid #e03131',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <summary style={{
          backgroundColor: '#fff1f1',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          listStyle: 'none',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: '#c92a2a',
          userSelect: 'none'
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>⚠ Zona de Riesgo — Herramientas Destructivas</span>
          <ChevronDown size={16} style={{ opacity: 0.6 }} />
        </summary>

        <div style={{ padding: '16px', backgroundColor: '#fff8f8' }}>
          <p style={{ color: '#666', fontSize: '0.82rem', marginBottom: '12px' }}>
            Elimina <strong>todos los pagos</strong> y <strong>movimientos de cuenta</strong> del cliente seleccionado y devuelve su saldo a $0. Acción irreversible.
          </p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={clienteResetId}
              onChange={(e) => setClienteResetId(e.target.value)}
              style={{
                flex: '1 1 250px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '0.85rem',
                minWidth: '200px'
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
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: !clienteResetId || resetting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
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
                  <Loader2 className="animate-spin" size={16} /> Reseteando...
                </>
              ) : (
                '⚠️ Resetear Finanzas'
              )}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
};

export default Parametros;
