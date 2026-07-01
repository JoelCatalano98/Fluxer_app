import { useState } from 'react';
import { SquarePlus, Zap, CirclePlus, X, Trash, Pencil, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
import '../styles/style.css';
import '../styles/utilidades/categorias_etiquetas.css';

const Categorias = () => {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // selectedCategory se usa solo para el modal de crear/editar (form)
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombre: '',
    color: '#00a8e8',
    rubro: ''
  });

  const [assignment, setAssignment] = useState({
    planId: ''
  });

  // --- Hooks de modales de confirmación / selección ---
  // Asignar plan: item = categoría seleccionada
  const assignPlanModal = useConfirmModal();
  // Eliminar plan de una categoría: item = categoría, extra = índice del plan
  const deletePlanModal = useConfirmModal();
  // Eliminar categoría completa: item = categoría
  const deleteCategoryModal = useConfirmModal();

  // Mock de planes
  const planesMock = [
    { id: '1', nombre: 'Musculación' },
    { id: '2', nombre: 'Full Entrenamiento' },
    { id: '3', nombre: 'Pilates Por Clase' },
    { id: '4', nombre: 'Crosfit/Mensual' },
  ];

  // Mock de categorías
  const [categories, setCategories] = useState([
    { id: '1', nombre: 'CrossFit', color: '#00a8e8', rubro: 'Fitness', planes: ['Full Entrenamiento', 'Crosfit/Mensual'] },
    { id: '2', nombre: 'Psicología', color: '#40c057', rubro: 'Salud', planes: [] },
  ]);

  const handleEditCategory = (category) => {
    if (!category) return;

    setSelectedCategory(category);
    setNuevaCategoria({
      nombre: category.nombre,
      color: category.color,
      rubro: category.rubro || ''
    });

    setIsCategoryModalOpen(true);
  };

  // Ahora abre el modal de confirmación en vez de window.confirm
  const handleDeleteCategory = (category) => {
    if (!category) return;
    deleteCategoryModal.openModal(category);
  };

  const handleConfirmDeleteCategory = () => {
    const category = deleteCategoryModal.selectedItem;
    if (!category) return;

    setCategories(prev => prev.filter(cat => cat.id !== category.id));
    deleteCategoryModal.closeModal();
  };

  const handleCategoryInputChange = (e) => {
    const { id, value } = e.target;
    setNuevaCategoria(prev => ({ ...prev, [id]: value }));
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    const newCat = {
      ...nuevaCategoria,
      id: Date.now().toString(),
      planes: []
    };
    setCategories([...categories, newCat]);
    setIsCategoryModalOpen(false);
    setSelectedCategory(null);
    setNuevaCategoria({ nombre: '', color: '#00a8e8', rubro: '' });
    alert("Categoría creada con éxito");
  };

  const handleOpenAssignModal = (category) => {
    assignPlanModal.openModal(category);
  };

  const handleAssignPlan = (e) => {
    e.preventDefault();
    if (!assignment.planId) return;

    const category = assignPlanModal.selectedItem;
    if (!category) return;

    const plan = planesMock.find(p => p.id === assignment.planId);
    setCategories(categories.map(cat => {
      if (cat.id === category.id) {
        return { ...cat, planes: [...cat.planes, plan.nombre] };
      }
      return cat;
    }));

    assignPlanModal.closeModal();
    setAssignment({ planId: '' });
    alert(`Plan asignado a ${category.nombre}`);
  };

  const handleOpenDeleteConfirm = (category, planIndex) => {
    deletePlanModal.openModal(category, planIndex);
  };

  const handleConfirmDelete = () => {
    const category = deletePlanModal.selectedItem;
    const planIndex = deletePlanModal.extraData;
    if (!category || planIndex === null) return;

    setCategories(categories.map(cat => {
      if (cat.id === category.id) {
        const newPlanes = [...cat.planes];
        newPlanes.splice(planIndex, 1);
        return { ...cat, planes: newPlanes };
      }
      return cat;
    }));
    deletePlanModal.closeModal();
  };

  return (
    <div className="main-content">
      <PageHeader
        title="Categorías y Etiquetas"
        subtitle="Organiza y clasifica tus servicios y planes"
        image="/img/welcome-background.png"
      />

      <div style={{ padding: '20px 30px' }}>
        <button 
          className="btn-primary" 
          onClick={() => {
            setSelectedCategory(null);
            setNuevaCategoria({ nombre: '', color: '#00a8e8', rubro: '' });
            setIsCategoryModalOpen(true);
          }}
          style={{ width: 'auto', height: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#00a8e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          <SquarePlus size={20} /> Nueva Categoría
        </button>
      </div>

      <div style={{ padding: '0 30px 40px 30px' }}>
        <div className="grid-categorias" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {categories.map(category => (
            <div key={category.id} className="tarjeta-categoria" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #eee' }}>
              <div className="cabecera-categoria" style={{ borderLeft: `5px solid ${category.color}`, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap size={20} color={category.color} />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>{category.nombre}</h3>
                </div>
                <button 
                  className="boton-agregar-plan" 
                  onClick={() => handleOpenAssignModal(category)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#e1f0ff', color: '#00a8e8', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  <CirclePlus size={14} /> Asignar Plan
                </button>
              </div>
              <div className="cuerpo-categoria" style={{ padding: '15px 20px' }}>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '10px' }}>Rubro: <strong>{category.rubro || 'General'}</strong></p>
                <div className="planes-asignados">
                  {category.planes.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {category.planes.map((plan, index) => (
                        <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: index === category.planes.length - 1 ? 'none' : '1px solid #f5f5f5' }}>
                          <span style={{ fontSize: '0.95rem', color: '#444' }}>{plan}</span>
                          <button 
                            onClick={() => handleOpenDeleteConfirm(category, index)}
                            style={{ border: 'none', background: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '4px' }}
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: '#aaa', fontStyle: 'italic', textAlign: 'center', margin: '10px 0' }}>No hay planes asignados</p>
                  )}
                </div>
              </div>
              <div
                style={{
                  padding: '10px 20px',
                  background: '#f9f9f9',
                  borderTop: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}
              >
              <button
                onClick={() => handleEditCategory(category)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title="Editar"
              >
                <Pencil size={16} />
              </button>

              <button
                onClick={() => handleDeleteCategory(category)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title="Eliminar"
              >
                <Trash size={16} />
              </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      

      {/* Modal Nueva/Editar Categoría */}
      <Modal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
        title={selectedCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <form onSubmit={handleCreateCategory} style={{ padding: '10px' }}>
          <div className="cuadricula-formulario" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            <div className="grupo-campo">
              <label htmlFor="nombre" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nombre de la Categoría</label>
              <input 
                type="text" 
                id="nombre" 
                value={nuevaCategoria.nombre} 
                onChange={handleCategoryInputChange} 
                placeholder="Ej: Yoga, Musculación, etc." 
                required 
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
              />
            </div>
            <div className="grupo-campo">
              <label htmlFor="rubro" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Rubro / Sector</label>
              <input 
                type="text" 
                id="rubro" 
                value={nuevaCategoria.rubro} 
                onChange={handleCategoryInputChange} 
                placeholder="Ej: Fitness, Salud, Bienestar" 
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
              />
            </div>
            <div className="grupo-campo">
              <label htmlFor="color" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Color Identificador</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="color" 
                  id="color" 
                  value={nuevaCategoria.color} 
                  onChange={handleCategoryInputChange} 
                  style={{ width: '50px', height: '40px', padding: '2px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem', color: '#666' }}>Elige un color para la tarjeta</span>
              </div>
            </div>
          </div>
          <div className="acciones-formulario" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsCategoryModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#00a8e8', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
              {selectedCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </Modal>
      

      {/* Modal Asignar Plan (conectado a assignPlanModal) */}
      <Modal 
        isOpen={assignPlanModal.isOpen} 
        onClose={() => assignPlanModal.closeModal()} 
        title={`Asignar plan a ${assignPlanModal.selectedItem?.nombre}`}
      >
        <form onSubmit={handleAssignPlan} style={{ padding: '10px' }}>
          <div className="grupo-campo">
            <label htmlFor="planId" style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>Seleccionar Plan</label>
            <select 
              id="planId" 
              value={assignment.planId} 
              onChange={(e) => setAssignment({ planId: e.target.value })}
              required
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }}
            >
              <option value="">Selecciona un plan...</option>
              {planesMock.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.nombre}</option>
              ))}
            </select>
          </div>
          <div className="acciones-formulario" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={() => assignPlanModal.closeModal()} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#00a8e8', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Asignar Plan</button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación de Plan (conectado a deletePlanModal) */}
      <ConfirmDeleteModal
        isOpen={deletePlanModal.isOpen}
        title="Confirmar eliminación"
        message={<>¿Estás seguro de que quieres eliminar el plan <strong>{deletePlanModal.selectedItem?.planes[deletePlanModal.extraData]}</strong> de la categoría <strong>{deletePlanModal.selectedItem?.nombre}</strong>?</>}
        warning="Esta acción no se puede deshacer."
        icon={<AlertCircle size={48} color="#ff6b6b" style={{ marginBottom: '15px' }} />}
        onCancel={() => deletePlanModal.closeModal()}
        onConfirm={handleConfirmDelete}
        cancelLabel="Cancelar"
        confirmLabel="Eliminar Plan"
        containerClassName=""
        containerStyle={{ padding: '10px', textAlign: 'center' }}
        messageClassName=""
        messageStyle={{ fontSize: '1.1rem', color: '#333', marginBottom: '10px' }}
        warningClassName=""
        warningStyle={{ fontSize: '0.9rem', color: '#666' }}
        actionsClassName="acciones-formulario"
        actionsStyle={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px' }}
        cancelClassName="btn-secondary"
        cancelStyle={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}
        confirmClassName=""
        confirmStyle={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#ff6b6b', color: 'white', fontWeight: '600', cursor: 'pointer' }}
      />

      {/* Modal Confirmar Eliminación de Categoría (conectado a deleteCategoryModal) */}
      <ConfirmDeleteModal
        isOpen={deleteCategoryModal.isOpen}
        title="Confirmar eliminación"
        message={<>¿Estás seguro de que quieres eliminar la categoría <strong>{deleteCategoryModal.selectedItem?.nombre}</strong>?</>}
        warning="Esta acción no se puede deshacer y quitará todos los planes asignados a esta categoría."
        icon={<AlertCircle size={48} color="#ff6b6b" style={{ marginBottom: '15px' }} />}
        onCancel={() => deleteCategoryModal.closeModal()}
        onConfirm={handleConfirmDeleteCategory}
        cancelLabel="Cancelar"
        confirmLabel="Eliminar Categoría"
        containerClassName=""
        containerStyle={{ padding: '10px', textAlign: 'center' }}
        messageClassName=""
        messageStyle={{ fontSize: '1.1rem', color: '#333', marginBottom: '10px' }}
        warningClassName=""
        warningStyle={{ fontSize: '0.9rem', color: '#666' }}
        actionsClassName="acciones-formulario"
        actionsStyle={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px' }}
        cancelClassName="btn-secondary"
        cancelStyle={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}
        confirmClassName=""
        confirmStyle={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#ff6b6b', color: 'white', fontWeight: '600', cursor: 'pointer' }}
      />
    </div>
  );
};

export default Categorias;