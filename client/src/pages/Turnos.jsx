import { useState, useEffect } from 'react';
import { Settings, Plus, Eye, CalendarCheck, UserPlus, Loader2, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { useForm } from '../hooks/useForm';
import { useTurnos } from '../hooks/useTurnos';
import api from '../services/api';
import '../styles/style.css';
import '../styles/Servicios/horarios_cronograma.css';

const Turnos = () => {
  const {
    turnos,
    horarios,
    loading,
    error,
    crearTurno,
    cancelarTurno,
    crearHorario
  } = useTurnos();

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAnotarModalOpen, setIsAnotarModalOpen] = useState(false);
  const [isDetallesModalOpen, setIsDetallesModalOpen] = useState(false);

  const [selectedCellTurnos, setSelectedCellTurnos] = useState([]);
  const [clientesList, setClientesList] = useState([]);
  const [profesionalesList, setProfesionalesList] = useState([]);

  const [nuevoHorario, setNuevoHorario] = useState({ inicio: '', fin: '', dia: '1' });

  // Hook useForm para el modal "Anotar Cliente"
  const [anotarValues, handleAnotarInputChange, resetAnotarForm] = useForm({
    clienteId: '',
    profesionalId: '',
    dia: 'lunes',
    hora: ''
  });

  // Cargar clientes y profesionales para los formularios
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [resClientes, resProfesionales] = await Promise.all([
          api.get('/api/clientes'),
          api.get('/api/profesionales')
        ]);
        if (resClientes.data.success) {
          setClientesList(resClientes.data.data.clientes);
        }
        if (resProfesionales.data.success) {
          setProfesionalesList(resProfesionales.data.data);
        }
      } catch (err) {
        console.error('Error al cargar datos de Clientes y Profesionales:', err);
      }
    };
    if (isAnotarModalOpen) {
      loadFormData();
    }
  }, [isAnotarModalOpen]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getFechaDeDiaSemana = (diaNombre) => {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    const dias = {
      lunes: 1,
      martes: 2,
      miercoles: 3,
      jueves: 4,
      viernes: 5,
      sabado: 6
    };
    
    const targetDiaNum = dias[diaNombre.toLowerCase()] || 1;
    
    const diff = targetDiaNum - diaSemana;
    const targetDate = new Date(hoy);
    targetDate.setDate(hoy.getDate() + diff);
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const date = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  // Obtener franjas horarias únicas ordenadas para las filas de la tabla
  const uniqueRanges = [
    ...new Set(
      horarios.map((h) => {
        const inicioStr = formatTime(h.hora_inicio);
        const finStr = formatTime(h.hora_fin);
        return `${inicioStr} - ${finStr}`;
      })
    ),
  ].sort();

  // Filtrar franjas del día seleccionado para el formulario de anotar
  const diasMap = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
  const diaNumSeleccionado = diasMap[anotarValues.dia] || 1;
  const horariosDelDia = horarios.filter(h => h.dia_semana === diaNumSeleccionado);
  const franjasDelDia = [
    ...new Set(
      horariosDelDia.map(h => {
        const inicioStr = formatTime(h.hora_inicio);
        const finStr = formatTime(h.hora_fin);
        return `${inicioStr} - ${finStr}`;
      })
    )
  ].sort();

  const handleAddHorario = async (e) => {
    e.preventDefault();
    if (!nuevoHorario.inicio || !nuevoHorario.fin || !nuevoHorario.dia) return;

    try {
      await crearHorario({
        dia_semana: parseInt(nuevoHorario.dia),
        hora_inicio: nuevoHorario.inicio,
        hora_fin: nuevoHorario.fin
      });
      setIsConfigModalOpen(false);
      setNuevoHorario({ inicio: '', fin: '', dia: '1' });
      alert("¡Nueva franja horaria agregada con éxito!");
    } catch (err) {
      alert("Error al configurar horario: " + err.message);
    }
  };

  const handleAnotarSubmit = async (e) => {
    e.preventDefault();
    if (!anotarValues.clienteId || !anotarValues.dia || !anotarValues.hora) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    const diaNum = diasMap[anotarValues.dia];
    const selectedHorario = horarios.find(h => {
      const hRange = `${formatTime(h.hora_inicio)} - ${formatTime(h.hora_fin)}`;
      return h.dia_semana === diaNum && hRange === anotarValues.hora;
    });

    if (!selectedHorario) {
      alert("No se encontró una franja horaria válida para ese día y hora");
      return;
    }

    const fecha = getFechaDeDiaSemana(anotarValues.dia);

    try {
      await crearTurno({
        fecha,
        horarioId: selectedHorario.id,
        clienteId: parseInt(anotarValues.clienteId),
        profesionalId: anotarValues.profesionalId ? parseInt(anotarValues.profesionalId) : null
      });
      setIsAnotarModalOpen(false);
      resetAnotarForm();
      alert("¡Cliente anotado con éxito!");
    } catch (err) {
      alert("Error al anotar cliente: " + err.message);
    }
  };

  const openViewTurnosDetails = (turnosInCell) => {
    setSelectedCellTurnos(turnosInCell);
    setIsDetallesModalOpen(true);
  };

  const handleCancelTurno = async (turnoId) => {
    if (window.confirm("¿Estás seguro de que deseas cancelar esta reserva?")) {
      try {
        await cancelarTurno(turnoId);
        setSelectedCellTurnos(prev => prev.filter(t => t.id !== turnoId));
        alert("Reserva cancelada con éxito");
      } catch (err) {
        alert("Error al cancelar la reserva: " + err.message);
      }
    }
  };

  return (
    <div className="main-content">
      {/* Encabezado */}
      <PageHeader
        title="Cronograma Semanal"
        image="/img/welcome-background.png"
      >
        <div className="header-actions">
          <button 
            className="btn-config-horarios" 
            onClick={() => setIsConfigModalOpen(true)}
          >
            <Settings size={16} /> <span>Crear Nuevo Horario</span>
          </button>
          <button 
            className="btn-anotar-cliente" 
            onClick={() => setIsAnotarModalOpen(true)}
          >
            <Plus size={16} /> <span>Anotar Cliente</span>
          </button>
        </div>
      </PageHeader>

      {/* Alerta de Error */}
      {error && (
        <div style={{ backgroundColor: '#fff1f1', color: '#e03131', padding: '15px', borderRadius: '8px', margin: '20px 30px 0 30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabla Dinámica */}
      <div className="table-section">
        <div className="contenedor-scroll">
          <table className="data-table tabla-turnos">
            <thead>
              <tr>
                <th className="columna-fija">Hora</th>
                <th>Lunes</th>
                <th>Martes</th>
                <th>Miércoles</th>
                <th>Jueves</th>
                <th>Viernes</th>
                <th>Sábado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-blue)' }} />
                    <p style={{ marginTop: '10px', color: '#666' }}>Cargando cronograma...</p>
                  </td>
                </tr>
              ) : uniqueRanges.length > 0 ? (
                uniqueRanges.map((range, index) => (
                  <tr key={index}>
                    <td className="etiqueta-hora columna-fija">{range}</td>
                    {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].map((dia, dIdx) => {
                      const diaSemanaNum = dIdx + 1; // 1 = Lunes, etc.
                      
                      // Buscar horarios configurados para este rango y este día
                      const slotsMatching = horarios.filter(h => {
                        const hRange = `${formatTime(h.hora_inicio)} - ${formatTime(h.hora_fin)}`;
                        return hRange === range && h.dia_semana === diaSemanaNum;
                      });
                      
                      const slotIds = slotsMatching.map(s => s.id);
                      
                      // Filtrar turnos de esta celda
                      const turnosEnCelda = turnos.filter(t => slotIds.includes(t.horarioId));
                      const count = turnosEnCelda.length;
                      const tieneSlotConfigurado = slotsMatching.length > 0;

                      return (
                        <td key={dia}>
                          {tieneSlotConfigurado ? (
                            count > 0 ? (
                              <div className={`caja-turno ${count === 1 ? 'activo' : ''}`}>
                                <span>
                                  {count === 1 
                                    ? `${turnosEnCelda[0].cliente?.nombre} ${turnosEnCelda[0].cliente?.apellido}` 
                                    : `${count} pers.`}
                                </span>
                                <button 
                                  className="btn-view-turno"
                                  onClick={() => openViewTurnosDetails(turnosEnCelda)}
                                >
                                  <Eye size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="turno-vacio">-</div>
                            )
                          ) : (
                            <div className="turno-vacio" style={{ opacity: 0.4 }}>-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                    No hay franjas horarias configuradas. Hacé clic en "Crear Nuevo Horario" para empezar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Nuevo Horario */}
      <Modal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        title={<span><CalendarCheck size={20} className="modal-title-icon" /> Agregar Franja Horaria</span>}
      >
        <form className="turnos-form" onSubmit={handleAddHorario}>
          <div className="form-section">
            <p style={{ marginBottom: '15px', color: '#666' }}>Define una nueva franja horaria y el día de la semana correspondiente.</p>
            <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
              <label>Día de la Semana</label>
              <select 
                value={nuevoHorario.dia} 
                onChange={(e) => setNuevoHorario({...nuevoHorario, dia: e.target.value})}
                required
              >
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
                <option value="6">Sábado</option>
              </select>
            </div>
            <div className="form-row">
              <div className="grupo-entrada">
                <label>Hora Inicio</label>
                <input 
                  type="time" 
                  value={nuevoHorario.inicio} 
                  onChange={(e) => setNuevoHorario({...nuevoHorario, inicio: e.target.value})}
                  required 
                />
              </div>
              <div className="grupo-entrada">
                <label>Hora Fin</label>
                <input 
                  type="time" 
                  value={nuevoHorario.fin} 
                  onChange={(e) => setNuevoHorario({...nuevoHorario, fin: e.target.value})}
                  required 
                />
              </div>
            </div>
          </div>
          <div className="pie-formulario">
            <button type="button" className="btn-cancel" onClick={() => setIsConfigModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              <Plus size={18} /> <span>Agregar al Cronograma</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Anotar Cliente */}
      <Modal 
        isOpen={isAnotarModalOpen} 
        onClose={() => setIsAnotarModalOpen(false)} 
        title={<span><UserPlus size={20} className="modal-title-icon" /> Anotar Cliente</span>}
      >
        <form className="turnos-form" onSubmit={handleAnotarSubmit}>
          <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
            <label htmlFor="clienteId">Seleccionar Cliente</label>
            <select 
              id="clienteId" 
              name="clienteId"
              value={anotarValues.clienteId}
              onChange={handleAnotarInputChange}
              required 
            >
              <option value="">-- Seleccione un Cliente --</option>
              {clientesList.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellido} (DNI: {c.dni_cuit})</option>
              ))}
            </select>
          </div>
          <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
            <label htmlFor="profesionalId">Asignar Profesional (Opcional)</label>
            <select 
              id="profesionalId" 
              name="profesionalId"
              value={anotarValues.profesionalId}
              onChange={handleAnotarInputChange}
            >
              <option value="">-- Ninguno / Sin Asignar --</option>
              {profesionalesList.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido} ({p.especialidad || 'Prof. General'})</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="grupo-entrada">
              <label htmlFor="dia_turno">Día</label>
              <select 
                id="dia_turno"
                name="dia"
                value={anotarValues.dia}
                onChange={handleAnotarInputChange}
              >
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
              </select>
            </div>
            <div className="grupo-entrada">
              <label htmlFor="hora_turno">Horario</label>
              <select 
                id="hora_turno"
                name="hora"
                value={anotarValues.hora}
                onChange={handleAnotarInputChange}
                required
              >
                <option value="">-- Seleccione Franja --</option>
                {franjasDelDia.map((f, i) => (
                  <option key={i} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pie-formulario">
            <button type="button" className="btn-cancel" onClick={() => setIsAnotarModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save btn-confirm">
              <Plus size={18} /> <span>Confirmar</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ver Detalles de Reservas */}
      <Modal 
        isOpen={isDetallesModalOpen} 
        onClose={() => setIsDetallesModalOpen(false)} 
        title={<span><Eye size={20} className="modal-title-icon" /> Reservas del Horario</span>}
      >
        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
          {selectedCellTurnos.length > 0 ? (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Profesional</th>
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {selectedCellTurnos.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.cliente?.nombre} {t.cliente?.apellido}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>DNI: {t.cliente?.dni_cuit}</div>
                    </td>
                    <td>
                      {t.profesional 
                        ? `${t.profesional.nombre} ${t.profesional.apellido}` 
                        : <span style={{ color: '#999', fontStyle: 'italic' }}>Ninguno</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-accion-delete"
                        onClick={() => handleCancelTurno(t.id)}
                        style={{ border: 'none', background: '#fff1f1', color: '#e03131', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                        title="Cancelar Reserva"
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No hay reservas en este horario.</p>
          )}
        </div>
        <div className="pie-formulario">
          <button type="button" className="btn-cancel" onClick={() => setIsDetallesModalOpen(false)}>
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Turnos;
