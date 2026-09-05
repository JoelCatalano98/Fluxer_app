import { useState, useEffect, useCallback } from 'react';
import { CirclePlus, Check, X, Save, List, LayoutGrid, AlertTriangle, Loader2 } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import TableActions from '../components/TableActions';
import api from '../services/api';
import { useConfirmModal } from '../hooks/useConfirmModal';
import '../styles/style.css';
import '../styles/Servicios/gestion_planes.css';
import '../styles/clientes/listados_gestion.css';

const GestionPlanes = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'list'
  const [editingPlan, setEditingPlan] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [nuevoPlan, setNuevoPlan] = useState({
    nombre: '',
    etiqueta: '',
    precio: '',
    frecuencia: 'Mensual',
    tipoFrecuencia: 'SEMANAL',
    cantidadClases: '',
    beneficios: ''
  });

  const deleteModal = useConfirmModal();

  const fetchPlanes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/planes');
      if (res.data.success) {
        setPlanes(res.data.data);
      } else {
        throw new Error(res.data.message || 'Error al obtener planes');
      }
    } catch (err) {
      console.error('Error fetchPlanes:', err);
      setError('Error al cargar la lista de planes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanes();
  }, [fetchPlanes]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNuevoPlan(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setNuevoPlan({
      nombre: '',
      etiqueta: '',
      precio: '',
      frecuencia: 'Mensual',
      tipoFrecuencia: 'SEMANAL',
      cantidadClases: '',
      beneficios: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setNuevoPlan({
      nombre: plan.nombre,
      etiqueta: plan.etiqueta || '',
      precio: Math.round(Number(plan.precio)).toString(),
      frecuencia: plan.frecuencia || 'Mensual',
      tipoFrecuencia: plan.tipoFrecuencia || 'SEMANAL',
      cantidadClases: plan.cantidadClases !== null ? plan.cantidadClases.toString() : '',
      beneficios: plan.caracteristicas || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevoPlan.nombre || !nuevoPlan.precio || !nuevoPlan.frecuencia) {
      setMessage({ text: "Los campos obligatorios no pueden estar vacíos", type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }

    const dataToSave = {
      nombre: nuevoPlan.nombre,
      etiqueta: nuevoPlan.etiqueta || null,
      precio: parseFloat(nuevoPlan.precio),
      frecuencia: nuevoPlan.frecuencia,
      tipoFrecuencia: nuevoPlan.tipoFrecuencia,
      cantidadClases: nuevoPlan.cantidadClases ? parseInt(nuevoPlan.cantidadClases) : null,
      caracteristicas: nuevoPlan.beneficios || null,
      observaciones: nuevoPlan.beneficios ? nuevoPlan.beneficios.split('\n')[0] : null
    };

    try {
      if (editingPlan) {
        const res = await api.put(`/api/planes/${editingPlan.id}`, dataToSave);
        if (res.data.success) {
          setPlanes(planes.map(p => p.id === editingPlan.id ? res.data.data : p));
          setMessage({ text: "¡Plan actualizado con éxito!", type: 'success' });
          setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
      } else {
        const res = await api.post('/api/planes', dataToSave);
        if (res.data.success) {
          setPlanes([res.data.data, ...planes]);
          setMessage({ text: "¡Plan creado con éxito!", type: 'success' });
          setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error handleSubmit:', err);
      setMessage({ text: 'Error al guardar: ' + (err.response?.data?.message || err.message), type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleConfirmDelete = async () => {
    const plan = deleteModal.selectedItem;
    if (!plan) return;
    try {
      const res = await api.delete(`/api/planes/${plan.id}`);
      if (res.data.success) {
        setPlanes(planes.filter(p => p.id !== plan.id));
        setMessage({ text: "Plan eliminado correctamente", type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (err) {
      console.error('Error handleDelete:', err);
      setMessage({ text: 'Error al eliminar el plan', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      deleteModal.closeModal();
    }
  };

  return (
    <div className="main-content">
      {/* Encabezado con imagen de fondo */}
      <PageHeader
        title="Gestión de Planes"
        subtitle="Configura los abonos y membresías"
        image="/img/welcome-background.png"
      />

      {/* Alerta de mensaje */}
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

      {/* Alerta de Error si ocurre alguno */}
      {error && (
        <div style={{ backgroundColor: '#fff1f1', color: '#e03131', padding: '15px', borderRadius: '8px', margin: '20px 30px 0 30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Acciones principales */}
      <div className="planes-actions-bar">
        <button
          className="btn-create-plan"
          onClick={openCreateModal}
        >
          <CirclePlus size={18} /> <span>Crear Nuevo Plan</span>
        </button>
        <button
          className="btn-toggle-view"
          onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
        >
          {viewMode === 'cards' ? (
            <><List size={18} /> <span>Ver Lista de Planes</span></>
          ) : (
            <><LayoutGrid size={18} /> <span>Ver Cuadrícula</span></>
          )}
        </button>
      </div>

      {viewMode === 'cards' ? (
        loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px' }}>
            <Loader2 className="animate-spin" style={{ color: 'var(--accent-blue)' }} size={32} />
            <p style={{ marginTop: '15px', color: '#666' }}>Cargando planes...</p>
          </div>
        ) : planes.length > 0 ? (
          <div className="cuadricula-planes">
            {planes.map((plan) => (
              <div key={plan.id} className={`tarjeta-plan ${plan.etiqueta === 'Recomendado' ? 'destacado' : ''}`}>
                {plan.etiqueta && <div className="etiqueta-plan">{plan.etiqueta}</div>}
                <h3>{plan.nombre}</h3>
                <p className="precio">${Math.round(Number(plan.precio)).toLocaleString('es-AR')} <span>/mes</span></p>
                <ul className="caracteristicas-plan">
                  {plan.caracteristicas && plan.caracteristicas.split('\n').map((b, i) => (
                    <li key={i}><Check size={14} color="#40c057" /> {b}</li>
                  ))}
                </ul>
                <TableActions
                  onEdit={() => openEditModal(plan)}
                  onDelete={() => deleteModal.openModal(plan)}
                  containerClassName="acciones-plan"
                  editClassName="btn-icon-edit"
                  deleteClassName="btn-icon-delete"
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
            No hay planes registrados.
          </div>
        )
      ) : (
        <div className="listado-planes-container">
          <div className="listado-header">
            <h2 className="listado-title">Abonos y Planes</h2>
            <p className="listado-subtitle">Gestiona las membresías y paquetes de servicios.</p>
          </div>

          {/* Reemplazamos table-wrapper por contenedor-scroll para habilitar el desplazamiento */}
          <div className="contenedor-scroll ">
            {/* Cambiamos data-table por tabla-cronograma para heredar el min-width de 900px */}
            <table className="tabla-cronograma table-wrapper">
              <thead>
                <tr>
                  <th className="columna-fija">Nombre del Plan</th>
                  <th>Código</th>
                  <th>Precio</th>
                  <th>Observaciones</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '60px' }}>
                      <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-blue)' }} />
                      <p style={{ marginTop: '15px', color: '#666' }}>Cargando planes...</p>
                    </td>
                  </tr>
                ) : planes.length > 0 ? (
                  planes.map((plan) => (
                    <tr key={plan.id}>
                      <td className="columna-fija"><strong>{plan.nombre}</strong></td>
                      <td>{plan.codigo}</td>
                      <td>${Math.round(Number(plan.precio)).toLocaleString('es-AR')}</td>
                      <td>{plan.observaciones || 'N/A'}</td>
                      <td>
                        <span className={`badge ${plan.activo ? 'badge-success-light' : 'badge-danger-light'}`}>
                          {plan.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <TableActions
                          onEdit={() => openEditModal(plan)}
                          onDelete={() => deleteModal.openModal(plan)}
                          editClassName="btn-icon-edit"
                          deleteClassName="btn-icon-delete"
                          editTitle="Editar"
                          deleteTitle="Eliminar"
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                      No hay planes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? "Editar Plan de Abono" : "Crear Nuevo Plan de Abono"}
      >
        <div id="modalNuevoPlan">
          <form className="plan-form" onSubmit={handleSubmit}>
            <div className="cuadricula-form">
              <div className="grupo-entrada">
                <label htmlFor="nombre">Nombre del Plan</label>
                <input type="text" id="nombre" placeholder="Ej: Musculación Pase Libre" value={nuevoPlan.nombre} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="etiqueta">Etiqueta</label>
                <input type="text" id="etiqueta" placeholder="Ej: Recomendado, Básico" value={nuevoPlan.etiqueta} onChange={handleInputChange} />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="precio">Precio Mensual ($)</label>
                <input type="number" id="precio" placeholder="0.00" value={nuevoPlan.precio} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="frecuencia">Frecuencia </label>
                <select id="frecuencia" value={nuevoPlan.frecuencia} onChange={handleInputChange}>
                  <option value="Mensual">Mensual</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Quincenal">Quincenal</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>
              <div className="grupo-entrada">
                <label htmlFor="tipoFrecuencia">Límite de Clases (Ciclo)</label>
                <select id="tipoFrecuencia" value={nuevoPlan.tipoFrecuencia} onChange={handleInputChange}>
                  <option value="SEMANAL">Semanal</option>
                  <option value="MENSUAL">Mensual</option>
                </select>
              </div>
              <div className="grupo-entrada">
                <label htmlFor="cantidadClases">Cantidad de Clases (Máx)</label>
                <input type="number" id="cantidadClases" placeholder="Dejar vacío si es ilimitado" value={nuevoPlan.cantidadClases} onChange={handleInputChange} min="1" />
              </div>
              <div className="grupo-entrada full-width">
                <label htmlFor="beneficios">Características / Beneficios (uno por línea)</label>
                <textarea id="beneficios" placeholder="Acceso total&#10;Rutina personalizada..." value={nuevoPlan.beneficios} onChange={handleInputChange} rows="3"></textarea>
              </div>
            </div>
            <div className="pie-formulario">
              <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                <X size={18} /> <span>Cancelar</span>
              </button>
              <button type="submit" className="btn-save">
                <Save size={18} /> <span>{editingPlan ? "Actualizar Plan" : "Guardar Plan"}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title="Confirmar eliminación"
        message={<>¿Estás seguro de que deseas eliminar el plan <strong>{deleteModal.selectedItem?.nombre}</strong>?</>}
        warning="Esta acción no se puede deshacer."
        icon={<AlertTriangle size={48} className="confirm-icon" />}
        onCancel={() => deleteModal.closeModal()}
        onConfirm={handleConfirmDelete}
        cancelLabel="Cancelar"
        confirmLabel="Eliminar Plan"
      />
    </div>
  );
};

export default GestionPlanes;
