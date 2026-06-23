import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash, UserPlus, X, Save, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';
import '../styles/clientes/profesionales.css';

const Profesionales = () => {
  const [profesionales, setProfesionales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingProfesional, setEditingProfesional] = useState(null);
  const [profesionalToDelete, setProfesionalToDelete] = useState(null);

  const [nuevoProfesional, setNuevoProfesional] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    especialidad: '',
    matricula: '',
    email: '',
    telefono: ''
  });

  const fetchProfesionales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/profesionales');
      if (res.data.success) {
        setProfesionales(res.data.data);
      } else {
        throw new Error(res.data.message || 'Error al obtener profesionales');
      }
    } catch (err) {
      console.error('Error fetchProfesionales:', err);
      setError('Error al cargar la lista de profesionales.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfesionales();
  }, [fetchProfesionales]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNuevoProfesional(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const openCreateModal = () => {
    setEditingProfesional(null);
    setNuevoProfesional({
      nombre: '',
      apellido: '',
      dni: '',
      especialidad: '',
      matricula: '',
      email: '',
      telefono: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prof) => {
    setEditingProfesional(prof);
    setNuevoProfesional({
      nombre: prof.nombre,
      apellido: prof.apellido || '',
      dni: prof.dni,
      especialidad: prof.especialidad || '',
      matricula: prof.matricula || '',
      email: prof.email || '',
      telefono: prof.telefono || ''
    });
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (prof) => {
    setProfesionalToDelete(prof);
    setIsDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProfesional) {
        const res = await api.put(`/api/profesionales/${editingProfesional.id}`, nuevoProfesional);
        if (res.data.success) {
          setProfesionales(profesionales.map(p => p.id === editingProfesional.id ? res.data.data : p));
          alert("¡Profesional actualizado con éxito!");
        }
      } else {
        const res = await api.post('/api/profesionales', nuevoProfesional);
        if (res.data.success) {
          setProfesionales([res.data.data, ...profesionales]);
          alert("¡Profesional registrado con éxito!");
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error handleSubmit:', err);
      alert('Error al guardar: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await api.delete(`/api/profesionales/${profesionalToDelete.id}`);
      if (res.data.success) {
        setProfesionales(profesionales.filter(p => p.id !== profesionalToDelete.id));
        alert("Profesional dado de baja correctamente");
      }
      setIsDeleteConfirmOpen(false);
      setProfesionalToDelete(null);
    } catch (err) {
      console.error('Error handleDelete:', err);
      alert('Error al dar de baja');
    }
  };

  return (
    <div className="main-content">
      {/* Encabezado Estandarizado */}
      <section className="dashboard-header content-header">
        <div className="header-overlay">
          <h1 className="header-title">Staff Profesional</h1>
          <p className="header-subtitle">Listado completo de médicos, técnicos y entrenadores.</p>
        </div>
        <img 
          src="/img/welcome-background.png" 
          alt="Fondo" 
          className="header-bg-img" 
        />
      </section>

      <div className="profesionales-container">
        <div className="profesionales-actions">
          <h2>Gestión de Profesionales</h2>
          <button 
            className="btn-crear-profesional" 
            onClick={openCreateModal}
          >
            <UserPlus size={18} /> <span>Crear un profesional</span>
          </button>
        </div><br></br>

        {error && (
          <div style={{ backgroundColor: '#fff1f1', color: '#e03131', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="contenedor-scroll">
          <table className="tabla-cronograma">
            <thead>
              <tr>
                <th className="columna-fija">Referente</th>
                <th>Especialidad</th>
                <th>Matrícula</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-blue)' }} />
                    <p style={{ marginTop: '10px', color: '#666' }}>Cargando profesionales...</p>
                  </td>
                </tr>
              ) : profesionales.length > 0 ? (
                profesionales.map((prof) => (
                  <tr key={prof.id}>
                    <td className="columna-fija"><strong>{prof.nombre} {prof.apellido}</strong></td>
                    <td>{prof.especialidad || 'N/A'}</td>
                    <td>{prof.matricula || 'N/A'}</td>
                    <td>{prof.telefono || 'N/A'}</td>
                    <td>
                      <span className={`badge ${prof.activo ? 'badge-success-light' : ''}`} style={!prof.activo ? { backgroundColor: '#eee', color: '#666' } : {}}>
                        {prof.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="acciones-tabla">
                        <button className="btn-edit-prof" title="Editar" onClick={() => openEditModal(prof)}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn-delete-prof" title="Eliminar" onClick={() => openDeleteConfirm(prof)}>
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No hay profesionales registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingProfesional ? "Editar Profesional" : "Crear Nuevo Profesional"}
      >
        <div id="modalNuevoProfesional">
          <p className="p-instrucciones">Completá los datos para gestionar al miembro del staff.</p>
          <form className="modal-body" onSubmit={handleSubmit}>
            <div className="profesional-form">
              <div className="grupo-entrada">
                <label htmlFor="nombre">Nombre *</label>
                <input type="text" id="nombre" placeholder="Nombre" value={nuevoProfesional.nombre} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="apellido">Apellido *</label>
                <input type="text" id="apellido" placeholder="Apellido" value={nuevoProfesional.apellido} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="dni">DNI *</label>
                <input type="text" id="dni" placeholder="Sin puntos" value={nuevoProfesional.dni} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="especialidad">Especialidad</label>
                <input type="text" id="especialidad" placeholder="Ej: Traumatología" value={nuevoProfesional.especialidad} onChange={handleInputChange} />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="matricula">Nro Matrícula</label>
                <input type="text" id="matricula" placeholder="Ej: 12345/A" value={nuevoProfesional.matricula} onChange={handleInputChange} />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" placeholder="profesional@ejemplo.com" value={nuevoProfesional.email} onChange={handleInputChange} />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="telefono">Teléfono</label>
                <input type="tel" id="telefono" placeholder="+54 9 ..." value={nuevoProfesional.telefono} onChange={handleInputChange} />
              </div>
            </div>
            
            <div className="pie-formulario">
              <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                <X size={18} /> <span>Cancelar</span>
              </button>
              <button type="submit" className="btn-save">
                <Save size={18} /> <span>{editingProfesional ? "Actualizar Datos" : "Registrar Profesional"}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal 
        isOpen={isDeleteConfirmOpen} 
        onClose={() => setIsDeleteConfirmOpen(false)} 
        title="Confirmar eliminación"
      >
        <div className="confirm-modal-content">
          <AlertTriangle size={48} className="confirm-icon" />
          <p className="confirm-message">
            ¿Estás seguro de que deseas eliminar al profesional <strong>{profesionalToDelete?.nombre} {profesionalToDelete?.apellido}</strong>?
          </p>
          <p className="confirm-warning">Esta acción no se puede deshacer.</p>
          <div className="confirm-actions">
            <button 
              className="btn-cancel" 
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancelar
            </button>
            <button 
              className="btn-confirm-delete"
              onClick={handleConfirmDelete}
            >
              Eliminar Staff
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profesionales;
