import Modal from './Modal';
import '../styles/CategoryFormModal.css';

const CategoryFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedCategory,
  categoriaState,
  onChange
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={selectedCategory ? 'Editar Categoría' : 'Nueva Categoría'}
    >
      <form onSubmit={onSubmit} className="category-form">
        <div className="category-form-grid">
          <div className="grupo-campo">
            <label htmlFor="nombre">Nombre de la Categoría</label>
            <input 
              type="text" 
              id="nombre" 
              value={categoriaState.nombre} 
              onChange={onChange} 
              placeholder="Ej: Yoga, Musculación, etc." 
              required 
            />
          </div>
          <div className="grupo-campo">
            <label htmlFor="rubro">Rubro / Sector</label>
            <input 
              type="text" 
              id="rubro" 
              value={categoriaState.rubro} 
              onChange={onChange} 
              placeholder="Ej: Fitness, Salud, Bienestar" 
            />
          </div>
          <div className="grupo-campo">
            <label htmlFor="color">Color Identificador</label>
            <div className="color-picker-wrapper">
              <input 
                type="color" 
                id="color" 
                value={categoriaState.color} 
                onChange={onChange} 
              />
              <span>Elige un color para la tarjeta</span>
            </div>
          </div>
        </div>
        <div className="acciones-formulario">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn-primary"
          >
            {selectedCategory ? 'Guardar Cambios' : 'Crear Categoría'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
