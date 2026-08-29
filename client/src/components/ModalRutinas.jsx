import React, { useState, useEffect } from 'react';
import { X, Dumbbell, Trash2, Plus, ArrowLeft, ChevronDown, ChevronUp, Save, Loader2, Calculator } from 'lucide-react';
import api from '../services/api';
import CalculadoraPesos from './CalculadoraPesos';

const ModalRutinas = ({ isOpen, onClose, cliente, isGeneral = false }) => {
  const [rutinasExistentes, setRutinasExistentes] = useState([]);
  const [modoCreacion, setModoCreacion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedRutinaId, setExpandedRutinaId] = useState(null);
  const [showCalculadora, setShowCalculadora] = useState(false);
  const [editingRutinaId, setEditingRutinaId] = useState(null);

  // Estado del formulario dinámico
  const [nuevaRutina, setNuevaRutina] = useState({
    nombre: '',
    descripcion: '',
    dias: []
  });

  useEffect(() => {
    if (isOpen && (cliente || isGeneral)) {
      cargarRutinas();
      setModoCreacion(false);
      setEditingRutinaId(null);
      setNuevaRutina({ nombre: '', descripcion: '', dias: [] });
    }
  }, [isOpen, cliente]);

  const cargarRutinas = async () => {
    try {
      setLoading(true);
      const res = await api.get(isGeneral ? '/api/rutinas/general' : `/api/rutinas/cliente/${cliente.id}`);
      if (res.data.success) {
        setRutinasExistentes(res.data.data);
      }
    } catch (error) {
      console.error('Error al cargar rutinas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarRutina = async (rutinaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta rutina de forma permanente?')) return;
    
    try {
      const res = await api.delete(`/api/rutinas/${rutinaId}`);
      if (res.data.success) {
        setRutinasExistentes(prev => prev.filter(r => r.id !== rutinaId));
        if (expandedRutinaId === rutinaId) setExpandedRutinaId(null);
      }
    } catch (error) {
      console.error('Error al eliminar rutina:', error);
      alert('Error al eliminar rutina.');
    }
  };

  const handleEditarRutina = (rutina) => {
    // Transformar los ejercicios de la BD al formato del form (agrupados por día)
    const diasAgrupados = {};
    if (rutina.ejercicios && rutina.ejercicios.length > 0) {
      rutina.ejercicios.forEach(ej => {
        const diaNombre = ej.dia || 'Día 1';
        if (!diasAgrupados[diaNombre]) {
          diasAgrupados[diaNombre] = [];
        }
        diasAgrupados[diaNombre].push({
          nombre: ej.nombreEjercicio,
          series: ej.series,
          repeticiones: ej.repeticiones,
          pesoSugerido: ej.pesoSugerido || '',
          descanso: ej.descanso || '', // Si no existe en el schema, se mandará vacío
          notas: ej.notas || '',
          videoUrl: ej.videoUrl || ''
        });
      });
    } else {
      diasAgrupados['Día 1'] = [];
    }

    const diasArray = Object.keys(diasAgrupados).map(dia => ({
      nombre: dia,
      ejercicios: diasAgrupados[dia]
    }));

    setNuevaRutina({
      nombre: rutina.nombre || '',
      descripcion: rutina.descripcion || '',
      dias: diasArray
    });

    setEditingRutinaId(rutina.id);
    setModoCreacion(true);
  };

  const agregarDia = () => {
    setNuevaRutina(prev => ({
      ...prev,
      dias: [...prev.dias, { nombre: `Día ${prev.dias.length + 1}`, ejercicios: [] }]
    }));
  };

  const agregarEjercicio = (diaIndex) => {
    const nuevosDias = [...nuevaRutina.dias];
    nuevosDias[diaIndex].ejercicios.push({
      nombre: '',
      series: 3,
      repeticiones: '10-12',
      descanso: '90s',
      pesoSugerido: '',
      notas: '',
      videoUrl: ''
    });
    setNuevaRutina({ ...nuevaRutina, dias: nuevosDias });
  };

  const actualizarDia = (diaIndex, campo, valor) => {
    const nuevosDias = [...nuevaRutina.dias];
    nuevosDias[diaIndex][campo] = valor;
    setNuevaRutina({ ...nuevaRutina, dias: nuevosDias });
  };

  const actualizarEjercicio = (diaIndex, ejIndex, campo, valor) => {
    const nuevosDias = [...nuevaRutina.dias];
    nuevosDias[diaIndex].ejercicios[ejIndex][campo] = valor;
    setNuevaRutina({ ...nuevaRutina, dias: nuevosDias });
  };

  const eliminarDia = (diaIndex) => {
    const nuevosDias = [...nuevaRutina.dias];
    nuevosDias.splice(diaIndex, 1);
    setNuevaRutina({ ...nuevaRutina, dias: nuevosDias });
  };

  const eliminarEjercicio = (diaIndex, ejIndex) => {
    const nuevosDias = [...nuevaRutina.dias];
    nuevosDias[diaIndex].ejercicios.splice(ejIndex, 1);
    setNuevaRutina({ ...nuevaRutina, dias: nuevosDias });
  };

  const handleGuardarRutina = async () => {
    if (!nuevaRutina.nombre.trim()) {
      alert('El nombre de la rutina es obligatorio.');
      return;
    }
    
    if (nuevaRutina.dias.length === 0) {
      alert('Agrega al menos un día a la rutina.');
      return;
    }

    try {
      setLoading(true);

      // Convertimos el estado agrupado por días a un array plano
      const ejerciciosPlanos = [];
      nuevaRutina.dias.forEach(dia => {
        dia.ejercicios.forEach(ej => {
          ejerciciosPlanos.push({
            ...ej,
            dia: dia.nombre // Pasamos el nombre del día como string
          });
        });
      });

      const payload = {
        nombre: nuevaRutina.nombre || (isGeneral ? 'Rutina General' : ''),
        clienteId: isGeneral ? null : cliente.id,
        ejercicios: ejerciciosPlanos
      };

      let res;
      if (editingRutinaId && !isGeneral) { // isGeneral uses its own upsert endpoint
        res = await api.put(`/api/rutinas/${editingRutinaId}`, payload);
      } else {
        res = await api.post(isGeneral ? '/api/rutinas/general' : '/api/rutinas', payload);
      }
      
      if (res.data.success) {
        await cargarRutinas();
        setModoCreacion(false);
        setEditingRutinaId(null);
        setNuevaRutina({ nombre: '', descripcion: '', dias: [] });
      }
    } catch (error) {
      console.error('Error al guardar rutina:', error);
      alert('Error al guardar la rutina.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || (!cliente && !isGeneral)) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      <style>{`
        .ejercicio-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .ejercicio-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .ej-col-span-2 {
            grid-column: span 2 / span 2;
          }
        }
        @media (min-width: 1024px) {
          .ejercicio-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .ej-col-span-4 {
            grid-column: span 4 / span 4;
          }
        }
      `}</style>
      <div className="modal-content" style={{
        backgroundColor: '#fff', borderRadius: '12px', width: '95%', maxWidth: '1024px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        {/* HEADER */}
        <div style={{
          padding: '20px 25px', borderBottom: '1px solid #eee', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Dumbbell size={24} color="#00a8e8" />
              Gestión de Rutinas
            </h2>
            <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#666' }}>
              {isGeneral ? (
                <span style={{ color: '#0369a1' }}>Gestión de Rutina General (Compartida para todos)</span>
              ) : (
                <>Cliente: <strong>{cliente.nombre} {cliente.apellido}</strong></>
              )}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#999',
            padding: '5px'
          }}>
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '25px', overflowY: 'auto', flex: 1, backgroundColor: '#fafafa' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" size={40} color="#00a8e8" />
            </div>
          ) : modoCreacion ? (
            // ====================== MODO CREACIÓN ======================
            <div className="rutina-form">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <button 
                  onClick={() => { setModoCreacion(false); setEditingRutinaId(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}
                >
                  <ArrowLeft size={16} /> Volver a la lista
                </button>
                <button 
                  onClick={() => setShowCalculadora(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fff', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '6px', color: '#333', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                >
                  <Calculator size={16} /> Calculadora %
                </button>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Nombre de la Rutina</label>
                  <input 
                    type="text" 
                    value={nuevaRutina.nombre}
                    onChange={(e) => setNuevaRutina({...nuevaRutina, nombre: e.target.value})}
                    placeholder="Ej: Hipertrofia Nivel 1"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Descripción (Opcional)</label>
                  <input 
                    type="text" 
                    value={nuevaRutina.descripcion}
                    onChange={(e) => setNuevaRutina({...nuevaRutina, descripcion: e.target.value})}
                    placeholder="Ej: Rutina de 4 días enfocada en brazos..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
              </div>

              {nuevaRutina.dias.map((dia, diaIdx) => (
                <div key={diaIdx} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
                    <input 
                      type="text"
                      value={dia.nombre}
                      onChange={(e) => actualizarDia(diaIdx, 'nombre', e.target.value)}
                      style={{ fontSize: '1.05rem', fontWeight: '600', color: '#333', border: 'none', background: 'transparent', outline: 'none', width: '300px' }}
                      placeholder="Nombre del día (Ej: Lunes - Pecho)"
                    />
                    <button onClick={() => eliminarDia(diaIdx)} title="Eliminar Día" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {dia.ejercicios.map((ej, ejIdx) => (
                    <div key={ejIdx} style={{ backgroundColor: '#fff', padding: '16px', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
                      <div className="ejercicio-grid">
                        <div className="ej-col-span-2 ej-col-span-4">
                          <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Ejercicio</label>
                          <input type="text" value={ej.nombre} onChange={(e) => actualizarEjercicio(diaIdx, ejIdx, 'nombre', e.target.value)} placeholder="Ej: Press Banca" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Series</label>
                          <input type="number" value={ej.series} onChange={(e) => actualizarEjercicio(diaIdx, ejIdx, 'series', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Repeticiones</label>
                          <input type="text" value={ej.repeticiones} onChange={(e) => actualizarEjercicio(diaIdx, ejIdx, 'repeticiones', e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Descanso</label>
                          <input type="text" value={ej.descanso} onChange={(e) => actualizarEjercicio(diaIdx, ejIdx, 'descanso', e.target.value)} placeholder="Ej: 90s" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Peso Sugerido</label>
                          <input type="text" value={ej.pesoSugerido} onChange={(e) => actualizarEjercicio(diaIdx, ejIdx, 'pesoSugerido', e.target.value)} placeholder="Ej: 40-60-80" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} />
                        </div>
                        <div className="ej-col-span-2 ej-col-span-4">
                          <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Notas</label>
                          <input type="text" value={ej.notas} onChange={(e) => actualizarEjercicio(diaIdx, ejIdx, 'notas', e.target.value)} placeholder="Opcional..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} />
                        </div>
                        <div className="ej-col-span-2 ej-col-span-4">
                          <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '4px', fontWeight: '500' }}>Video URL</label>
                          <input type="text" value={ej.videoUrl} onChange={(e) => actualizarEjercicio(diaIdx, ejIdx, 'videoUrl', e.target.value)} placeholder="https://youtube.com/..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} />
                        </div>
                      </div>
                      <button onClick={() => eliminarEjercicio(diaIdx, ejIdx)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '16px', padding: '12px', background: '#fee2e2', border: '1px dashed #fca5a5', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                        <Trash2 size={18} /> Eliminar Ejercicio
                      </button>
                    </div>
                  ))}

                  <button 
                    onClick={() => agregarEjercicio(diaIdx)}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#e1f0ff', color: '#00a8e8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', marginTop: '10px' }}
                  >
                    <Plus size={16} /> Añadir Ejercicio
                  </button>
                </div>
              ))}

              <button 
                onClick={agregarDia}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', border: '2px dashed #ccc', borderRadius: '8px', backgroundColor: 'transparent', color: '#666', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600' }}
              >
                <Plus size={20} /> Agregar Nuevo Día
              </button>

            </div>
          ) : (
            // ====================== MODO VISUALIZACIÓN ======================
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button 
                  onClick={() => { setNuevaRutina({ nombre: '', descripcion: '', dias: [] }); setEditingRutinaId(null); setModoCreacion(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}
                >
                  <Plus size={18} /> Crear Nueva Rutina
                </button>
              </div>

              {rutinasExistentes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                  <Dumbbell size={48} color="#ddd" style={{ marginBottom: '15px' }} />
                  <p style={{ fontSize: '1.1rem', margin: 0 }}>
                    {isGeneral ? 'Aún no existe una rutina general configurada.' : 'Este cliente aún no tiene rutinas asignadas.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {rutinasExistentes.map(rutina => (
                    <div key={rutina.id} style={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                      <div 
                        onClick={() => setExpandedRutinaId(expandedRutinaId === rutina.id ? null : rutina.id)}
                        style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: expandedRutinaId === rutina.id ? '#f8f9fa' : '#fff' }}
                      >
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#333' }}>{rutina.nombre}</h3>
                          <span style={{ fontSize: '0.8rem', color: '#888' }}>
                            Creada: {new Date(rutina.createdAt || rutina.fechaInicio).toLocaleDateString()} • {rutina.ejercicios?.length || 0} ejercicios
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditarRutina(rutina); }}
                            style={{ background: '#e1f0ff', border: 'none', color: '#00a8e8', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                            title="Editar Rutina"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEliminarRutina(rutina.id); }}
                            style={{ background: '#fff1f1', border: 'none', color: '#e03131', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                            title="Eliminar Rutina"
                          >
                            <Trash2 size={16} />
                          </button>
                          {expandedRutinaId === rutina.id ? <ChevronUp size={20} color="#666" /> : <ChevronDown size={20} color="#666" />}
                        </div>
                      </div>

                      {expandedRutinaId === rutina.id && (
                        <div style={{ padding: '20px', borderTop: '1px solid #eee' }}>
                          {rutina.descripcion && (
                            <p style={{ margin: '0 0 15px', fontSize: '0.9rem', color: '#555', fontStyle: 'italic' }}>{rutina.descripcion}</p>
                          )}
                          
                          {rutina.ejercicios && rutina.ejercicios.length > 0 ? (
                            Object.entries(
                              rutina.ejercicios.reduce((acc, ej) => {
                                const diaNombre = ej.dia || 'Sin Día';
                                if (!acc[diaNombre]) acc[diaNombre] = [];
                                acc[diaNombre].push(ej);
                                return acc;
                              }, {})
                            ).map(([diaNombre, ejerciciosDia], idx) => (
                              <div key={idx} style={{ marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: '#00a8e8', borderBottom: '2px solid #e1f0ff', paddingBottom: '5px', display: 'inline-block' }}>
                                  {diaNombre}
                                </h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa', color: '#666', textAlign: 'left' }}>
                                      <th style={{ padding: '8px 10px', borderRadius: '4px 0 0 4px' }}>Ejercicio</th>
                                      <th style={{ padding: '8px 10px' }}>Series</th>
                                      <th style={{ padding: '8px 10px' }}>Reps</th>
                                      <th style={{ padding: '8px 10px' }}>Sugerido</th>
                                      <th style={{ padding: '8px 10px' }}>Real</th>
                                      <th style={{ padding: '8px 10px', borderRadius: '0 4px 4px 0' }}>Notas Socio</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ejerciciosDia.map((ej) => (
                                      <tr key={ej.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '10px', fontWeight: '500', color: '#333' }}>{ej.nombreEjercicio}</td>
                                        <td style={{ padding: '10px', color: '#666' }}>{ej.series}</td>
                                        <td style={{ padding: '10px', color: '#666' }}>{ej.repeticiones}</td>
                                        <td style={{ padding: '10px', color: '#666' }}>{ej.pesoSugerido || '-'}</td>
                                        <td style={{ padding: '10px', color: '#10b981', fontWeight: 'bold' }}>{ej.pesoReal ? `${ej.pesoReal} kg` : '-'}</td>
                                        <td style={{ padding: '10px', color: '#666', fontStyle: 'italic', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ej.notas || ''}>
                                          {ej.notas || '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ))
                          ) : (
                            <p style={{ margin: 0, color: '#999', fontStyle: 'italic', fontSize: '0.9rem' }}>Esta rutina no tiene ejercicios.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {modoCreacion && (
          <div style={{ padding: '15px 25px', borderTop: '1px solid #eee', backgroundColor: '#fff', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button 
              onClick={() => { setModoCreacion(false); setEditingRutinaId(null); }}
              style={{ padding: '10px 20px', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              Cancelar
            </button>
            <button 
              onClick={handleGuardarRutina}
              style={{ padding: '10px 20px', backgroundColor: '#00a8e8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={18} /> Guardar Rutina
            </button>
          </div>
        )}
      </div>
      {showCalculadora && <CalculadoraPesos onClose={() => setShowCalculadora(false)} />}
    </div>
  );
};

export default ModalRutinas;
