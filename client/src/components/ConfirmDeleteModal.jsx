import Modal from './Modal';

const ConfirmDeleteModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  icon,
  warning,
  cancelLabel,
  confirmLabel,
  containerClassName = 'confirm-modal-content',
  containerStyle,
  messageClassName = 'confirm-message',
  messageStyle,
  warningClassName = 'confirm-warning',
  warningStyle,
  actionsClassName = 'confirm-actions',
  actionsStyle,
  cancelClassName = 'btn-cancel',
  cancelStyle,
  confirmClassName = 'btn-confirm-delete',
  confirmStyle,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className={containerClassName} style={containerStyle}>
        {icon}
        <p className={messageClassName} style={messageStyle}>{message}</p>
        {warning && <p className={warningClassName} style={warningStyle}>{warning}</p>}
        <div className={actionsClassName} style={actionsStyle}>
          <button
            type="button"
            className={cancelClassName}
            style={cancelStyle}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmClassName}
            style={confirmStyle}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
