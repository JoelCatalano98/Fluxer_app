import { Zap, CirclePlus, X, Pencil, Trash } from 'lucide-react';
import '../styles/CategoryCard.css';

const CategoryCard = ({ 
  category, 
  onEdit, 
  onDelete, 
  onOpenAssign, 
  onOpenRemovePlan 
}) => {
  return (
    <div className="tarjeta-categoria-card">
      <div 
        className="cabecera-categoria-card" 
        style={{ borderLeft: `5px solid ${category.color}` }}
      >
        <div className="titulo-categoria">
          <Zap size={20} color={category.color} />
          <h3>{category.nombre}</h3>
        </div>
        <button 
          className="boton-agregar-plan-card" 
          onClick={() => onOpenAssign(category)}
        >
          <CirclePlus size={14} /> Asignar Plan
        </button>
      </div>
      <div className="cuerpo-categoria-card">
        <p className="rubro-texto">Rubro: <strong>{category.rubro || 'General'}</strong></p>
        <div className="planes-asignados-card">
          {category.planes && category.planes.length > 0 ? (
            <ul>
              {category.planes.map((plan, index) => (
                <li key={index}>
                  <span>{plan}</span>
                  <button 
                    onClick={() => onOpenRemovePlan(category, index)}
                    className="boton-quitar-plan"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sin-planes">No hay planes asignados</p>
          )}
        </div>
      </div>
      <div className="acciones-categoria-card">
        <button
          onClick={() => onEdit(category)}
          className="boton-editar-card"
          title="Editar"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onDelete(category)}
          className="boton-eliminar-card"
          title="Eliminar"
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
};

export default CategoryCard;
