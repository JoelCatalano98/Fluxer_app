import { useState } from 'react';
import { CirclePlus, Pencil, Trash, Check, X, Save, List, LayoutGrid } from 'lucide-react';
import Modal from '../components/Modal';
import '../styles/style.css';
import '../styles/Servicios/gestion_planes.css';
import '../styles/clientes/listados_gestion.css';

const GestionPlanes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'list'
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

  const planesMock = [
    { id: '1', codigo: '#PLN-001', nombre: 'Musculación', precio: '$15.000', observaciones: '3 veces por semana', estado: 'Activo' },
    { id: '2', codigo: '#PLN-002', nombre: 'Full Entrenamiento', precio: '$22.000', observaciones: 'Acceso libre total', estado: 'Activo' },
    { id: '3', codigo: '#PLN-003', nombre: 'Pilates Por Clase', precio: '$22.000', observaciones: 'Pago por sesión', estado: 'Activo' },
    { id: '4', codigo: '#PLN-004', nombre: 'Crosfit/Mensual', precio: '$22.000', observaciones: 'Entrenamiento funcional', estado: 'Activo' },
  ];

  return (
    <div className="main-content">
      {/* Encabezado con imagen de fondo (Consistente con Dashboard) */}
      <section id="content-header" className="dashboard-header">
        <div className="header-overlay">
          <h1 className="header-title">Gestión de Planes</h1>
          <p className="header-subtitle">Configura los abonos y membresías</p>
        </div>
        <img 
          src="/img/welcome-background.png" 
          alt="Fondo" 
          className="header-bg-img"
        />
      </section>

      {/* Acciones principales */}
      <div className="planes-actions-bar">
        <button 
          className="btn-create-plan" 
          onClick={() => setIsModalOpen(true)}
        >
          <CirclePlus size={18} /> <span>Crear Nuevo Plan</span>
        </button>
        <button 
          className="btn-toggle-view" 
          onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
        >
          {viewMode === 'cards' ? (
            <><List size={18} /> <span>Ver Lista de Planes</span></>
          ) : (
            <><LayoutGrid size={18} /> <span>Ver Cuadrícula</span></>
          )}
        </button>
      </div>

      {viewMode === 'cards' ? (
        <div className="cuadricula-planes">
          {/* Mockup de planes (podrían ser mapeados de planesMock en el futuro) */}
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
              <button className="btn-icon-edit"><Pencil size={14} /></button>
              <button className="btn-icon-delete"><Trash size={14} /></button>
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
              <button className="btn-icon-edit"><Pencil size={14} /></button>
              <button className="btn-icon-delete"><Trash size={14} /></button>
            </div>
          </div>

          <div className="tarjeta-plan">
            <div className="etiqueta-plan">Especial</div>
            <h3>Pilates Por Clase</h3>
            <p className="precio">$22.000 <span>/mes</span></p>
            <ul className="caracteristicas-plan">
              <li><Check size={14} color="#40c057" /> Sala de pilates</li>
              <li><Check size={14} color="#40c057" /> Equipamiento completo</li>
              <li><Check size={14} color="#40c057" /> Instructor guiado</li>
            </ul>
            <div className="acciones-plan">
              <button className="btn-icon-edit"><Pencil size={14} /></button>
              <button className="btn-icon-delete"><Trash size={14} /></button>
            </div>
          </div>

          <div className="tarjeta-plan">
            <div className="etiqueta-plan">Intenso</div>
            <h3>Crosfit/Mensual</h3>
            <p className="precio">$22.000 <span>/mes</span></p>
            <ul className="caracteristicas-plan">
              <li><Check size={14} color="#40c057" /> Box de Crosfit</li>
              <li><Check size={14} color="#40c057" /> WODs diarios</li>
              <li><Check size={14} color="#40c057" /> Comunidad activa</li>
            </ul>
            <div className="acciones-plan">
              <button className="btn-icon-edit"><Pencil size={14} /></button>
              <button className="btn-icon-delete"><Trash size={14} /></button>
            </div>
          </div>
        </div>
      ) : (
        <div className="listado-planes-container">
  <div className="listado-header">
    <h2 className="listado-title">Abonos y Planes</h2>
    <p className="listado-subtitle">Gestiona las membresías y paquetes de servicios.</p>
  </div>
  
  {/*  El contenedor con scroll envuelve DIRECTAMENTE a la tabla */}
  <div className="contenedor-scroll"> 
    
    <table className="tabla-cronograma"> 
      <thead>
        <tr>
          <th className="columna-fija">Nombre del Plan</th>
          <th>Código</th>
          <th>Precio</th>
          <th>Observaciones</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {planesMock.map((plan) => (
          <tr key={plan.id}>
            <td className="columna-fija"><strong>{plan.nombre}</strong></td>
            <td>{plan.codigo}</td>
            <td>{plan.precio}</td>
            <td>{plan.observaciones}</td>
            <td>
              <span className={`badge ${plan.estado === 'Activo' ? 'badge-success-light' : 'badge-danger-light'}`}>
                {plan.estado}
              </span>
            </td>
            <td>
              <div className="acciones-tabla">
                {/* 3. Cambié los nombres de los botones para que usen las clases que ya programaste en tu CSS */}
                <button className="boton-editar" title="Editar"><Pencil size={14} /></button>
                <button className="boton-eliminar" title="Eliminar"><Trash size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Crear Nuevo Plan de Abono"
      >
        <div id="modalNuevoPlan">
          <form className="plan-form" onSubmit={handleSubmit}>
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
                <textarea id="beneficios" placeholder="Acceso total&#10;Rutina personalizada..." value={nuevoPlan.beneficios} onChange={handleInputChange} rows="3"></textarea>
              </div>
            </div>
            <div className="pie-formulario">
              <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                <X size={18} /> <span>Cancelar</span>
              </button>
              <button type="submit" className="btn-save">
                <Save size={18} /> <span>Guardar Plan</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default GestionPlanes;
