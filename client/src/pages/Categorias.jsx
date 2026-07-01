import { useState } from 'react';
import { SquarePlus, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { useConfirmModal } from '../hooks/useConfirmModal';

// Sub-componentes modulares importados
import CategoryCard from '../components/CategoryCard';
import CategoryFormModal from '../components/CategoryFormModal';
import AssignPlanModal from '../components/AssignPlanModal';

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
  const assignPlanModal = useConfirmModal();
  const deletePlanModal = useConfirmModal();
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
    if (selectedCategory) {
      // Edición de categoría existente
      setCategories(prev => prev.map(cat => {
        if (cat.id === selectedCategory.id) {
          return {
            ...cat,
            nombre: nuevaCategoria.nombre,
            color: nuevaCategoria.color,
            rubro: nuevaCategoria.rubro
          };
        }
        return cat;
      }));
      alert("Categoría editada con éxito");
    } else {
      // Creación de nueva categoría
      const newCat = {
        ...nuevaCategoria,
        id: Date.now().toString(),
        planes: []
      };
      setCategories([...categories, newCat]);
      alert("Categoría creada con éxito");
    }
    setIsCategoryModalOpen(false);
    setSelectedCategory(null);
    setNuevaCategoria({ nombre: '', color: '#00a8e8', rubro: '' });
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
    if (category === null || planIndex === null) return;

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
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
              onOpenAssign={handleOpenAssignModal}
              onOpenRemovePlan={handleOpenDeleteConfirm}
            />
          ))}
        </div>
      </div>

      {/* Modal Nueva/Editar Categoría Modular */}
      <CategoryFormModal 
        isOpen={isCategoryModalOpen} 
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategory(null);
        }} 
        onSubmit={handleCreateCategory}
        selectedCategory={selectedCategory}
        categoriaState={nuevaCategoria}
        onChange={handleCategoryInputChange}
      />

      {/* Modal Asignar Plan Modular */}
      <AssignPlanModal 
        isOpen={assignPlanModal.isOpen} 
        onClose={() => assignPlanModal.closeModal()} 
        onSubmit={handleAssignPlan}
        selectedCategoryName={assignPlanModal.selectedItem?.nombre || ''}
        planes={planesMock}
        assignedPlanId={assignment.planId}
        onPlanChange={(val) => setAssignment({ planId: val })}
      />

      {/* Modal Confirmar Eliminación de Plan */}
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

      {/* Modal Confirmar Eliminación de Categoría */}
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