import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, Info, Tag, Calendar as CalendarIcon } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import api from '../services/api';
import '../styles/style.css';

const Avisos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedAviso, setSelectedAviso] = useState(null);

  const [avisos, setAvisos] = useState([]);
  const [horariosLista, setHorariosLista] = useState([]);

  const [nuevoAviso, setNuevoAviso] = useState({
    titulo: '',
    mensaje: '',
    tipo: 'INFO',
    fechaDesde: new Date().toISOString().split('T')[0],
    fechaHasta: '',
    esBloqueo: false,
    alcanceBloqueo: 'DIA_COMPLETO',
    horaInicioBloqueo: '',
    horaFinBloqueo: '',
    horariosBloqueados: []
  });

  useEffect(() => {
    fetchAvisos();
    fetchHorarios();
  }, []);

  const fetchHorarios = async () => {
    try {
      const res = await api.get('/api/turnos/horarios');
      if (res.data.success) {
        setHorariosLista(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching horarios:', error);
    }
  };

  const fetchAvisos = async () => {
    try {
      const res = await api.get('/api/avisos');
      setAvisos(res.data);
    } catch (error) {
      console.error('Error fetching avisos:', error);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNuevoAviso(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleCreateAviso = async (e) => {
    e.preventDefault();
    if (!nuevoAviso.titulo || !nuevoAviso.fechaDesde) {
        alert("El título y la fecha desde son obligatorios");
        return;
    }
    try {
      const payload = {
        ...nuevoAviso,
        esBloqueo: nuevoAviso.tipo === 'FERIADO' || nuevoAviso.esBloqueo,
        bloquearTodoElDia: nuevoAviso.alcanceBloqueo === 'DIA_COMPLETO',
        horaInicioBloqueo: nuevoAviso.alcanceBloqueo === 'RANGO_HORARIO' ? nuevoAviso.horaInicioBloqueo : null,
        horaFinBloqueo: nuevoAviso.alcanceBloqueo === 'RANGO_HORARIO' ? nuevoAviso.horaFinBloqueo : null,
        horariosBloqueados: nuevoAviso.alcanceBloqueo === 'TURNOS_ESPECIFICOS' ? JSON.stringify(nuevoAviso.horariosBloqueados) : null
      };

      await api.post('/api/avisos', payload);
      setIsModalOpen(false);
      setNuevoAviso({
        titulo: '',
        mensaje: '',
        tipo: 'INFO',
        fechaDesde: new Date().toISOString().split('T')[0],
        fechaHasta: '',
        esBloqueo: false,
        alcanceBloqueo: 'DIA_COMPLETO',
        horaInicioBloqueo: '',
        horaFinBloqueo: '',
        horariosBloqueados: []
      });
      alert("Aviso registrado con éxito");
      fetchAvisos();
    } catch (error) {
      console.error('Error creating aviso:', error);
      alert("Error al registrar el aviso");
    }
  };

  const handleOpenDeleteConfirm = (aviso) => {
    setSelectedAviso(aviso);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/api/avisos/${selectedAviso.id}`);
      setIsDeleteConfirmOpen(false);
      setSelectedAviso(null);
      alert("Aviso eliminado");
      fetchAvisos();
    } catch (error) {
      console.error('Error deleting aviso:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    // Add timezone fix or just slice
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getIconForType = (tipo) => {
      switch (tipo) {
          case 'URGENTE': return <AlertTriangle size={18} color="#ef4444" />;
          case 'PROMO': return <Tag size={18} color="#eab308" />;
          case 'FERIADO': return <CalendarIcon size={18} color="#3b82f6" />;
          default: return <Info size={18} color="#6b7280" />;
      }
  };

  return (
    <div className="main-content">
      <PageHeader
        title="Gestión de Avisos"
        subtitle="Crea feriados, noticias, promociones o alertas"
        image="/img/welcome-background.png"
      />

      <div style={{ padding: '0 20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <button 
            className="btn-primary" 
            onClick={() => setIsModalOpen(true)}
            style={{ width: 'auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#00a8e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            <Plus size={20} /> Nuevo Aviso
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {avisos.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>No hay avisos registrados.</p>
          ) : (
            avisos.map(aviso => (
              <div key={aviso.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `4px solid ${aviso.tipo === 'URGENTE' ? '#ef4444' : aviso.tipo === 'PROMO' ? '#eab308' : aviso.tipo === 'FERIADO' ? '#3b82f6' : '#6b7280'}` }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {getIconForType(aviso.tipo)}
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555' }}>{aviso.tipo}</span>
                  </div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#333' }}>{aviso.titulo}</h3>
                  {aviso.mensaje && <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.95rem' }}>{aviso.mensaje}</p>}
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>
                    <strong>Desde:</strong> {formatDate(aviso.fechaDesde)} 
                    {aviso.fechaHasta && <span> | <strong>Hasta:</strong> {formatDate(aviso.fechaHasta)}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenDeleteConfirm(aviso)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Aviso"
      >
        <form onSubmit={handleCreateAviso} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group">
            <label htmlFor="tipo">Tipo de Aviso</label>
            <select id="tipo" value={nuevoAviso.tipo} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
              <option value="INFO">Información</option>
              <option value="FERIADO">Feriado</option>
              <option value="PROMO">Promoción</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              id="esBloqueo" 
              checked={nuevoAviso.esBloqueo || nuevoAviso.tipo === 'FERIADO'} 
              onChange={(e) => setNuevoAviso(prev => ({ ...prev, esBloqueo: e.target.checked }))} 
              disabled={nuevoAviso.tipo === 'FERIADO'}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="esBloqueo" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.9rem', color: '#475569' }}>Es un Bloqueo de Reservas (Impide sacar turnos)</label>
          </div>

          {(nuevoAviso.tipo === 'FERIADO' || nuevoAviso.esBloqueo) && (
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={{ fontWeight: 'bold', color: '#334155', fontSize: '0.95rem' }}>Alcance del Bloqueo</label>
              
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" name="alcanceBloqueo" value="DIA_COMPLETO" checked={nuevoAviso.alcanceBloqueo === 'DIA_COMPLETO'} onChange={(e) => setNuevoAviso(prev => ({...prev, alcanceBloqueo: e.target.value}))} />
                  Cierra todo el día
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" name="alcanceBloqueo" value="RANGO_HORARIO" checked={nuevoAviso.alcanceBloqueo === 'RANGO_HORARIO'} onChange={(e) => setNuevoAviso(prev => ({...prev, alcanceBloqueo: e.target.value}))} />
                  Rango de Horario
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input type="radio" name="alcanceBloqueo" value="TURNOS_ESPECIFICOS" checked={nuevoAviso.alcanceBloqueo === 'TURNOS_ESPECIFICOS'} onChange={(e) => setNuevoAviso(prev => ({...prev, alcanceBloqueo: e.target.value}))} />
                  Turnos/Clases específicas
                </label>
              </div>

              {nuevoAviso.alcanceBloqueo === 'RANGO_HORARIO' && (
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem' }}>Hora Inicio</label>
                    <input type="time" id="horaInicioBloqueo" value={nuevoAviso.horaInicioBloqueo} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem' }}>Hora Fin</label>
                    <input type="time" id="horaFinBloqueo" value={nuevoAviso.horaFinBloqueo} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  </div>
                </div>
              )}

              {nuevoAviso.alcanceBloqueo === 'TURNOS_ESPECIFICOS' && (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '6px', backgroundColor: 'white' }}>
                  {horariosLista.length === 0 ? <p style={{ fontSize: '0.85rem', color: '#666' }}>Cargando horarios...</p> : horariosLista.map(horario => {
                    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                    const nombreDia = diasSemana[horario.dia_semana] || '';
                    const time = new Date(horario.hora_inicio);
                    const label = `${horario.categoria?.nombre || 'General'} - ${nombreDia} ${String(time.getUTCHours()).padStart(2, '0')}:${String(time.getUTCMinutes()).padStart(2, '0')}hs`;
                    const isChecked = nuevoAviso.horariosBloqueados.includes(horario.id);
                    return (
                      <label key={horario.id} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNuevoAviso(prev => ({ ...prev, horariosBloqueados: [...prev.horariosBloqueados, horario.id] }));
                            } else {
                              setNuevoAviso(prev => ({ ...prev, horariosBloqueados: prev.horariosBloqueados.filter(id => id !== horario.id) }));
                            }
                          }}
                          style={{ marginRight: '8px' }}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="titulo">Título</label>
            <input 
              type="text" 
              id="titulo" 
              value={nuevoAviso.titulo} 
              onChange={handleInputChange} 
              placeholder="Ej: Aumento de cuota, Cerrado por feriado..." 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="mensaje">Mensaje (Opcional)</label>
            <textarea 
              id="mensaje" 
              value={nuevoAviso.mensaje} 
              onChange={handleInputChange} 
              placeholder="Detalles adicionales del aviso..." 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '80px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="fechaDesde">Fecha Desde</label>
              <input 
                type="date" 
                id="fechaDesde" 
                value={nuevoAviso.fechaDesde} 
                onChange={handleInputChange} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                required 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="fechaHasta">Fecha Hasta (Opcional)</label>
              <input 
                type="date" 
                id="fechaHasta" 
                value={nuevoAviso.fechaHasta} 
                onChange={handleInputChange} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} style={{ marginRight: '10px', padding: '10px 20px', border: '1px solid #ddd', backgroundColor: 'white', borderRadius: '6px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 20px', backgroundColor: '#00a8e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Aviso"
        message={`¿Estás seguro que deseas eliminar el aviso "${selectedAviso?.titulo}"?`}
        confirmLabel={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Trash2 size={16} /> Eliminar</div>}
        confirmClassName="flex items-center justify-center gap-2 px-4 py-2 bg-[#00a8e8] text-white hover:bg-[#0092c9] rounded-lg transition-colors text-sm font-medium"
        cancelLabel="Cancelar"
        cancelClassName="flex items-center justify-center px-4 py-2 bg-[#e6f6fd] text-[#00a8e8] hover:bg-[#ccebfc] rounded-lg transition-colors text-sm font-medium"
      />
    </div>
  );
};

export default Avisos;
