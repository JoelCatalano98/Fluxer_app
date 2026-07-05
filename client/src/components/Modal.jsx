import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, contentClassName = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className={`modal-content ${contentClassName}`} style={{ margin: 'auto' }}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-modal" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
