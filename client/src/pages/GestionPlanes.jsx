import { CirclePlus, Pencil, Trash, Check, X } from 'lucide-react';
import '../styles/style.css';
import '../styles/Servicios/gestion_planes.css';

const GestionPlanes = () => {
  return (
    <div className="main-content">
      <section id="content-header" style={{ minHeight: '100px', height: '150px', justifyContent: 'center' }}>
        <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Gestión de Planes</h1>
        <p style={{ color: 'white', margin: '5px 0 0 0' }}>Configura los abonos y membresías</p>
        <img src="/img/welcome-background.png" alt="Fondo" style={{ height: '100%' }} />
      </section>

      <div style={{ padding: '20px 30px' }}>
        <button className="btn-primary" style={{ width: 'auto', height: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CirclePlus size={18} /> Crear Nuevo Plan
        </button>
      </div>

      <div className="cuadricula-planes">
        <div className="tarjeta-plan">
          <div className="etiqueta-plan">Básico</div>
          <h3>Musculación</h3>
          <p className="precio">$15.000 <span>/mes</span></p>
          <ul className="caracteristicas-plan">
            <li><Check size={14} color="#40c057" /> Acceso a sala de pesas</li>
            <li><Check size={14} color="#40c057" /> 3 veces por semana</li>
            <li className="deshabilitado"><X size={14} color="#e03131" /> Rutinas personalizadas</li>
          </ul>
          <div className="acciones-plan">
            <button className="btn-edit"><Pencil size={14} /></button>
            <button className="btn-delete"><Trash size={14} /></button>
          </div>
        </div>

        <div className="tarjeta-plan destacado">
          <div className="etiqueta-plan">Recomendado</div>
          <h3>Full Entrenamiento</h3>
          <p className="precio">$22.000 <span>/mes</span></p>
          <ul className="caracteristicas-plan">
            <li><Check size={14} color="#40c057" /> Sala de pesas libre</li>
            <li><Check size={14} color="#40c057" /> Rutinas específicas</li>
            <li><Check size={14} color="#40c057" /> Seguimiento mensual</li>
          </ul>
          <div className="acciones-plan">
            <button className="btn-edit"><Pencil size={14} /></button>
            <button className="btn-delete"><Trash size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionPlanes;
