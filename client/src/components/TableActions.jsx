import { Pencil, Trash } from 'lucide-react';

const TableActions = ({
  onEdit,
  onDelete,
  disabled = false,
  containerClassName = 'acciones-tabla',
  containerStyle,
  editClassName,
  editStyle,
  deleteClassName,
  deleteStyle,
  editTitle,
  deleteTitle,
  editIcon = <Pencil size={14} />,
  deleteIcon = <Trash size={14} />,
}) => {
  return (
    <div className={containerClassName} style={containerStyle}>
      {onEdit && (
        <button
          type="button"
          className={editClassName}
          style={editStyle}
          title={editTitle}
          onClick={onEdit}
          disabled={disabled}
        >
          {editIcon}
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className={deleteClassName}
          style={deleteStyle}
          title={deleteTitle}
          onClick={onDelete}
          disabled={disabled}
        >
          {deleteIcon}
        </button>
      )}
    </div>
  );
};

export default TableActions;
