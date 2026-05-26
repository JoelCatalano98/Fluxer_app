import { useState } from 'react';
import { CirclePlus, Pencil, Trash, Check, X, Save, List, LayoutGrid, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import '../styles/style.css';
import '../styles/Servicios/gestion_planes.css';
import '../styles/clientes/listados_gestion.css';

const GestionPlanes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'list'
  const [editingPlan, setEditingPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  
  const [nuevoPlan, setNuevoPlan] = useState({
    nombre: '',
    etiqueta: '',
    precio: '',
    frecuencia: 'Mensual',
    beneficios: ''
  });

  const [planes, setPlanes] = useState([
    { id: '1', codigo: '#PLN-001', nombre: 'Musculación', precio: '15000', etiqueta: 'Básico', observaciones: '3 veces por semana', estado: 'Activo', beneficios: 'Acceso a sala de pesas\n3 veces por semana' },
    { id: '2', codigo: '#PLN-002', nombre: 'Full Entrenamiento', precio: '22000', etiqueta: 'Recomendado', observaciones: 'Acceso libre total', estado: 'Activo', beneficios: 'Sala de pesas libre\nRutinas específicas\nSeguimiento mensual' },
    { id: '3', codigo: '#PLN-003', nombre: 'Pilates Por Clase', precio: '22000', etiqueta: 'Especial', observaciones: 'Pago por sesión', estado: 'Activo', beneficios: 'Sala de pilates\nEquipamiento completo\nInstructor guiado' },
    { id: '4', codigo: '#PLN-004', nombre: 'Crosfit/Mensual', precio: '22000', etiqueta: 'Intenso', observaciones: 'Entrenamiento funcional', estado: 'Activo', beneficios: 'Box de Crosfit\nWODs diarios\nComunidad activa' },
  ]);

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
      beneficios: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setNuevoPlan({
      nombre: plan.nombre,
      etiqueta: plan.etiqueta || '',
      precio: plan.precio.replace('$', '').replace('.', ''),
      frecuencia: plan.frecuencia || 'Mensual',
      beneficios: plan.beneficios || ''
    });
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (plan) => {
    setPlanToDelete(plan);
    setIsDeleteConfirmOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPlan) {
      setPlanes(planes.map(p => p.id === editingPlan.id ? { ...p, ...nuevoPlan, precio: nuevoPlan.precio } : p));
      alert("¡Plan actualizado con éxito!");
    } else {
      const newId = (planes.length + 1).toString();
      setPlanes([...planes, { ...nuevoPlan, id: newId, codigo: `#PLN-00${newId}`, estado: 'Activo', observaciones: nuevoPlan.beneficios.split('\n')[0] }]);
      alert("¡Plan creado con éxito!");
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    setPlanes(planes.filter(p => p.id !== planToDelete.id));
    setIsDeleteConfirmOpen(false);
    setPlanToDelete(null);
    alert("Plan eliminado correctamente");
  };

  return (
    <div className="main-content">
      {/* Encabezado con imagen de fondo */}
      <section id="content-header" className="dashboard-header">
        <div className="header-overlay">
          <h1 className="header-title">Gestión de Planes</h1>
          <p className="header-subtitle">Configura los abonos y membresías</p>
        </div>
        <img 
          src="/img/welcome-background.png" 
          alt="Fondo" 
          className="header-bg-img"
        />
      </section>

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
        <div className="cuadricula-planes">
          {planes.map((plan) => (
            <div key={plan.id} className={`tarjeta-plan ${plan.etiqueta === 'Recomendado' ? 'destacado' : ''}`}>
              {plan.etiqueta && <div className="etiqueta-plan">{plan.etiqueta}</div>}
              <h3>{plan.nombre}</h3>
              <p className="precio">${parseInt(plan.precio).toLocaleString('es-AR')} <span>/mes</span></p>
              <ul className="caracteristicas-plan">
                {plan.beneficios.split('\n').map((b, i) => (
                  <li key={i}><Check size={14} color="#40c057" /> {b}</li>
                ))}
              </ul>
              <div className="acciones-plan">
                <button className="btn-icon-edit" onClick={() => openEditModal(plan)}><Pencil size={14} /></button>
                <button className="btn-icon-delete" onClick={() => openDeleteConfirm(plan)}><Trash size={14} /></button>
              </div>
            </div>
          ))}
        </div>
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
        {planes.map((plan) => (
          <tr key={plan.id}>
            <td className="columna-fija"><strong>{plan.nombre}</strong></td>
            <td>{plan.codigo}</td>
            <td>${parseInt(plan.precio).toLocaleString('es-AR')}</td>
            <td>{plan.observaciones}</td>
            <td>
              <span className={`badge ${plan.estado === 'Activo' ? 'badge-success-light' : 'badge-danger-light'}`}>
                {plan.estado}
              </span>
            </td>
            <td>
              <div className="acciones-tabla">
                <button className="btn-icon-edit" title="Editar" onClick={() => openEditModal(plan)}>
                  <Pencil size={14} />
                </button>
                <button className="btn-icon-delete" title="Eliminar" onClick={() => openDeleteConfirm(plan)}>
                  <Trash size={14} />
                </button>
              </div>
            </td>
          </tr>
        ))}
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
                <label htmlFor="frecuencia">Frecuencia</label>
                <select id="frecuencia" value={nuevoPlan.frecuencia} onChange={handleInputChange}>
                  <option value="Mensual">Mensual</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Quincenal">Quincenal</option>
                  <option value="Anual">Anual</option>
                </select>
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
      <Modal 
        isOpen={isDeleteConfirmOpen} 
        onClose={() => setIsDeleteConfirmOpen(false)} 
        title="Confirmar eliminación"
      >
        <div className="confirm-modal-content">
          <AlertTriangle size={48} className="confirm-icon" />
          <p className="confirm-message">
            ¿Estás seguro de que deseas eliminar el plan <strong>{planToDelete?.nombre}</strong>?
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
              Eliminar Plan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GestionPlanes;
