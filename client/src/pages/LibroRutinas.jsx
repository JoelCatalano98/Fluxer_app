import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Search, Trash2, Edit2, CheckCircle, ChevronDown, ChevronUp, Save, Loader2, Play, BookOpen, ListTodo, CheckSquare, Filter, X, Users } from 'lucide-react';
import api from '../services/api';

const styles = `
  .libro-rutinas-container {
    padding: 30px;
    width: 100%;
    margin: 0;
    font-family: 'Inter', sans-serif;
  }
  .asignar-grid {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 20px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .asignar-grid {
      grid-template-columns: 1fr;
    }
    .libro-rutinas-container {
      padding: 15px;
    }
  }
`;

const LibroRutinas = () => {
    const [rutinasLibro, setRutinasLibro] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // UI states
    const [modoCreacion, setModoCreacion] = useState(false);
    const [expandedRutinaId, setExpandedRutinaId] = useState(null);
    const [editingRutinaId, setEditingRutinaId] = useState(null);
    const [activeTab, setActiveTab] = useState('biblioteca'); // 'biblioteca' | 'asignar' | 'activas' | 'completadas'
    
    // Filtros para asignaciones
    const [filterCliente, setFilterCliente] = useState('');
    const [filterRutinaId, setFilterRutinaId] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, text: '', onConfirm: null });
    
    // Data states
    const [clientes, setClientes] = useState([]);
    const [selectedRutinaParaAsignar, setSelectedRutinaParaAsignar] = useState('');
    const [clientesSeleccionados, setClientesSeleccionados] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);

    const [nuevaRutina, setNuevaRutina] = useState({
        nombre: '',
        fases: []
    });

    useEffect(() => {
        cargarRutinasLibro();
        cargarClientes();
        cargarAsignaciones();
    }, []);

    const cargarRutinasLibro = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/libro-rutinas?all=true'); 
            if (res.data.success) {
                setRutinasLibro(res.data.data);
            }
        } catch (error) {
            console.error('Error al cargar rutinas del libro:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarClientes = async () => {
        try {
            const res = await api.get('/api/clientes?limit=9999');
            if (res.data.success) {
                setClientes(res.data.data.clientes || []);
            }
        } catch (error) {
            console.error('Error al cargar clientes:', error);
        }
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    const cargarAsignaciones = async () => {
        try {
            const res = await api.get('/api/libro-rutinas/asignaciones');
            if (res.data.success) {
                setAsignaciones(res.data.data);
            }
        } catch (error) {
            console.error('Error al cargar asignaciones:', error);
        }
    };

    const handleCrearNueva = () => {
        setNuevaRutina({ nombre: '', fases: [{ nombre: 'Fase 1', orden: 1, ejercicios: [] }] });
        setEditingRutinaId(null);
        setModoCreacion(true);
    };

    const handleEditarRutina = (rutina) => {
        setNuevaRutina({
            nombre: rutina.nombre,
            fases: rutina.fases.map(f => ({
                ...f,
                ejercicios: f.ejercicios.map(e => ({...e, nombre: e.nombreEjercicio || e.nombre}))
            }))
        });
        setEditingRutinaId(rutina.id);
        setModoCreacion(true);
    };

    // FORMULARIO DINAMICO
    const agregarFase = () => {
        setNuevaRutina(prev => ({
            ...prev,
            fases: [...prev.fases, { nombre: `Fase ${prev.fases.length + 1}`, orden: prev.fases.length + 1, ejercicios: [] }]
        }));
    };

    const actualizarFase = (faseIdx, campo, valor) => {
        const nuevas = [...nuevaRutina.fases];
        nuevas[faseIdx][campo] = valor;
        setNuevaRutina({ ...nuevaRutina, fases: nuevas });
    };

    const eliminarFase = (faseIdx) => {
        const nuevas = [...nuevaRutina.fases];
        nuevas.splice(faseIdx, 1);
        setNuevaRutina({ ...nuevaRutina, fases: nuevas });
    };

    const agregarEjercicio = (faseIdx) => {
        const nuevas = [...nuevaRutina.fases];
        nuevas[faseIdx].ejercicios.push({
            nombre: '',
            series: 3,
            repeticiones: '10',
            descanso: '60s',
            pesoSugerido: '',
            videoUrl: '',
            notas: ''
        });
        setNuevaRutina({ ...nuevaRutina, fases: nuevas });
    };

    const actualizarEjercicio = (faseIdx, ejIdx, campo, valor) => {
        const nuevas = [...nuevaRutina.fases];
        nuevas[faseIdx].ejercicios[ejIdx][campo] = valor;
        setNuevaRutina({ ...nuevaRutina, fases: nuevas });
    };

    const eliminarEjercicio = (faseIdx, ejIdx) => {
        const nuevas = [...nuevaRutina.fases];
        nuevas[faseIdx].ejercicios.splice(ejIdx, 1);
        setNuevaRutina({ ...nuevaRutina, fases: nuevas });
    };

    const handleGuardarRutina = async () => {
        if (!nuevaRutina.nombre.trim()) {
            showMessage('El nombre de la rutina es obligatorio.', 'error');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                nombre: nuevaRutina.nombre,
                fases: nuevaRutina.fases
            };

            let res;
            if (editingRutinaId) {
                res = await api.put(`/api/libro-rutinas/${editingRutinaId}`, payload);
            } else {
                res = await api.post('/api/libro-rutinas', payload);
            }

            if (res.data.success) {
                await cargarRutinasLibro();
                setModoCreacion(false);
            }
        } catch (error) {
            console.error('Error al guardar rutina:', error);
            showMessage('Error al guardar la rutina.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ASIGNACION
    const prepararAsignacion = (rutinaId) => {
        setSelectedRutinaParaAsignar(rutinaId.toString());
        setClientesSeleccionados([]);
        setActiveTab('asignar');
    };

    const toggleCliente = (id) => {
        setClientesSeleccionados(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const toggleTodosClientes = () => {
        if (clientesSeleccionados.length === clientesFiltradosLista.length) {
            setClientesSeleccionados([]);
        } else {
            setClientesSeleccionados(clientesFiltradosLista.map(c => c.id));
        }
    };

    const handleAsignarMasiva = async () => {
        if (clientesSeleccionados.length === 0) {
            showMessage('Selecciona al menos un cliente.', 'error');
            return;
        }
        if (!selectedRutinaParaAsignar) {
            showMessage('Selecciona una rutina para asignar.', 'error');
            return;
        }

        try {
            setLoading(true);
            const res = await api.post('/api/libro-rutinas/asignar', {
                clienteIds: clientesSeleccionados,
                rutinaLibroId: selectedRutinaParaAsignar
            });
            if (res.data.success) {
                showMessage(res.data.message || 'Asignación completada');
                setClientesSeleccionados([]);
                setSelectedRutinaParaAsignar('');
                cargarAsignaciones(); 
                setActiveTab('activas');
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Error al asignar las rutinas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAvanzarFase = (asignacion) => {
        setConfirmDialog({
            isOpen: true,
            text: '¿Avanzar a la siguiente fase de esta rutina?',
            onConfirm: async () => {
                try {
                    const rutina = asignacion.rutinaLibro;
                    const currentFaseIndex = rutina.fases.findIndex(f => f.id === asignacion.faseActualId);
                    
                    let nuevaFaseId = null;
                    if (currentFaseIndex >= 0 && currentFaseIndex < rutina.fases.length - 1) {
                        nuevaFaseId = rutina.fases[currentFaseIndex + 1].id;
                    }

                    const res = await api.put(`/api/libro-rutinas/asignacion/${asignacion.id}/avanzar-fase`, { nuevaFaseId });
                    if (res.data.success) {
                        showMessage('Fase avanzada exitosamente');
                        cargarAsignaciones();
                    }
                } catch (error) {
                    console.error(error);
                    showMessage('Error al avanzar fase', 'error');
                }
            }
        });
    };

    const handleCompletar = (asignacionId) => {
        setConfirmDialog({
            isOpen: true,
            text: '¿Marcar esta rutina como completada en su totalidad?',
            onConfirm: async () => {
                try {
                    const res = await api.put(`/api/libro-rutinas/asignacion/${asignacionId}/completar`);
                    if (res.data.success) {
                        showMessage('Rutina completada exitosamente');
                        cargarAsignaciones();
                    }
                } catch (error) {
                    console.error(error);
                    showMessage('Error al completar asignación', 'error');
                }
            }
        });
    };

    const rutinasFiltradas = rutinasLibro.filter(r => r.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtrado de Asignaciones
    const asignacionesActivas = asignaciones.filter(a => a.estado === 'activa');
    const asignacionesCompletadas = asignaciones.filter(a => a.estado === 'completada');

    const listToFilter = activeTab === 'activas' ? asignacionesActivas : (activeTab === 'completadas' ? asignacionesCompletadas : []);
    
    const asignacionesFiltradas = listToFilter.filter(a => {
        const matchesClient = filterCliente === '' || 
            `${a.cliente.nombre} ${a.cliente.apellido} ${a.cliente.dni_cuit}`.toLowerCase().includes(filterCliente.toLowerCase());
        const matchesRutina = filterRutinaId === '' || a.rutinaLibroId.toString() === filterRutinaId;
        return matchesClient && matchesRutina;
    });

    const rutinasUnicasAsignadas = Array.from(new Set(listToFilter.map(a => a.rutinaLibroId)))
        .map(id => listToFilter.find(a => a.rutinaLibroId === id).rutinaLibro);

    // Filtrado de clientes para asignación masiva
    const clientesFiltradosLista = clientes.filter(c => 
        filterCliente === '' || 
        `${c.nombre} ${c.apellido} ${c.dni_cuit}`.toLowerCase().includes(filterCliente.toLowerCase())
    );


    if (modoCreacion) {
        return (
            <div className="libro-rutinas-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <style>{styles}</style>
                
                {message.text && (
                    <div style={{
                        backgroundColor: message.type === 'success' ? '#ebfbee' : '#fff1f1',
                        color: message.type === 'success' ? '#2f9e44' : '#e03131',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontWeight: '500',
                        border: `1px solid ${message.type === 'success' ? '#b2f2bb' : '#ffc9c9'}`
                    }}>
                        {message.text}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ fontSize: '1.5rem', color: '#333' }}>
                        {editingRutinaId ? 'Editar Rutina del Libro' : 'Nueva Rutina para el Libro'}
                    </h1>
                    <div>
                        <button 
                            onClick={() => setModoCreacion(false)}
                            style={{ padding: '8px 16px', background: '#f1f3f5', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
                            Cancelar
                        </button>
                        <button 
                            onClick={handleGuardarRutina}
                            style={{ padding: '8px 16px', background: '#00a8e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Save size={16} /> Guardar
                        </button>
                    </div>
                </div>

                <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#444' }}>Nombre de la Rutina</label>
                    <input 
                        type="text" 
                        value={nuevaRutina.nombre}
                        onChange={(e) => setNuevaRutina({...nuevaRutina, nombre: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }}
                        placeholder="Ej: Plan Hipertrofia 3 Meses"
                    />
                </div>

                {nuevaRutina.fases.map((fase, fIdx) => (
                    <div key={fIdx} style={{ background: '#f8f9fa', padding: '25px', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <input 
                                type="text"
                                value={fase.nombre}
                                onChange={(e) => actualizarFase(fIdx, 'nombre', e.target.value)}
                                style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#333', background: 'transparent', border: 'none', borderBottom: '2px solid #ccc', outline: 'none', paddingBottom: '4px', width: '300px' }}
                                placeholder="Nombre de la fase (Ej: Fase 1 - Adaptación)"
                            />
                            <button onClick={() => eliminarFase(fIdx)} style={{ background: '#ffe3e3', border: 'none', color: '#e03131', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}><Trash2 size={20} /></button>
                        </div>

                        {fase.ejercicios.map((ej, ejIdx) => (
                            <div key={ejIdx} style={{ background: '#fff', padding: '15px 20px', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                <div style={{ flex: '1 1 200px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Ejercicio</label>
                                    <input type="text" value={ej.nombre} onChange={(e) => actualizarEjercicio(fIdx, ejIdx, 'nombre', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}/>
                                </div>
                                <div style={{ flex: '0 0 80px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Series</label>
                                    <input type="number" value={ej.series} onChange={(e) => actualizarEjercicio(fIdx, ejIdx, 'series', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}/>
                                </div>
                                <div style={{ flex: '0 0 100px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Reps</label>
                                    <input type="text" value={ej.repeticiones} onChange={(e) => actualizarEjercicio(fIdx, ejIdx, 'repeticiones', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}/>
                                </div>
                                <div style={{ flex: '0 0 100px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Descanso</label>
                                    <input type="text" value={ej.descanso} onChange={(e) => actualizarEjercicio(fIdx, ejIdx, 'descanso', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}/>
                                </div>
                                <div style={{ flex: '1 1 120px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Sugerido</label>
                                    <input type="text" value={ej.pesoSugerido} onChange={(e) => actualizarEjercicio(fIdx, ejIdx, 'pesoSugerido', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}/>
                                </div>
                                <div style={{ flex: '1 1 120px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>URL Video</label>
                                    <input type="text" value={ej.videoUrl} onChange={(e) => actualizarEjercicio(fIdx, ejIdx, 'videoUrl', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}/>
                                </div>
                                <button onClick={() => eliminarEjercicio(fIdx, ejIdx)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', alignSelf: 'flex-end', paddingBottom: '8px' }}><X size={20}/></button>
                            </div>
                        ))}
                        <button onClick={() => agregarEjercicio(fIdx)} style={{ background: 'none', border: 'none', color: '#00a8e8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '15px', fontWeight: 'bold' }}>
                            <Plus size={18} /> Agregar Ejercicio
                        </button>
                    </div>
                ))}
                
                <button onClick={agregarFase} style={{ width: '100%', padding: '20px', background: '#f8f9fa', border: '2px dashed #00a8e8', borderRadius: '12px', color: '#00a8e8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 'bold', transition: 'background 0.2s' }}>
                    <Plus size={24} /> Agregar Nueva Fase
                </button>
            </div>
        );
    }

    return (
        <div className="libro-rutinas-container">
            <style>{styles}</style>
            
            {message.text && (
                <div style={{
                    backgroundColor: message.type === 'success' ? '#ebfbee' : '#fff1f1',
                    color: message.type === 'success' ? '#2f9e44' : '#e03131',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontWeight: '500',
                    border: `1px solid ${message.type === 'success' ? '#b2f2bb' : '#ffc9c9'}`
                }}>
                    {message.text}
                </div>
            )}

            {/* Cabecera Principal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', color: '#2d3748', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '800' }}>
                        <div style={{ background: 'linear-gradient(135deg, #00a8e8, #0077b6)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                            <Dumbbell color="#fff" size={28}/>
                        </div>
                        Libro de Rutinas
                    </h1>
                    <p style={{ margin: 0, color: '#718096', fontSize: '1rem', paddingLeft: '52px' }}>Gestioná tus planes de entrenamiento reutilizables y asignaciones</p>
                </div>
                <button 
                    onClick={handleCrearNueva}
                    style={{ background: 'linear-gradient(135deg, #00a8e8, #0077b6)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0, 168, 232, 0.3)', transition: 'transform 0.2s' }}>
                    <Plus size={20} /> Nueva Rutina Base
                </button>
            </div>

            {/* Pestañas de Navegación Premium */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0', overflowX: 'auto' }}>
                <button 
                    onClick={() => { setActiveTab('biblioteca'); setFilterCliente(''); setFilterRutinaId(''); }}
                    style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'biblioteca' ? '3px solid #00a8e8' : '3px solid transparent', color: activeTab === 'biblioteca' ? '#00a8e8' : '#718096', fontWeight: activeTab === 'biblioteca' ? 'bold' : '500', cursor: 'pointer', marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                    <BookOpen size={20} /> Biblioteca ({rutinasLibro.length})
                </button>
                <button 
                    onClick={() => { setActiveTab('asignar'); setFilterCliente(''); }}
                    style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'asignar' ? '3px solid #6366f1' : '3px solid transparent', color: activeTab === 'asignar' ? '#6366f1' : '#718096', fontWeight: activeTab === 'asignar' ? 'bold' : '500', cursor: 'pointer', marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                    <Users size={20} /> Asignar a Alumnos
                </button>
                <button 
                    onClick={() => { setActiveTab('activas'); setFilterCliente(''); setFilterRutinaId(''); }}
                    style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'activas' ? '3px solid #f59f00' : '3px solid transparent', color: activeTab === 'activas' ? '#f59f00' : '#718096', fontWeight: activeTab === 'activas' ? 'bold' : '500', cursor: 'pointer', marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                    <ListTodo size={20} /> Asignaciones Activas ({asignacionesActivas.length})
                </button>
                <button 
                    onClick={() => { setActiveTab('completadas'); setFilterCliente(''); setFilterRutinaId(''); }}
                    style={{ padding: '15px 25px', background: 'none', border: 'none', borderBottom: activeTab === 'completadas' ? '3px solid #40c057' : '3px solid transparent', color: activeTab === 'completadas' ? '#40c057' : '#718096', fontWeight: activeTab === 'completadas' ? 'bold' : '500', cursor: 'pointer', marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                    <CheckSquare size={20} /> Completadas ({asignacionesCompletadas.length})
                </button>
            </div>

            {/* VISTA BIBLIOTECA */}
            {activeTab === 'biblioteca' && (
                <>
                    <div style={{ marginBottom: '25px', position: 'relative', maxWidth: '600px' }}>
                        <Search style={{ position: 'absolute', left: '15px', top: '14px', color: '#a0aec0' }} size={22} />
                        <input 
                            type="text" 
                            placeholder="Buscar rutinas por nombre..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '14px 15px 14px 45px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}
                        />
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={50} color="#00a8e8" /></div>
                    ) : rutinasFiltradas.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#a0aec0', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                            <Dumbbell size={50} color="#cbd5e1" style={{ marginBottom: '15px' }}/>
                            <h3 style={{ margin: '0 0 10px 0', color: '#475569' }}>No se encontraron rutinas</h3>
                            <p style={{ margin: 0 }}>Creá tu primera rutina base para empezar a asignarla a tus alumnos.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
                            {rutinasFiltradas.map(rutina => (
                                <div key={rutina.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column' }}>
                                    <div 
                                        onClick={() => setExpandedRutinaId(expandedRutinaId === rutina.id ? null : rutina.id)}
                                        style={{ padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expandedRutinaId === rutina.id ? '#f8fafc' : '#fff' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ background: '#e1f0ff', padding: '12px', borderRadius: '10px', color: '#00a8e8' }}>
                                                <BookOpen size={24} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: '0 0 5px 0', color: '#2d3748', fontSize: '1.25rem' }}>{rutina.nombre}</h3>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.85rem', color: '#4a5568', background: '#edf2f7', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{rutina.fases.length} Fases</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#a0aec0' }}>creada el {new Date(rutina.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ padding: '8px', color: '#94a3b8' }}>
                                                {expandedRutinaId === rutina.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ padding: '15px 25px', background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditarRutina(rutina); }}
                                            style={{ background: '#f1f5f9', border: 'none', color: '#475569', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                            <Edit2 size={16} /> Editar
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); prepararAsignacion(rutina.id); }}
                                            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)' }}>
                                            <Play size={16} fill="white" /> Asignar a Alumnos
                                        </button>
                                    </div>

                                    {expandedRutinaId === rutina.id && (
                                        <div style={{ padding: '25px', borderTop: '1px solid #e2e8f0', background: '#fafafa', flex: 1 }}>
                                            {rutina.fases.map(fase => (
                                                <div key={fase.id} style={{ marginBottom: '20px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                                    <h4 style={{ margin: '0 0 15px 0', color: '#00a8e8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '8px', height: '8px', background: '#00a8e8', borderRadius: '50%' }}></div>
                                                        {fase.nombre}
                                                    </h4>
                                                    <div style={{ overflowX: 'auto' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                            <thead>
                                                                <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#64748b' }}>
                                                                    <th style={{ padding: '8px 10px', borderBottom: '2px solid #e2e8f0' }}>Ejercicio</th>
                                                                    <th style={{ padding: '8px 10px', borderBottom: '2px solid #e2e8f0' }}>Series</th>
                                                                    <th style={{ padding: '8px 10px', borderBottom: '2px solid #e2e8f0' }}>Reps</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {fase.ejercicios.map(ej => (
                                                                    <tr key={ej.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                        <td style={{ padding: '8px 10px', fontWeight: '500', color: '#334155' }}>{ej.nombreEjercicio}</td>
                                                                        <td style={{ padding: '8px 10px', color: '#475569' }}>{ej.series}</td>
                                                                        <td style={{ padding: '8px 10px', color: '#475569' }}>{ej.repeticiones}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* VISTA ASIGNAR A ALUMNOS */}
            {activeTab === 'asignar' && (
                <div className="asignar-grid">
                    {/* Panel Izquierdo: Lista de Clientes */}
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 250px)', minHeight: '500px' }}>
                        <div style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={20} color="#6366f1" />
                                Seleccionar Alumnos ({clientesSeleccionados.length} / {clientesFiltradosLista.length})
                            </h3>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Search style={{ position: 'absolute', left: '12px', top: '10px', color: '#a0aec0' }} size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por nombre, apellido o DNI..." 
                                        value={filterCliente}
                                        onChange={(e) => setFilterCliente(e.target.value)}
                                        style={{ width: '100%', padding: '9px 10px 9px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                                    />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f8fafc', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                    <input
                                        type="checkbox"
                                        checked={clientesSeleccionados.length === clientesFiltradosLista.length && clientesFiltradosLista.length > 0}
                                        onChange={toggleTodosClientes}
                                    />
                                    <strong>Todos</strong>
                                </label>
                            </div>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
                            {clientesFiltradosLista.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>No se encontraron alumnos.</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                    {clientesFiltradosLista.map(c => {
                                        const isSelected = clientesSeleccionados.includes(c.id);
                                        return (
                                            <div
                                                key={c.id}
                                                onClick={() => toggleCliente(c.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '12px 15px',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${isSelected ? '#6366f1' : '#e2e8f0'}`,
                                                    background: isSelected ? '#eef2ff' : '#fff',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    readOnly
                                                    style={{ pointerEvents: 'none', cursor: 'pointer', width: '18px', height: '18px', accentColor: '#6366f1' }}
                                                />
                                                <div>
                                                    <strong style={{ display: 'block', color: isSelected ? '#3730a3' : '#334155', fontSize: '0.95rem' }}>{c.nombre} {c.apellido}</strong>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>DNI: {c.dni_cuit}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel Derecho: Configuración de Asignación */}
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '25px', border: '1px solid #e2e8f0', position: 'sticky', top: '20px' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
                            <ListTodo size={20} color="#6366f1" />
                            Configurar Asignación
                        </h3>
                        
                        <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '0.95rem' }}>1. Seleccioná la Rutina Base:</label>
                        <div style={{ position: 'relative', marginBottom: '30px' }}>
                            <select 
                                value={selectedRutinaParaAsignar} 
                                onChange={(e) => setSelectedRutinaParaAsignar(e.target.value)}
                                style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', background: '#fff', appearance: 'none', cursor: 'pointer' }}
                            >
                                <option value="">Elegir rutina...</option>
                                {rutinasLibro.map(r => (
                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                ))}
                            </select>
                            <ChevronDown style={{ position: 'absolute', right: '15px', top: '12px', pointerEvents: 'none', color: '#64748b' }} size={20} />
                        </div>

                        <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '30px' }}>
                            <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '0.9rem' }}>Resumen de asignación:</p>
                            <ul style={{ margin: '0', paddingLeft: '20px', color: '#334155', fontSize: '0.95rem' }}>
                                <li><strong>{clientesSeleccionados.length}</strong> alumnos seleccionados</li>
                                <li><strong>Rutina:</strong> {rutinasLibro.find(r => r.id.toString() === selectedRutinaParaAsignar)?.nombre || '(No seleccionada)'}</li>
                            </ul>
                        </div>

                        <button 
                            onClick={handleAsignarMasiva}
                            disabled={loading || clientesSeleccionados.length === 0 || !selectedRutinaParaAsignar}
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                background: (loading || clientesSeleccionados.length === 0 || !selectedRutinaParaAsignar) ? '#cbd5e1' : 'linear-gradient(135deg, #6366f1, #4f46e5)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '8px', 
                                cursor: (loading || clientesSeleccionados.length === 0 || !selectedRutinaParaAsignar) ? 'not-allowed' : 'pointer', 
                                fontSize: '1.05rem', 
                                fontWeight: 'bold', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '8px',
                                boxShadow: (loading || clientesSeleccionados.length === 0 || !selectedRutinaParaAsignar) ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)'
                            }}>
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            {loading ? 'Asignando...' : 'Confirmar Asignación'}
                        </button>
                    </div>
                </div>
            )}


            {/* VISTAS DE ASIGNACIONES (ACTIVAS O COMPLETADAS) */}
            {(activeTab === 'activas' || activeTab === 'completadas') && (
                <>
                    {/* Filtros Contextuales */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ flex: '1 1 250px', position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '12px', top: '10px', color: '#a0aec0' }} size={20} />
                            <input 
                                type="text" 
                                placeholder="Buscar alumno por nombre, apellido o DNI..." 
                                value={filterCliente}
                                onChange={(e) => setFilterCliente(e.target.value)}
                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                            />
                        </div>
                        <div style={{ flex: '1 1 250px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Filter style={{ position: 'absolute', left: '12px', color: '#a0aec0' }} size={20} />
                            <select 
                                value={filterRutinaId}
                                onChange={(e) => setFilterRutinaId(e.target.value)}
                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', background: '#fff', appearance: 'none' }}
                            >
                                <option value="">Todas las rutinas...</option>
                                {rutinasUnicasAsignadas.map(r => (
                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                ))}
                            </select>
                            <ChevronDown style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: '#a0aec0' }} size={20} />
                        </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                        {asignacionesFiltradas.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#a0aec0' }}>
                                <ListTodo size={50} color="#cbd5e1" style={{ marginBottom: '15px' }}/>
                                <h3 style={{ margin: '0 0 10px 0', color: '#475569' }}>No hay asignaciones {activeTab} aquí</h3>
                                <p style={{ margin: 0 }}>Intenta ajustando los filtros o asigna nuevas rutinas.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                                            <th style={{ padding: '15px 20px', borderBottom: '2px solid #e2e8f0' }}>Alumno</th>
                                            <th style={{ padding: '15px 20px', borderBottom: '2px solid #e2e8f0' }}>Rutina Asignada</th>
                                            <th style={{ padding: '15px 20px', borderBottom: '2px solid #e2e8f0' }}>Estado / Fase</th>
                                            <th style={{ padding: '15px 20px', borderBottom: '2px solid #e2e8f0' }}>Fecha Inicio</th>
                                            {activeTab === 'completadas' && <th style={{ padding: '15px 20px', borderBottom: '2px solid #e2e8f0' }}>Fecha Fin</th>}
                                            <th style={{ padding: '15px 20px', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {asignacionesFiltradas.map(asig => {
                                            const totalFases = asig.rutinaLibro.fases.length;
                                            const faseActualIndex = asig.rutinaLibro.fases.findIndex(f => f.id === asig.faseActualId);
                                            const faseNumero = faseActualIndex >= 0 ? faseActualIndex + 1 : '-';
                                            const esUltimaFase = faseActualIndex === totalFases - 1;

                                            return (
                                                <tr key={asig.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
                                                    <td style={{ padding: '15px 20px' }}>
                                                        <strong style={{ color: '#1e293b', fontSize: '1.05rem', display: 'block', marginBottom: '4px' }}>{asig.cliente.nombre} {asig.cliente.apellido}</strong>
                                                        <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '10px' }}>
                                                            <span>DNI: {asig.cliente.dni_cuit}</span> 
                                                            {asig.cliente.codigo_socio && <span>| Socio: #{asig.cliente.codigo_socio}</span>}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '15px 20px', fontWeight: '500', color: '#334155' }}>
                                                        {asig.rutinaLibro.nombre}
                                                    </td>
                                                    <td style={{ padding: '15px 20px' }}>
                                                        {activeTab === 'activas' ? (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', background: '#fff5f5', border: '1px solid #ffe3e3', color: '#e03131', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                                <span style={{ width: '8px', height: '8px', background: '#e03131', borderRadius: '50%', marginRight: '8px', display: 'inline-block' }}></span>
                                                                Fase {faseNumero} de {totalFases}
                                                            </span>
                                                        ) : (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', background: '#ebfbee', border: '1px solid #d3f9d8', color: '#2b8a3e', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                                <CheckCircle size={14} style={{ marginRight: '6px' }} />
                                                                Completada al 100%
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '15px 20px', color: '#475569' }}>
                                                        {new Date(asig.fechaInicio).toLocaleDateString()}
                                                    </td>
                                                    {activeTab === 'completadas' && (
                                                        <td style={{ padding: '15px 20px', color: '#475569' }}>
                                                            {asig.fechaCompletada ? new Date(asig.fechaCompletada).toLocaleDateString() : '-'}
                                                        </td>
                                                    )}
                                                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                            {activeTab === 'activas' ? (
                                                                <>
                                                                    {!esUltimaFase && asig.faseActualId && (
                                                                        <button 
                                                                            onClick={() => handleAvanzarFase(asig)}
                                                                            style={{ padding: '8px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
                                                                            Avanzar Fase
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        onClick={() => handleCompletar(asig.id)}
                                                                        style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #40c057, #2b8a3e)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(64, 192, 87, 0.3)' }}>
                                                                        <CheckCircle size={16}/> Completar
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Archivada</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal de Confirmación Sistema */}
            {confirmDialog.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)' }}>
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.2rem', marginBottom: '15px' }}>Confirmar acción</h3>
                        <p style={{ color: '#475569', marginBottom: '30px', fontSize: '1rem', lineHeight: '1.5' }}>{confirmDialog.text}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button 
                                onClick={() => setConfirmDialog({ isOpen: false, text: '', onConfirm: null })} 
                                style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontWeight: 'bold', transition: 'background 0.2s' }}>
                                Cancelar
                            </button>
                            <button 
                                onClick={() => { 
                                    if (confirmDialog.onConfirm) confirmDialog.onConfirm(); 
                                    setConfirmDialog({ isOpen: false, text: '', onConfirm: null }); 
                                }} 
                                style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', transition: 'transform 0.2s' }}>
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LibroRutinas;
