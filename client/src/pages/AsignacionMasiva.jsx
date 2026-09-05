import React, { useState, useEffect, useMemo } from 'react';

const styles = `
  .asignacion-masiva-grid {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 20px;
    padding: 0 30px 30px 30px;
    align-items: start;
  }
  .btn-mobile-filtros {
    display: none;
  }
  @media (max-width: 900px) {
    .asignacion-masiva-grid {
      grid-template-columns: 1fr;
      padding: 5px;
    }
    .panel-derecho {
      display: none;
    }
    .btn-mobile-filtros {
      display: flex;
      margin: 10px 5px 20px 5px;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px;
      background: #00a8e8;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      width: calc(100% - 10px);
      cursor: pointer;
    }
  }
`;
import { UserPlus, Plus, Loader2, Calendar, Filter } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import api from '../services/api';

const TODOS_LOS_DIAS = [
  { id: 0, label: 'Domingo' }, { id: 1, label: 'Lunes' }, { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' }, { id: 4, label: 'Jueves' }, { id: 5, label: 'Viernes' }, { id: 6, label: 'Sábado' }
];

const MESES = [
  { id: 1, label: 'Enero' }, { id: 2, label: 'Febrero' }, { id: 3, label: 'Marzo' },
  { id: 4, label: 'Abril' }, { id: 5, label: 'Mayo' }, { id: 6, label: 'Junio' },
  { id: 7, label: 'Julio' }, { id: 8, label: 'Agosto' }, { id: 9, label: 'Septiembre' },
  { id: 10, label: 'Octubre' }, { id: 11, label: 'Noviembre' }, { id: 12, label: 'Diciembre' }
];

const formatTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const AsignacionMasiva = () => {
  const [categorias, setCategorias] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [clientesList, setClientesList] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [diasApertura, setDiasApertura] = useState([0,1,2,3,4,5,6]); // default all

  const [planSeleccionado, setPlanSeleccionado] = useState('');
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [clientesSeleccionados, setClientesSeleccionados] = useState([]);

  const [filtroPago, setFiltroPago] = useState('TODOS');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [morososSeleccionados, setMorososSeleccionados] = useState([]);
  const [horariosMatchesCalculados, setHorariosMatchesCalculados] = useState([]);

  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [horariosSeleccionados, setHorariosSeleccionados] = useState([]);
  const [mesesSeleccionados, setMesesSeleccionados] = useState([]);

  const [loading, setLoading] = useState(false);
  const [mesesDisponibles, setMesesDisponibles] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isMobileFiltrosOpen, setIsMobileFiltrosOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingInitial(true);
        const [resCategorias, resClientes, resHorarios, resPlanes, resConfig] = await Promise.all([
          api.get('/api/categorias').catch(e => e.response || { data: { success: false } }),
          api.get('/api/clientes?limit=2000').catch(e => e.response || { data: { success: false } }),
          api.get('/api/turnos/horarios').catch(e => e.response || { data: { success: false } }),
          api.get('/api/planes').catch(e => e.response || { data: { success: false } }),
          api.get('/api/configuracion').catch(e => e.response || { data: { success: false } })
        ]);

        if (resCategorias.data.success) setCategorias(resCategorias.data.data);
        if (resClientes.data.success) {
          const data = resClientes.data.data;
          setClientesList(data.clientes || data);
        }
        if (resHorarios.data.success) setHorarios(resHorarios.data.data);
        if (resPlanes.data.success) setPlanes(resPlanes.data.data);
        if (resConfig.data.success) {
          const configData = Array.isArray(resConfig.data.data) ? resConfig.data.data[0] : resConfig.data.data;
          if (configData?.diasApertura) {
            setDiasApertura(configData.diasApertura.split(',').map(Number));
          }
        }

        const mesActual = new Date().getMonth() + 1;
        setMesesDisponibles(MESES.filter(m => m.id >= mesActual));
        setMesesSeleccionados([mesActual]);

      } catch (err) {
        console.error("Error fetching data", err);
        setMessage({ text: 'Error al cargar los datos iniciales.', type: 'error' });
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchData();
  }, []);

  // Extraer las franjas horarias únicas disponibles (filtradas por disciplina si hay una seleccionada)
  const uniqueRanges = useMemo(() => {
    const ranges = new Set();
    
    let horariosFiltrados = horarios;
    if (disciplinaSeleccionada) {
      horariosFiltrados = horarios.filter(h => h.categoriaId === parseInt(disciplinaSeleccionada));
    }

    horariosFiltrados.forEach(h => {
      const range = `${formatTime(h.hora_inicio)} - ${formatTime(h.hora_fin)}`;
      ranges.add(range);
    });
    // Ordenar cromológicamente (asumiendo formato HH:MM - HH:MM)
    return Array.from(ranges).sort((a, b) => a.localeCompare(b));
  }, [horarios, disciplinaSeleccionada, planSeleccionado, categorias]);

  // Resetear disciplina al cambiar de plan
  useEffect(() => {
    setDisciplinaSeleccionada('');
  }, [planSeleccionado]);

  useEffect(() => {
    let filtered = clientesList;

    if (planSeleccionado) {
      filtered = filtered.filter(c => c.planId === parseInt(planSeleccionado));
    }
    
    if (disciplinaSeleccionada) {
      filtered = filtered.filter(c => c.categoriaId === parseInt(disciplinaSeleccionada));
    }

    if (filtroPago === 'AL_DIA') {
      filtered = filtered.filter(c => c.estado_pago === 'ALDIA' && c.estado_cliente === 'ACTIVO');
    } else if (filtroPago === 'MOROSOS_INACTIVOS') {
      filtered = filtered.filter(c => c.estado_pago === 'MOROSO' || c.estado_cliente === 'INACTIVO');
    }

    setClientesFiltrados(filtered);
    setClientesSeleccionados(filtered.map(c => c.id));
  }, [planSeleccionado, disciplinaSeleccionada, filtroPago, categorias, clientesList]);

  const handleClienteToggle = (id) => {
    setClientesSeleccionados(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const getCategoriaColor = (catId) => {
    const cat = categorias.find(c => c.id === catId);
    return cat?.color || '#ccc';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (clientesSeleccionados.length === 0) {
      setMessage({ text: "Selecciona al menos un cliente.", type: 'error' });
      window.scrollTo(0, 0);
      return;
    }
    if (diasSeleccionados.length === 0 || horariosSeleccionados.length === 0) {
      setMessage({ text: "Selecciona al menos un día y una franja horaria.", type: 'error' });
      window.scrollTo(0, 0);
      return;
    }
    if (mesesSeleccionados.length === 0) {
      setMessage({ text: "Selecciona al menos un mes.", type: 'error' });
      window.scrollTo(0, 0);
      return;
    }

    const horariosMatches = [];
    // Match horarios by ranges AND by specific category if selected
    diasSeleccionados.forEach(diaNum => {
      horariosSeleccionados.forEach(range => {
        const match = horarios.find(h => {
          const hRange = `${formatTime(h.hora_inicio)} - ${formatTime(h.hora_fin)}`;
          const isSameDayAndRange = h.dia_semana === parseInt(diaNum) && hRange === range;
          const isSameCategoria = disciplinaSeleccionada ? h.categoriaId === parseInt(disciplinaSeleccionada) : true;
          return isSameDayAndRange && isSameCategoria;
        });
        if (match) {
          horariosMatches.push(match.id);
        }
      });
    });

    if (horariosMatches.length === 0) {
      setMessage({ text: "Ninguna de las combinaciones de día y horario seleccionadas está configurada en el sistema para la disciplina elegida. Asegúrate de elegir un día que tenga esa franja horaria activa para dicha disciplina.", type: 'error' });
      window.scrollTo(0, 0);
      return;
    }

    const seleccionadosInfo = clientesList.filter(c => clientesSeleccionados.includes(c.id));
    const morososOInactivos = seleccionadosInfo.filter(c => c.estado_pago === 'MOROSO' || c.estado_cliente === 'INACTIVO');

    if (morososOInactivos.length > 0) {
      setHorariosMatchesCalculados(horariosMatches);
      setMorososSeleccionados(morososOInactivos);
      setIsConfirmModalOpen(true);
      return;
    }

    executeSubmit(horariosMatches);
  };

  const executeSubmit = async (horariosMatchesOpcional = null) => {
    try {
      setLoading(true);
      
      const horariosFinales = horariosMatchesOpcional || horariosMatchesCalculados;

      const res = await api.post('/api/turnos/masivo', {
        clienteIds: clientesSeleccionados,
        horarioIds: horariosFinales,
        meses: mesesSeleccionados,
        anio: new Date().getFullYear()
      });
      setMessage({ text: res.data.message || 'Turnos asignados correctamente.', type: 'success' });
      // Limpiar formulario y cerrar modales
      setDiasSeleccionados([]);
      setHorariosSeleccionados([]);
      setMesesSeleccionados([]);
      setIsMobileFiltrosOpen(false);
      setIsConfirmModalOpen(false);
      setMorososSeleccionados([]);
      
      // Limpiar mensaje tras 5 segundos
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Error al asignar turnos masivos.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent-blue)' }} />
      </div>
    );
  }
  const renderForm = () => (
    <form onSubmit={handleSubmit}>
      {/* 1. Filtro de Abono (Plan) */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#444' }}>1. Filtrar por Abono (Plan)</label>
              <select
                value={planSeleccionado}
                onChange={(e) => setPlanSeleccionado(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}
              >
                <option value="">-- Todos los Abonos --</option>
                {planes.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.nombre}</option>
                ))}
              </select>
            </div>

            {/* 2. Filtro de Disciplina */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#444' }}>2. Seleccionar Disciplina</label>
              <select 
                value={disciplinaSeleccionada}
                onChange={(e) => setDisciplinaSeleccionada(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}
              >
                <option value="">-- Todas las disciplinas --</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            {/* 2b. Filtro de Estado de Pagos */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#444' }}>Filtrar por Estado</label>
              <select 
                value={filtroPago}
                onChange={(e) => setFiltroPago(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}
              >
                <option value="TODOS">-- Todos los Clientes --</option>
                <option value="AL_DIA">Solo al día y activos</option>
                <option value="MOROSOS_INACTIVOS">Solo morosos / inactivos</option>
              </select>
            </div>

            {/* 3. Días de la semana */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#444' }}>3. Días de la semana</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {TODOS_LOS_DIAS.filter(d => diasApertura.includes(d.id)).map(d => (
                  <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: '#fff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={diasSeleccionados.includes(d.id)}
                      onChange={(e) => setDiasSeleccionados(e.target.checked ? [...diasSeleccionados, d.id] : diasSeleccionados.filter(x => x !== d.id))}
                    />
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Franjas Horarias */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#444' }}>4. Franjas Horarias</label>
              {uniqueRanges.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                  {uniqueRanges.map(range => (
                    <label key={range} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={horariosSeleccionados.includes(range)}
                        onChange={(e) => setHorariosSeleccionados(e.target.checked ? [...horariosSeleccionados, range] : horariosSeleccionados.filter(x => x !== range))}
                      />
                      <span>{range}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#e03131' }}>No hay horarios configurados en el sistema.</p>
              )}
            </div>

            {/* 5. Meses */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#444' }}>5. Replicar en los meses</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {mesesDisponibles.map(m => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: '#e1f0ff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bae6fd', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={mesesSeleccionados.includes(m.id)}
                      onChange={(e) => setMesesSeleccionados(e.target.checked ? [...mesesSeleccionados, m.id] : mesesSeleccionados.filter(x => x !== m.id))}
                    />
                    <span style={{ color: '#0369a1', fontWeight: '500' }}>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || clientesSeleccionados.length === 0}
        style={{
          width: '100%',
          padding: '12px',
          background: (loading || clientesSeleccionados.length === 0) ? '#ccc' : '#00a8e8',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: (loading || clientesSeleccionados.length === 0) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '1rem',
          transition: 'background 0.2s'
        }}
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
        {loading ? 'Asignando...' : 'Confirmar Asignación'}
      </button>
      <p style={{ fontSize: '0.8rem', color: '#777', textAlign: 'center', marginTop: '10px' }}>
        Se asignarán {diasSeleccionados.length * horariosSeleccionados.length * mesesSeleccionados.length * 4} turnos (aprox) a {clientesSeleccionados.length} clientes.
      </p>
    </form>
  );


  return (
    <div className="main-content">
      <style>{styles}</style>
      <PageHeader
        title="Asignación Masiva Mensual"
        subtitle="Genera turnos recurrentes para múltiples clientes en meses futuros"
        image="/img/welcome-background.png"
      />

      {message.text && (
        <div style={{
          backgroundColor: message.type === 'success' ? '#ebfbee' : '#fff1f1',
          color: message.type === 'success' ? '#2f9e44' : '#e03131',
          padding: '12px 20px',
          borderRadius: '8px',
          margin: '0 30px 20px 30px',
          fontWeight: '500',
          border: `1px solid ${message.type === 'success' ? '#b2f2bb' : '#ffc9c9'}`
        }}>
          {message.text}
        </div>
      )}

      <button className="btn-mobile-filtros" onClick={() => setIsMobileFiltrosOpen(true)}>
        <Filter size={20} />
        Filtros y Configuración
      </button>

      <div className="asignacion-masiva-grid">

        {/* Panel Izquierdo: Lista de Clientes */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={20} color="#00a8e8" />
              Alumnos ({clientesFiltrados.length})
            </h3>
            {clientesFiltrados.length > 0 && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f8f9fa', padding: '6px 12px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={clientesSeleccionados.length === clientesFiltrados.length && clientesFiltrados.length > 0}
                  onChange={(e) => setClientesSeleccionados(e.target.checked ? clientesFiltrados.map(c => c.id) : [])}
                />
                <strong>Seleccionar Todos</strong>
              </label>
            )}
          </div>
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {clientesFiltrados.map(c => {
              const isSelected = clientesSeleccionados.includes(c.id);
              const catColor = getCategoriaColor(c.categoriaId);
              return (
                <div
                  key={c.id}
                  onClick={() => handleClienteToggle(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? catColor : '#e9ecef'}`,
                    borderLeft: `5px solid ${catColor}`,
                    background: isSelected ? `${catColor}15` : '#fff', // 15 es opacidad baja en hex
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    style={{ pointerEvents: 'none' }}
                  />
                  <div>
                    <strong style={{ display: 'block', color: '#333' }}>{c.nombre} {c.apellido}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>DNI: {c.dni_cuit}</span>
                  </div>
                </div>
              );
            })}

            {clientesFiltrados.length === 0 && (
              <p style={{ color: '#666', gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0' }}>
                No se encontraron clientes para este filtro.
              </p>
            )}
            </div>
          </div>
        </div>

        {/* Panel Derecho: Filtros y Configuración de Plantilla (Desktop) */}
        <div className="panel-derecho" style={{ background: '#f8f9fa', borderRadius: '12px', padding: '20px', border: '1px solid #e9ecef', height: 'fit-content', position: 'sticky', top: '20px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
            <Calendar size={20} color="#00a8e8" />
            Configurar Asignación
          </h3>
          {renderForm()}
        </div>
      </div>


      {/* Modal de Filtros (Mobile) */}
      <Modal 
        isOpen={isMobileFiltrosOpen} 
        onClose={() => setIsMobileFiltrosOpen(false)} 
        title="Configurar Asignación"
        contentClassName="modal-medium"
      >
        <div style={{ padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
          {renderForm()}
        </div>
      </Modal>

      {/* Modal de Confirmación de Morosos/Inactivos */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="⚠️ Advertencia: Clientes Morosos o Inactivos"
      >
        <div style={{ padding: '20px' }}>
          <p style={{ marginBottom: '15px', color: '#444' }}>
            Los siguientes clientes seleccionados tienen deuda pendiente o se encuentran inactivos en el sistema:
          </p>
          <ul style={{ background: '#fff5f5', border: '1px solid #ffc9c9', padding: '15px', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto', marginBottom: '20px' }}>
            {morososSeleccionados.map(m => (
              <li key={m.id} style={{ color: '#e03131', marginBottom: '5px', fontWeight: '500' }}>
                • {m.nombre} {m.apellido} - {m.estado_pago === 'MOROSO' ? 'Moroso' : 'Inactivo'}
              </li>
            ))}
          </ul>
          <p style={{ marginBottom: '20px', fontWeight: 'bold' }}>
            ¿Confirmás que querés anotarlos de todas formas?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button 
              className="btn-secondary" 
              onClick={() => setIsConfirmModalOpen(false)}
              style={{ background: '#eee', color: '#333', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancelar
            </button>
            <button 
              className="btn-primary" 
              onClick={() => executeSubmit()}
              style={{ background: '#e03131', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Sí, Anotarlos Igual
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );



};

export default AsignacionMasiva;
