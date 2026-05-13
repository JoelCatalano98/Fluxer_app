import { useState } from 'react';
import { CirclePlus, Pencil, Trash, Check, X, Save } from 'lucide-react';
import Modal from '../components/Modal';
import '../styles/style.css';
import '../styles/Servicios/gestion_planes.css';

const GestionPlanes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoPlan, setNuevoPlan] = useState({
    nombre: '',
    etiqueta: '',
    precio: '',
    frecuencia: 'Mensual',
    beneficios: ''
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNuevoPlan(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Nuevo plan:", nuevoPlan);
    alert("¡Plan creado con éxito! (Simulado)");
    setIsModalOpen(false);
  };

  return (
    <div className="main-content">
      <section id="content-header" style={{ 
          minHeight: '100px', 
          height: '450px', 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'flex-end', // Empuja el contenido hacia abajo
          padding: '0 40px 40px 40px', // Agregamos 40px al final para que no toque el borde
          overflow: 'hidden' 
}}>
        <div style={{ position: 'relative', zIndex: 2, padding: '40px' }}>
        <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Gestión de Planes</h1>
        <p style={{ color: 'white', margin: '5px 0 0 0' }}>Configura los abonos y membresías</p>
        </div>
        <img 
          src="/img/welcome-background.png" 
          alt="Fondo" 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            zIndex: 1 
          }} 
        />
      </section>

      <div style={{ padding: '20px 30px' }}>
        <button 
          className="btn-primary" 
          onClick={() => setIsModalOpen(true)}
          style={{ width: 'auto', height: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#00a8e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
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
            <button className="btn-edit" style={{ border: 'none', background: '#e1f0ff', color: '#00a8e8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Pencil size={14} /></button>
            <button className="btn-delete" style={{ border: 'none', background: '#fff1f1', color: '#e03131', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Trash size={14} /></button>
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
            <button className="btn-edit" style={{ border: 'none', background: '#e1f0ff', color: '#00a8e8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Pencil size={14} /></button>
            <button className="btn-delete" style={{ border: 'none', background: '#fff1f1', color: '#e03131', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Trash size={14} /></button>
          </div>
        </div>
        <div className="tarjeta-plan destacado">
          <div className="etiqueta-plan">Recomendado</div>
          <h3>Pilates Por Clase</h3>
          <p className="precio">$22.000 <span>/mes</span></p>
          <ul className="caracteristicas-plan">
            <li><Check size={14} color="#40c057" /> Sala de pesas libre</li>
            <li><Check size={14} color="#40c057" /> Rutinas específicas</li>
            <li><Check size={14} color="#40c057" /> Seguimiento mensual</li>
          </ul>
          <div className="acciones-plan">
            <button className="btn-edit" style={{ border: 'none', background: '#e1f0ff', color: '#00a8e8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Pencil size={14} /></button>
            <button className="btn-delete" style={{ border: 'none', background: '#fff1f1', color: '#e03131', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Trash size={14} /></button>
          </div>
        </div>
        <div className="tarjeta-plan destacado">
          <div className="etiqueta-plan">Recomendado</div>
          <h3>Crosfit/Mensual</h3>
          <p className="precio">$22.000 <span>/mes</span></p>
          <ul className="caracteristicas-plan">
            <li><Check size={14} color="#40c057" /> Sala de pesas libre</li>
            <li><Check size={14} color="#40c057" /> Rutinas específicas</li>
            <li><Check size={14} color="#40c057" /> Seguimiento mensual</li>
          </ul>
          <div className="acciones-plan">
            <button className="btn-edit" style={{ border: 'none', background: '#e1f0ff', color: '#00a8e8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Pencil size={14} /></button>
            <button className="btn-delete" style={{ border: 'none', background: '#fff1f1', color: '#e03131', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Trash size={14} /></button>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Crear Nuevo Plan de Abono"
      >
        <div id="modalNuevoPlan">
          <form className="modal-body" onSubmit={handleSubmit}>
            <div className="cuadricula-form">
              <div className="grupo-entrada">
                <label htmlFor="nombre">Nombre del Plan</label>
                <input type="text" id="nombre" placeholder="Ej: Musculación Pase Libre" value={nuevoPlan.nombre} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="etiqueta">Etiqueta</label>
                <input type="text" id="etiqueta" placeholder="Ej: Recomendado, Básico" value={nuevoPlan.etiqueta} onChange={handleInputChange} />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="precio">Precio Mensual ($)</label>
                <input type="number" id="precio" placeholder="0.00" value={nuevoPlan.precio} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="frecuencia">Frecuencia</label>
                <select id="frecuencia" value={nuevoPlan.frecuencia} onChange={handleInputChange}>
                  <option value="Mensual">Mensual</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Quincenal">Quincenal</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>
              <div className="grupo-entrada full-width">
                <label htmlFor="beneficios">Características / Beneficios (uno por línea)</label>
                <textarea id="beneficios" placeholder="Acceso total&#10;Rutina personalizada..." value={nuevoPlan.beneficios} onChange={handleInputChange} rows="4"></textarea>
              </div>
            </div>
            <div className="pie-formulario">
              <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
                <X size={18} /> Cancelar
              </button>
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#40c057', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                <Save size={18} /> Guardar Plan
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default GestionPlanes;
