import { useState } from 'react';
import { SquarePlus, Zap, CirclePlus, X, Trash, Pencil, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import '../styles/style.css';
import '../styles/utilidades/categorias_etiquetas.css';

const Categorias = () => {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(null);
  
  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombre: '',
    color: '#00a8e8',
    rubro: ''
  });

  const [assignment, setAssignment] = useState({
    planId: ''
  });

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

const handleDeleteCategory = (categoryId) => {
  if (!categoryId) return;

  const confirmDelete = window.confirm('¿Eliminar esta categoría?');
  if (!confirmDelete) return;

  setCategories(prev => prev.filter(cat => cat.id !== categoryId));
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
    setNuevaCategoria({ nombre: '', color: '#00a8e8', rubro: '' });
    alert("Categoría creada con éxito");
  };

  const handleOpenAssignModal = (category) => {
    setSelectedCategory(category);
    setIsAssignModalOpen(true);
  };

  const handleAssignPlan = (e) => {
    e.preventDefault();
    if (!assignment.planId) return;
    
    const plan = planesMock.find(p => p.id === assignment.planId);
    setCategories(categories.map(cat => {
      if (cat.id === selectedCategory.id) {
        return { ...cat, planes: [...cat.planes, plan.nombre] };
      }
      return cat;
    }));
    
    setIsAssignModalOpen(false);
    setAssignment({ planId: '' });
    alert(`Plan asignado a ${selectedCategory.nombre}`);
  };

  const handleOpenDeleteConfirm = (category, planIndex) => {
    setSelectedCategory(category);
    setSelectedPlanIndex(planIndex);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setCategories(categories.map(cat => {
      if (cat.id === selectedCategory.id) {
        const newPlanes = [...cat.planes];
        newPlanes.splice(selectedPlanIndex, 1);
        return { ...cat, planes: newPlanes };
      }
      return cat;
    }));
    setIsDeleteConfirmOpen(false);
    setSelectedCategory(null);
    setSelectedPlanIndex(null);
  };

  return (
    <div className="main-content">
      <PageHeader
        className=""
        contentClassName=""
        titleId="main-title"
        titleClassName=""
        subtitleClassName=""
        title="Categorías y Etiquetas"
        subtitle="Organiza y clasifica tus servicios y planes"
        image="/img/welcome-background.png"
        style={{ 
          minHeight: '100px', 
          height: '450px', 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'flex-end',
          padding: '0 40px 40px 40px',
          overflow: 'hidden' 
        }}
        contentStyle={{ position: 'relative', zIndex: 2 }}
        titleStyle={{ color: 'white', textAlign: 'left', margin: 0 }}
        subtitleStyle={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}
        imageClassName=""
        imageStyle={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          zIndex: 1 
        }}
      />

      <div style={{ padding: '20px 30px' }}>
        <button 
          className="btn-primary" 
          onClick={() => setIsCategoryModalOpen(true)}
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
                onClick={() => handleDeleteCategory(category.id)}
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
      

      {/* Modal Nueva Categoría */}
      <Modal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
        title="Nueva Categoría"
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
            <button type="submit" className="btn-primary" style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#00a8e8', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Crear Categoría</button>
          </div>
        </form>
      </Modal>
      

      {/* Modal Asignar Plan */}
      <Modal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
        title={`Asignar plan a ${selectedCategory?.nombre}`}
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
            <button type="button" className="btn-secondary" onClick={() => setIsAssignModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#00a8e8', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Asignar Plan</button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación de Plan */}
      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        title="Confirmar eliminación"
        message={<>¿Estás seguro de que quieres eliminar el plan <strong>{selectedCategory?.planes[selectedPlanIndex]}</strong> de la categoría <strong>{selectedCategory?.nombre}</strong>?</>}
        warning="Esta acción no se puede deshacer."
        icon={<AlertCircle size={48} color="#ff6b6b" style={{ marginBottom: '15px' }} />}
        onCancel={() => setIsDeleteConfirmOpen(false)}
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
    </div>
  );
};

export default Categorias;
