import { useState, useEffect, useMemo } from 'react';
import { Settings, Plus, Eye, CalendarCheck, UserPlus, Loader2, AlertTriangle, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { useForm } from '../hooks/useForm';
import { useTurnos } from '../hooks/useTurnos';
import api from '../services/api';
import '../styles/style.css';
import '../styles/Servicios/horarios_cronograma.css';

// Calcula el lunes de la semana que contiene la fecha dada
const getLunesDeSemana = (fecha = new Date()) => {
  const d = new Date(fecha);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

const Turnos = () => {
  // Estado de la semana visible (lunes de la semana actual por defecto)
  const [semanaBase, setSemanaBase] = useState(() => getLunesDeSemana());

  const {
    turnos,
    horarios,
    loading,
    error,
    fechaInicio,
    fechaFin,
    crearTurno,
    cancelarTurno,
    crearHorario,
    editarHorario,
    eliminarHorario
  } = useTurnos(semanaBase);

  // Navegación de semanas
  const irSemanaAnterior = () => {
    setSemanaBase(prev => {
      const nueva = new Date(prev);
      nueva.setDate(nueva.getDate() - 7);
      return nueva;
    });
  };

  const irSemanaSiguiente = () => {
    setSemanaBase(prev => {
      const nueva = new Date(prev);
      nueva.setDate(nueva.getDate() + 7);
      return nueva;
    });
  };

  const irSemanaActual = () => {
    setSemanaBase(getLunesDeSemana());
  };

  // Etiqueta legible de la semana visible
  const semanaLabel = useMemo(() => {
    const lunes = getLunesDeSemana(semanaBase);
    const sabado = new Date(lunes);
    sabado.setDate(lunes.getDate() + 5);
    const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `Semana del ${fmt(lunes)} al ${fmt(sabado)}`;
  }, [semanaBase]);

  // Verificar si la semana visible es la actual
  const esEstaSemana = useMemo(() => {
    const lunesActual = getLunesDeSemana();
    const lunesVisible = getLunesDeSemana(semanaBase);
    return lunesActual.getTime() === lunesVisible.getTime();
  }, [semanaBase]);

  // Fechas por columna (para mostrar en el header de la tabla)
  const fechasPorDia = useMemo(() => {
    const lunes = getLunesDeSemana(semanaBase);
    return [0, 1, 2, 3, 4, 5].map(offset => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + offset);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }, [semanaBase]);

  const fechasPorDiaFull = useMemo(() => {
    const lunes = getLunesDeSemana(semanaBase);
    return [0, 1, 2, 3, 4, 5].map(offset => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + offset);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    });
  }, [semanaBase]);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAnotarModalOpen, setIsAnotarModalOpen] = useState(false);
  const [isDetallesModalOpen, setIsDetallesModalOpen] = useState(false);
  const [isEditHorarioModalOpen, setIsEditHorarioModalOpen] = useState(false);

  const [selectedCellTurnos, setSelectedCellTurnos] = useState([]);
  const [clientesList, setClientesList] = useState([]);
  const [profesionalesList, setProfesionalesList] = useState([]);
  const [feriadosList, setFeriadosList] = useState([]);

  const [nuevoHorario, setNuevoHorario] = useState({ inicio: '', fin: '', dias: [] });

  // Búsqueda local en modales
  const [clienteSearch, setClienteSearch] = useState('');
  const [profesionalSearch, setProfesionalSearch] = useState('');

  // Selección múltiple para agendamiento de cliente
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [horariosSeleccionados, setHorariosSeleccionados] = useState([]);

  // Edición de Horarios (Días Seleccionados por checkboxes)
  const [selectedHorarioId, setSelectedHorarioId] = useState(null);
  const [selectedRangeSchedules, setSelectedRangeSchedules] = useState([]);
  const [editHorarioDias, setEditHorarioDias] = useState([]);
  const [editHorarioValues, setEditHorarioValues] = useState({
    hora_inicio: '',
    hora_fin: ''
  });

  // Hook useForm para el modal "Anotar Cliente"
  const [anotarValues, handleAnotarInputChange, resetAnotarForm] = useForm({
    clienteId: '',
    profesionalId: ''
  });

  // Cargar clientes, profesionales y feriados
  useEffect(() => {
    const loadData = async () => {
      try {
        const resFeriados = await api.get('/api/feriados');
        if (resFeriados.data) {
          setFeriadosList(resFeriados.data);
        }
      } catch (err) {
        console.error('Error al cargar feriados:', err);
      }
    };
    loadData();
  }, [semanaBase]); // Reload feriados if needed

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

  // Calcula la fecha YYYY-MM-DD del día de la semana actual (1=Lunes...6=Sábado)
  const getFechaDeDiaSemana = (diaSemanaNum) => {
    const hoy = new Date();
    const diaActual = hoy.getDay(); // 0=Dom, 1=Lun...
    const diff = parseInt(diaSemanaNum) - diaActual;
    const target = new Date(hoy);
    target.setDate(hoy.getDate() + diff);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

  // Filtrado local de clientes
  const filteredClientes = clientesList.filter(c => {
    const searchStr = `${c.nombre} ${c.apellido} ${c.dni_cuit || ''}`.toLowerCase();
    return searchStr.includes(clienteSearch.toLowerCase());
  });

  // Filtrado local de profesionales
  const filteredProfesionales = profesionalesList.filter(p => {
    const searchStr = `${p.nombre} ${p.apellido} ${p.dni || ''}`.toLowerCase();
    return searchStr.includes(profesionalSearch.toLowerCase());
  });

  const openAnotarModal = () => {
    setClienteSearch('');
    setProfesionalSearch('');
    setDiasSeleccionados([]);
    setHorariosSeleccionados([]);
    resetAnotarForm();
    setIsAnotarModalOpen(true);
  };

  const handleAddHorario = async (e) => {
    e.preventDefault();
    if (!nuevoHorario.inicio || !nuevoHorario.fin || nuevoHorario.dias.length === 0) {
      alert("Por favor completa la hora de inicio, fin y selecciona al menos un día.");
      return;
    }

    try {
      await crearHorario({
        dias: nuevoHorario.dias.map(d => parseInt(d)),
        hora_inicio: nuevoHorario.inicio,
        hora_fin: nuevoHorario.fin
      });
      setIsConfigModalOpen(false);
      setNuevoHorario({ inicio: '', fin: '', dias: [] });
      alert("¡Nueva(s) franja(s) horaria(s) agregada(s) con éxito!");
    } catch (err) {
      alert("Error al configurar horario: " + err.message);
    }
  };

  const handleAnotarSubmit = async (e) => {
    e.preventDefault();
    if (!anotarValues.clienteId) {
      alert("Por favor selecciona un cliente");
      return;
    }

    if (diasSeleccionados.length === 0 || horariosSeleccionados.length === 0) {
      alert("Por favor selecciona al menos un día y al menos una franja horaria");
      return;
    }

    // Construir pares explícitos { fecha, horarioId } — sin ambigüedad
    const turnosToCreate = [];
    const missingConfigs = [];

    diasSeleccionados.forEach(diaNum => {
      const fecha = getFechaDeDiaSemana(parseInt(diaNum));
      horariosSeleccionados.forEach(range => {
        const match = horarios.find(h => {
          const hRange = `${formatTime(h.hora_inicio)} - ${formatTime(h.hora_fin)}`;
          return h.dia_semana === parseInt(diaNum) && hRange === range;
        });

        if (match) {
          turnosToCreate.push({ fecha, horarioId: match.id });
        } else {
          const dayNames = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
          missingConfigs.push(`${dayNames[diaNum]} (${range})`);
        }
      });
    });

    if (turnosToCreate.length === 0) {
      alert("Ninguna de las combinaciones de día y horario seleccionadas está configurada en el cronograma. Por favor crea primero las franjas horarias correspondientes.");
      return;
    }

    if (missingConfigs.length > 0) {
      const proceed = window.confirm(
        `Las siguientes combinaciones no están configuradas y se omitirán:\n${missingConfigs.join('\n')}\n\n¿Deseas continuar?`
      );
      if (!proceed) return;
    }

    try {
      await crearTurno({
        turnos: turnosToCreate,
        clienteId: parseInt(anotarValues.clienteId),
        profesionalId: anotarValues.profesionalId ? parseInt(anotarValues.profesionalId) : null
      });
      setIsAnotarModalOpen(false);
      resetAnotarForm();
      setClienteSearch('');
      setProfesionalSearch('');
      setDiasSeleccionados([]);
      setHorariosSeleccionados([]);
      alert("¡Cliente anotado con éxito!");
    } catch (err) {
      alert("Error al anotar cliente: " + err.message);
    }
  };

  // Apertura y manejo de edición de horarios
  const handleOpenEditHorario = (range) => {
    const matching = horarios.filter(h => {
      const hRange = `${formatTime(h.hora_inicio)} - ${formatTime(h.hora_fin)}`;
      return hRange === range;
    });

    if (matching.length === 0) return;

    setSelectedRangeSchedules(matching);
    
    // Marcar por defecto los días que ya tienen configurada esta franja
    const configuredDays = matching.map(h => h.dia_semana);
    setEditHorarioDias(configuredDays);

    const first = matching[0];
    setSelectedHorarioId(first.id); // Guardamos la id del base para enviar al endpoint
    setEditHorarioValues({
      hora_inicio: formatTime(first.hora_inicio),
      hora_fin: formatTime(first.hora_fin)
    });
    setIsEditHorarioModalOpen(true);
  };

  const handleEditHorarioChange = (e) => {
    const { name, value } = e.target;
    setEditHorarioValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleEditDia = (diaVal) => {
    const diaNum = parseInt(diaVal);
    setEditHorarioDias(prev => 
      prev.includes(diaNum)
        ? prev.filter(d => d !== diaNum)
        : [...prev, diaNum]
    );
  };

  const handleEditHorarioSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHorarioId) return;

    if (editHorarioDias.length === 0) {
      alert("Por favor selecciona al menos un día. Si deseas quitar la franja por completo, haz clic en 'Dar de Baja'.");
      return;
    }

    try {
      await editarHorario(selectedHorarioId, {
        dias: editHorarioDias,
        hora_inicio: editHorarioValues.hora_inicio,
        hora_fin: editHorarioValues.hora_fin
      });
      setIsEditHorarioModalOpen(false);
      alert("¡Franja horaria actualizada con éxito!");
    } catch (err) {
      alert("Error al editar horario: " + err.message);
    }
  };

  const handleDeleteHorario = async () => {
    if (!selectedHorarioId) return;
    if (window.confirm("¿Estás seguro de que deseas dar de baja esta configuración de horario? Se mantendrá en el historial pero se removerá del cronograma activo en todos los días configurados.")) {
      try {
        await eliminarHorario(selectedHorarioId);
        setIsEditHorarioModalOpen(false);
        alert("¡Franja horaria dada de baja con éxito!");
      } catch (err) {
        alert("Error al dar de baja el horario: " + err.message);
      }
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

  const toggleConfigDia = (diaVal) => {
    setNuevoHorario(prev => {
      const dias = prev.dias.includes(diaVal)
        ? prev.dias.filter(d => d !== diaVal)
        : [...prev.dias, diaVal];
      return { ...prev, dias };
    });
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
            onClick={openAnotarModal}
          >
            <Plus size={16} /> <span>Anotar Cliente</span>
          </button>
        </div>
      </PageHeader>

      {/* Navegador de Semanas */}
      <div className="semana-navegador" style={{ marginTop: '20px' }}>
        <button className="btn-semana" onClick={irSemanaAnterior}>
          <ChevronLeft size={16} /> Anterior
        </button>
        {!esEstaSemana && (
          <button className="btn-hoy" onClick={irSemanaActual}>
            Hoy
          </button>
        )}
        <span className="semana-label">{semanaLabel}</span>
        <button className="btn-semana" onClick={irSemanaSiguiente}>
          Siguiente <ChevronRight size={16} />
        </button>
      </div>

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
                <th>Lun {fechasPorDia[0]}</th>
                <th>Mar {fechasPorDia[1]}</th>
                <th>Mié {fechasPorDia[2]}</th>
                <th>Jue {fechasPorDia[3]}</th>
                <th>Vie {fechasPorDia[4]}</th>
                <th>Sáb {fechasPorDia[5]}</th>
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
                    {/* Primera columna: Sticky con lápiz de edición */}
                    <td className="etiqueta-hora columna-fija">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span>{range}</span>
                        <button 
                          type="button"
                          className="btn-edit-range"
                          onClick={() => handleOpenEditHorario(range)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#aaa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-blue)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#aaa'}
                          title="Editar franja horaria"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </td>
                    
                    {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].map((dia, dIdx) => {
                      const diaSemanaNum = dIdx + 1; // 1 = Lunes, etc.
                      const fechaExacta = fechasPorDiaFull[dIdx];
                      const feriado = feriadosList.find(f => fechaExacta >= f.fechaInicio && fechaExacta <= f.fechaFin);
                      
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

                      if (feriado) {
                        return (
                          <td key={dia} style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', position: 'relative', padding: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', pointerEvents: 'none' }}>
                              <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                Cerrado: {feriado.motivo}
                              </span>
                            </div>
                          </td>
                        );
                      }

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
                            <div className="turno-deshabilitado"></div>
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
            <p style={{ marginBottom: '15px', color: '#666' }}>Define una nueva franja horaria y selecciona los días de la semana correspondientes.</p>
            
            <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: '600' }}>Días de la Semana</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
                {[
                  { val: '1', label: 'Lunes' },
                  { val: '2', label: 'Martes' },
                  { val: '3', label: 'Miércoles' },
                  { val: '4', label: 'Jueves' },
                  { val: '5', label: 'Viernes' },
                  { val: '6', label: 'Sábado' }
                ].map(d => (
                  <label key={d.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f8f9fa', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <input 
                      type="checkbox" 
                      checked={nuevoHorario.dias.includes(d.val)}
                      onChange={() => toggleConfigDia(d.val)}
                    />
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>
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
        contentClassName="turnos-modal-content"
      >
        <form className="turnos-form" onSubmit={handleAnotarSubmit}>
          
          {/* Seleccionar Cliente con filtro rápido */}
          <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
            <label htmlFor="clienteId" style={{ fontWeight: '600' }}>Seleccionar Cliente</label>
            <input 
              type="text" 
              placeholder="🔍 Buscar cliente por nombre, apellido o DNI..." 
              value={clienteSearch}
              onChange={(e) => setClienteSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                marginBottom: '8px',
                boxSizing: 'border-box',
                fontSize: '0.9rem'
              }}
            />
            <select 
              id="clienteId" 
              name="clienteId"
              value={anotarValues.clienteId}
              onChange={handleAnotarInputChange}
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="">-- Seleccione un Cliente ({filteredClientes.length} encontrados) --</option>
              {filteredClientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellido} (DNI: {c.dni_cuit})</option>
              ))}
            </select>
          </div>

          {/* Seleccionar Profesional con filtro rápido */}
          <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
            <label htmlFor="profesionalId" style={{ fontWeight: '600' }}>Asignar Profesional (Opcional)</label>
            <input 
              type="text" 
              placeholder="🔍 Buscar profesional por nombre o apellido..." 
              value={profesionalSearch}
              onChange={(e) => setProfesionalSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                marginBottom: '8px',
                boxSizing: 'border-box',
                fontSize: '0.9rem'
              }}
            />
            <select 
              id="profesionalId" 
              name="profesionalId"
              value={anotarValues.profesionalId}
              onChange={handleAnotarInputChange}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="">-- Ninguno / Sin Asignar ({filteredProfesionales.length} encontrados) --</option>
              {filteredProfesionales.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido} ({p.especialidad || 'General'})</option>
              ))}
            </select>
          </div>

          {/* Múltiples Días checkboxes */}
          <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: '600' }}>Seleccionar Día(s)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
              {[
                { val: 1, label: 'Lunes' },
                { val: 2, label: 'Martes' },
                { val: 3, label: 'Miércoles' },
                { val: 4, label: 'Jueves' },
                { val: 5, label: 'Viernes' },
                { val: 6, label: 'Sábado' }
              ].map(d => (
                <label key={d.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f8f9fa', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
                  <input 
                    type="checkbox"
                    checked={diasSeleccionados.includes(d.val)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDiasSeleccionados([...diasSeleccionados, d.val]);
                      } else {
                        setDiasSeleccionados(diasSeleccionados.filter(v => v !== d.val));
                      }
                    }}
                  />
                  <span>{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Múltiples Horarios checkboxes */}
          <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: '600' }}>Seleccionar Horario(s)</label>
            {uniqueRanges.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px', maxHeight: '150px', overflowY: 'auto', padding: '5px', border: '1px solid #ddd', borderRadius: '6px' }}>
                {uniqueRanges.map(range => (
                  <label key={range} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f8f9fa', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <input 
                      type="checkbox"
                      checked={horariosSeleccionados.includes(range)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setHorariosSeleccionados([...horariosSeleccionados, range]);
                        } else {
                          setHorariosSeleccionados(horariosSeleccionados.filter(r => r !== range));
                        }
                      }}
                    />
                    <span>{range}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p style={{ color: '#e03131', fontSize: '0.85rem', marginTop: '5px' }}>⚠️ No hay franjas horarias configuradas. Agrégalas primero antes de anotar un cliente.</p>
            )}
          </div>

          <div className="pie-formulario" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-cancel" onClick={() => setIsAnotarModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save btn-confirm">
              <Plus size={18} /> <span>Confirmar</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Horario */}
      <Modal 
        isOpen={isEditHorarioModalOpen} 
        onClose={() => setIsEditHorarioModalOpen(false)} 
        title={<span><CalendarCheck size={20} className="modal-title-icon" /> Editar Franja Horaria</span>}
      >
        <form className="turnos-form" onSubmit={handleEditHorarioSubmit}>
          <div className="form-section">
            <p style={{ marginBottom: '15px', color: '#666' }}>
              Modifica la hora de esta franja o selecciona los días de la semana en los que debe estar activa.
            </p>

            {/* Selector de días de la semana con Checkboxes */}
            <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: '600' }}>Días de la Semana</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
                {[
                  { val: 1, label: 'Lunes' },
                  { val: 2, label: 'Martes' },
                  { val: 3, label: 'Miércoles' },
                  { val: 4, label: 'Jueves' },
                  { val: 5, label: 'Viernes' },
                  { val: 6, label: 'Sábado' }
                ].map(d => (
                  <label key={d.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f8f9fa', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <input 
                      type="checkbox" 
                      checked={editHorarioDias.includes(d.val)}
                      onChange={() => toggleEditDia(d.val)}
                    />
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="grupo-entrada">
                <label>Hora Inicio</label>
                <input 
                  type="time" 
                  name="hora_inicio"
                  value={editHorarioValues.hora_inicio} 
                  onChange={handleEditHorarioChange}
                  required 
                />
              </div>
              <div className="grupo-entrada">
                <label>Hora Fin</label>
                <input 
                  type="time" 
                  name="hora_fin"
                  value={editHorarioValues.hora_fin} 
                  onChange={handleEditHorarioChange}
                  required 
                />
              </div>
            </div>
          </div>
          
          <div className="pie-formulario" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button 
              type="button" 
              className="btn-delete" 
              onClick={handleDeleteHorario}
              style={{
                backgroundColor: '#fff1f1',
                border: '1px solid #ffa8a8',
                color: '#e03131',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffe3e3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff1f1';
              }}
            >
              Dar de Baja
            </button>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn-cancel" onClick={() => setIsEditHorarioModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-save btn-confirm">
                Guardar Cambios
              </button>
            </div>
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
