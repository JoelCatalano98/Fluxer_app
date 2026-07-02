import Modal from './Modal';
import '../styles/AssignPlanModal.css';

const AssignPlanModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedCategoryName,
  planes,
  assignedPlanId,
  onPlanChange
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Asignar plan a ${selectedCategoryName}`}
    >
      <form onSubmit={onSubmit} className="assign-plan-form">
        <div className="grupo-campo">
          <label htmlFor="planId">Seleccionar Plan</label>
          <select 
            id="planId" 
            value={assignedPlanId} 
            onChange={(e) => onPlanChange(e.target.value)}
            required
          >
            <option value="">Selecciona un plan...</option>
            {planes.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.nombre}</option>
            ))}
          </select>
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
            Asignar Plan
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignPlanModal;
