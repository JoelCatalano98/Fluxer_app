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
  const [errorValidacion, setErrorValidacion] = useState("");

  const [selectedCellTurnos, setSelectedCellTurnos] = useState([]);
  const [clientesList, setClientesList] = useState([]);
  const [profesionalesList, setProfesionalesList] = useState([]);
  const [feriadosList, setFeriadosList] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [diasPermitidos, setDiasPermitidos] = useState([1, 2, 3, 4, 5, 6]);

  const TODOS_LOS_DIAS = [
    { id: 0, label: 'Domingo' }, { id: 1, label: 'Lunes' }, { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' }, { id: 4, label: 'Jueves' }, { id: 5, label: 'Viernes' }, { id: 6, label: 'Sábado' }
  ];

  const [configGlobal, setConfigGlobal] = useState({});
  const [nuevoHorario, setNuevoHorario] = useState({ inicio: '', fin: '', dias: [], categoriaId: '', profesionalId: '' });

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
    hora_fin: '',
    categoriaId: '',
    profesionalId: ''
  });

  // Hook useForm para el modal "Anotar Cliente"
  const [anotarValues, handleAnotarInputChange, resetAnotarForm] = useForm({
    clienteId: '',
    profesionalId: ''
  });

  // Cargar clientes, profesionales, feriados y configuración de días
  useEffect(() => {
    // Carga de Feriados
    api.get('/api/feriados').then(res => {
      if (res.data) setFeriadosList(res.data);
    }).catch(() => setFeriadosList([]));

    // 1. Carga de Configuración
    api.get('/api/configuracion')
      .then(res => {
        console.log("🛠️ DEBUG CONFIG:", res.data);
        const configData = Array.isArray(res.data) ? res.data[0] : (res.data?.data || res.data);
        setConfigGlobal(configData);
        const diasStr = configData?.diasApertura || "1,2,3,4,5,6";
        setDiasPermitidos(diasStr.split(',').map(d => parseInt(d, 10)).filter(val => val !== null && !isNaN(val) && val >= 0));
      })
      .catch(err => console.error("❌ ERROR CONFIG:", err));

    // 2. Carga de Categorías/Disciplinas
    api.get('/api/categorias')
      .then(res => {
        console.log("🛠️ DEBUG CATEGORIAS:", res.data);
        const cats = res.data?.data || res.data || [];
        setCategorias(cats);
      })
      .catch(err => console.error("❌ ERROR CATEGORIAS:", err));
  }, [semanaBase]);

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
    if (isAnotarModalOpen || configGlobal.profesoresPorTurno) {
      loadFormData();
    }
  }, [isAnotarModalOpen, configGlobal.profesoresPorTurno]);

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

  const handleCheckboxNuevoHorario = (diaId) => {
    const numId = Number(diaId);
    setNuevoHorario(prev => {
      const numDias = prev.dias.map(Number);
      if (numDias.includes(numId)) {
        return { ...prev, dias: numDias.filter(d => d !== numId) };
      } else {
        return { ...prev, dias: [...numDias, numId] };
      }
    });
  };

  const handleCheckboxDiasSeleccionados = (diaId) => {
    const numId = Number(diaId);
    setDiasSeleccionados(prev => {
      const numDias = prev.map(Number);
      if (numDias.includes(numId)) {
        return numDias.filter(d => d !== numId);
      } else {
        return [...numDias, numId];
      }
    });
  };

  const handleCheckboxEditHorario = (diaId) => {
    const numId = Number(diaId);
    setEditHorarioDias(prev => {
      const numDias = prev.map(Number);
      if (numDias.includes(numId)) {
        return numDias.filter(d => d !== numId);
      } else {
        return [...numDias, numId];
      }
    });
  };

  const handleAddHorario = async (e) => {
    e.preventDefault();
    setErrorValidacion("");

    if (!nuevoHorario.inicio || !nuevoHorario.fin || nuevoHorario.dias.length === 0 || nuevoHorario.categoriaId === '') {
      return setErrorValidacion("Por favor, completa los días, horarios y disciplina.");
    }

    if (configGlobal?.profesoresPorTurno && !nuevoHorario.profesionalId) {
      return setErrorValidacion("Gestión Avanzada: Por favor, selecciona un profesional para este horario.");
    }

    try {
      await crearHorario({
        dias: nuevoHorario.dias.map(d => parseInt(d)),
        hora_inicio: nuevoHorario.inicio,
        hora_fin: nuevoHorario.fin,
        categoriaId: parseInt(nuevoHorario.categoriaId),
        profesionalId: nuevoHorario.profesionalId ? parseInt(nuevoHorario.profesionalId) : null
      });
      setIsConfigModalOpen(false);
      setNuevoHorario({ inicio: '', fin: '', dias: [], categoriaId: '', profesionalId: '' });
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
          const dayNames = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
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
  const handleOpenEditHorario = (range, categoriaId) => {
    setErrorValidacion("");
    const matching = horarios.filter(h => {
      const hRange = `${formatTime(h.hora_inicio)} - ${formatTime(h.hora_fin)}`;
      // Comparación estricta de string para rango y coincidencia de categoría (incluso si es null)
      return hRange === range && h.categoriaId === categoriaId;
    });

    if (matching.length === 0) return;

    setSelectedRangeSchedules(matching);
    
    // Marcar por defecto los días que ya tienen configurada esta franja
    const configuredDays = matching.map(h => Number(h.dia_semana));
    setEditHorarioDias(configuredDays);

    const first = matching[0];
    setSelectedHorarioId(first.id); // Guardamos la id del base para enviar al endpoint
    setEditHorarioValues({
      hora_inicio: formatTime(first.hora_inicio),
      hora_fin: formatTime(first.hora_fin),
      categoriaId: first.categoriaId || '',
      profesionalId: first.profesionalId || ''
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
    setErrorValidacion("");

    if (editHorarioDias.length === 0 || !editHorarioValues.hora_inicio || !editHorarioValues.hora_fin || editHorarioValues.categoriaId === '') {
      return setErrorValidacion("Por favor, completa los días, horarios y disciplina. Si deseas quitar la franja, haz clic en 'Dar de Baja'.");
    }

    if (configGlobal?.profesoresPorTurno && !editHorarioValues.profesionalId) {
      return setErrorValidacion("Gestión Avanzada: Por favor, selecciona un profesional para este horario.");
    }

    try {
      await editarHorario(selectedHorarioId, {
        dias: editHorarioDias,
        hora_inicio: editHorarioValues.hora_inicio,
        hora_fin: editHorarioValues.hora_fin,
        categoriaId: editHorarioValues.categoriaId ? parseInt(editHorarioValues.categoriaId) : null,
        profesionalId: editHorarioValues.profesionalId ? parseInt(editHorarioValues.profesionalId) : null
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
            onClick={() => { setErrorValidacion(""); setIsConfigModalOpen(true); }}
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
                {TODOS_LOS_DIAS.filter(dia => diasPermitidos.includes(dia.id)).map(dia => {
                  const offset = dia.id === 0 ? 6 : dia.id - 1;
                  const d = new Date(getLunesDeSemana(semanaBase));
                  d.setDate(d.getDate() + offset);
                  const fechaFormat = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                  return <th key={dia.id}>{dia.label.substring(0, 3)} {fechaFormat}</th>;
                })}
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
                    <td className="etiqueta-hora columna-fija" style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span>{range}</span>
                        <button 
                          onClick={() => {
                            // Buscar el primer horario de esta fila para editarlo
                            const firstInRow = horarios.find(h => `${formatTime(h.hora_inicio)} - ${formatTime(h.hora_fin)}` === range);
                            if (firstInRow) {
                              handleOpenEditHorario(range, firstInRow.categoriaId);
                            }
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0', display: 'flex' }}
                          title="Editar franja horaria"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                    
                    {TODOS_LOS_DIAS.filter(dia => diasPermitidos.includes(dia.id)).map(dia => {
                      const diaSemanaNum = dia.id; // 0 = Dom, 1 = Lun, etc.
                      const offset = dia.id === 0 ? 6 : dia.id - 1;
                      const d = new Date(getLunesDeSemana(semanaBase));
                      d.setDate(d.getDate() + offset);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      const fechaExacta = `${y}-${m}-${day}`;
                      
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
                        <td key={dia.id} style={{ padding: 0, verticalAlign: 'top', border: '1px solid #e5e7eb' }}>
                          {tieneSlotConfigurado ? (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                              {slotsMatching.map((slot, sIdx) => {
                                const turnosDelSlot = turnos.filter(t => t.horarioId === slot.id);
                                const count = turnosDelSlot.length;
                                const catNombre = slot.categoria?.nombre || 'General';
                                const catColor = slot.categoria?.color || '#00a8e8';
                                const profNombre = slot.profesional ? `${slot.profesional.nombre} ${slot.profesional.apellido}` : '';

                                return (
                                  <div 
                                    key={slot.id} 
                                    style={{ 
                                      backgroundColor: `${catColor}15`,
                                      borderBottom: sIdx < slotsMatching.length - 1 ? `1px solid ${catColor}30` : 'none',
                                      padding: '4px 6px',
                                      fontSize: '0.85rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      minHeight: '40px',
                                      flexGrow: 1
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: catColor }}></div>
                                        <span style={{ color: '#111827', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase' }}>{catNombre}</span>
                                      </div>
                                      {profNombre && configGlobal.profesoresPorTurno && (
                                        <span style={{ color: '#4b5563', fontSize: '0.70rem', textTransform: 'capitalize' }}>({profNombre})</span>
                                      )}
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '10px' }}>
                                      <span style={{ color: count > 0 ? '#059669' : '#6b7280', fontSize: '0.75rem', fontWeight: count > 0 ? '600' : 'normal' }}>
                                        {count > 0 ? `${count} inscrito${count > 1 ? 's' : ''}` : 'Libre'}
                                      </span>
                                      {count > 0 && (
                                        <button 
                                          className="btn-view-turno" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openViewTurnosDetails(turnosDelSlot);
                                          }}
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: '0 4px', display: 'flex' }}
                                          title="Ver inscritos"
                                        >
                                          <Eye size={13} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div style={{ width: '100%', height: '100%', minHeight: '40px', backgroundColor: '#fafafa' }}></div>
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
                {[{id:0, l:'Dom'}, {id:1, l:'Lun'}, {id:2, l:'Mar'}, {id:3, l:'Mié'}, {id:4, l:'Jue'}, {id:5, l:'Vie'}, {id:6, l:'Sáb'}]
                  .filter(dia => diasPermitidos.includes(dia.id))
                  .map(dia => (
                    <label key={dia.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f8f9fa', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
                      <input 
                        type="checkbox" 
                        value={dia.id}
                        checked={nuevoHorario.dias.map(Number).includes(Number(dia.id))}
                        onChange={() => handleCheckboxNuevoHorario(dia.id)}
                      /> <span>{dia.l}</span>
                    </label>
                ))}
              </div>
            </div>

            <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Etiqueta (Disciplina)</label>
              <select 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                name="categoriaId"
                value={nuevoHorario.categoriaId} 
                onChange={(e) => setNuevoHorario({...nuevoHorario, categoriaId: e.target.value})}
              >
                <option value="">Selecciona una disciplina...</option>
                {categorias.length === 0 && <option value="" disabled>⚠️ No hay disciplinas en la Base de Datos</option>}
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            {configGlobal.profesoresPorTurno && (
              <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Asignar Profesional (Opcional)</label>
                <select 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  name="profesionalId"
                  value={nuevoHorario.profesionalId} 
                  onChange={(e) => setNuevoHorario({...nuevoHorario, profesionalId: e.target.value})}
                >
                  <option value="">-- Sin Asignar --</option>
                  {profesionalesList.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido} ({p.especialidad || 'General'})</option>
                  ))}
                </select>
              </div>
            )}

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

          {errorValidacion && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded text-sm" style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#b91c1c', padding: '12px', marginBottom: '16px', borderRadius: '4px', fontSize: '0.875rem' }}>
              ⚠️ {errorValidacion}
            </div>
          )}

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

          {/* Múltiples Días checkboxes o select */}
          <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
            <label style={{ fontWeight: '600' }}>Seleccionar Día(s)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
              {TODOS_LOS_DIAS.filter(dia => diasPermitidos.includes(dia.id)).map(d => (
                <label key={d.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f8f9fa', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
                  <input 
                    type="checkbox"
                    value={d.id}
                    checked={diasSeleccionados.map(Number).includes(Number(d.id))}
                    onChange={() => handleCheckboxDiasSeleccionados(d.id)}
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
                {TODOS_LOS_DIAS.filter(dia => diasPermitidos.includes(dia.id)).map(d => (
                  <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f8f9fa', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <input 
                      type="checkbox" 
                      value={d.id}
                      checked={editHorarioDias.map(Number).includes(Number(d.id))}
                      onChange={() => handleCheckboxEditHorario(d.id)}
                    />
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Etiqueta (Disciplina)</label>
              <select 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                name="categoriaId"
                value={editHorarioValues.categoriaId}
                onChange={handleEditHorarioChange}
              >
                <option value="">Selecciona una disciplina...</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            {configGlobal.profesoresPorTurno && (
              <div className="grupo-entrada" style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Asignar Profesional (Opcional)</label>
                <select 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  name="profesionalId"
                  value={editHorarioValues.profesionalId}
                  onChange={handleEditHorarioChange}
                >
                  <option value="">-- Sin Asignar --</option>
                  {profesionalesList.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} {p.apellido} ({p.especialidad || 'General'})</option>
                  ))}
                </select>
              </div>
            )}

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
          
          {errorValidacion && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded text-sm" style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#b91c1c', padding: '12px', marginBottom: '16px', borderRadius: '4px', fontSize: '0.875rem' }}>
              ⚠️ {errorValidacion}
            </div>
          )}

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
