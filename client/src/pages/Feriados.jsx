import { useState } from 'react';
import { Plus, Lock, Trash2, Calendar, AlertTriangle, Save, X } from 'lucide-react'; 
import Modal from '../components/Modal';
import '../styles/style.css';
import '../styles/utilidades/calendario_feriados.css';

const Feriados = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedFeriado, setSelectedFeriado] = useState(null);

  const [feriados, setFeriados] = useState([
    { id: 1, motivo: 'Día del Trabajador', tipo: 'Feriado Nacional', desde: '2026-05-01', hasta: '2026-05-01', bloquear: true, color: 'nacional' },
    { id: 2, motivo: 'Vacaciones de Invierno', tipo: 'Receso Operativo', desde: '2026-07-15', hasta: '2026-07-30', bloquear: true, color: 'vacaciones' },
  ]);

  const [nuevoFeriado, setNuevoFeriado] = useState({
    motivo: '',
    tipo: 'Feriado Nacional',
    desde: new Date().toISOString().split('T')[0],
    hasta: new Date().toISOString().split('T')[0],
    bloquear: true
  });

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setNuevoFeriado(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateFeriado = (e) => {
    e.preventDefault();
    const newEntry = {
      ...nuevoFeriado,
      id: Date.now(),
      color: nuevoFeriado.tipo === 'Feriado Nacional' ? 'nacional' : 'vacaciones'
    };
    setFeriados([...feriados, newEntry]);
    setIsModalOpen(false);
    setNuevoFeriado({
      motivo: '',
      tipo: 'Feriado Nacional',
      desde: new Date().toISOString().split('T')[0],
      hasta: new Date().toISOString().split('T')[0],
      bloquear: true
    });
    alert("Periodo inactivo agregado con éxito");
  };

  const handleOpenDeleteConfirm = (feriado) => {
    setSelectedFeriado(feriado);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setFeriados(feriados.filter(f => f.id !== selectedFeriado.id));
    setIsDeleteConfirmOpen(false);
    setSelectedFeriado(null);
    alert("Periodo eliminado");
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'long' };
    const date = new Date(dateString + 'T00:00:00');
    return {
      dia: date.getDate().toString().padStart(2, '0'),
      mes: date.toLocaleDateString('es-ES', { month: 'long' })
    };
  };

  return (
    <div className="main-content">
      <section id="content-header" style={{ 
          minHeight: '100px', 
          height: '450px', 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'flex-end',
          padding: '0 40px 40px 40px',
          overflow: 'hidden' 
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Calendario Operativo</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Días no laborables y cierres temporales</p>
        </div>
        <img src="/img/welcome-background.png" alt="Fondo" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          zIndex: 1 
        }} />
      </section>

      <div className="contenedor-feriados">
        <div className="acciones-feriados" style={{ marginBottom: '30px' }}>
          <button 
            className="btn-primary" 
            onClick={() => setIsModalOpen(true)}
            style={{ width: 'auto', height: 'auto', padding: '12px 30px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#00a8e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            <Plus size={20} /> Agregar Feriado o Cierre
          </button>
        </div>

        <div className="lista-feriados">
          {feriados.map(feriado => {
            const dateInfo = formatDate(feriado.desde);
            return (
              <article key={feriado.id} className={`item-feriado ${feriado.color}`} style={{ padding: '25px 30px' }}>
                <div className="info-feriado">
                  <div className="caja-fecha-feriado" style={{ minWidth: '90px', padding: '15px' }}>
                    <span className="dia" style={{ fontSize: '1.8rem' }}>{dateInfo.dia}</span>
                    <span className="month">{dateInfo.mes}</span>
                  </div>
                  <div className="detalles-feriado">
                    <h3 style={{ fontSize: '1.3rem' }}>{feriado.motivo}</h3>
                    <p style={{ fontSize: '0.95rem' }}>{feriado.tipo} • {feriado.desde === feriado.hasta ? 'Día Único' : `Desde ${feriado.desde} hasta ${feriado.hasta}`}</p>
                  </div>
                </div>
                <div className="estado-feriado" style={{ gap: '20px' }}>
                  {feriado.bloquear && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4b4b' }}>
                      <Lock size={18} /> <span style={{ fontSize: '0.9rem' }}>BLOQUEADO</span>
                    </div>
                  )}
                  <button 
                    className="btn-remove" 
                    onClick={() => handleOpenDeleteConfirm(feriado)}
                    style={{ border: 'none', background: '#ffe3e3', color: '#ff4b4b', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Modal Nuevo Periodo Inactivo */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nuevo Periodo Inactivo"
      >
        <form onSubmit={handleCreateFeriado} style={{ padding: '10px' }}>
          <div className="cuadricula-formulario" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <div className="grupo-campo">
              <label htmlFor="motivo" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Motivo / Nombre</label>
              <input 
                type="text" 
                id="motivo" 
                value={nuevoFeriado.motivo} 
                onChange={handleInputChange} 
                placeholder="Ej: Navidad, Reformas, etc." 
                required 
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
              />
            </div>
            <div className="grupo-campo">
              <label htmlFor="tipo" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Tipo de Inactividad</label>
              <select 
                id="tipo" 
                value={nuevoFeriado.tipo} 
                onChange={handleInputChange}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }}
              >
                <option value="Feriado Nacional">Feriado Nacional</option>
                <option value="Receso Operativo">Receso Operativo</option>
                <option value="Mantenimiento">Mantenimiento / Reformas</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            <div className="grupo-rango-fechas" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
              <div className="grupo-campo">
                <label htmlFor="desde" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Desde</label>
                <input 
                  type="date" 
                  id="desde" 
                  value={nuevoFeriado.desde} 
                  onChange={handleInputChange} 
                  required 
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
              <div className="grupo-campo">
                <label htmlFor="hasta" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Hasta</label>
                <input 
                  type="date" 
                  id="hasta" 
                  value={nuevoFeriado.hasta} 
                  onChange={handleInputChange} 
                  required 
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div className="grupo-campo" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff5f5', padding: '15px', borderRadius: '8px', border: '1px solid #ffe3e3' }}>
              <input 
                type="checkbox" 
                id="bloquear" 
                checked={nuevoFeriado.bloquear} 
                onChange={handleInputChange}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label htmlFor="bloquear" style={{ fontWeight: '600', color: '#e03131', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={16} /> Bloquear cronograma de turnos
              </label>
            </div>
          </div>

          <div className="acciones-formulario" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 30px', borderRadius: '8px', border: 'none', background: '#00a8e8', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Guardar Periodo
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal 
        isOpen={isDeleteConfirmOpen} 
        onClose={() => setIsDeleteConfirmOpen(false)} 
        title="Confirmar eliminación"
      >
        <div style={{ padding: '10px', textAlign: 'center' }}>
          <AlertTriangle size={50} color="#ff6b6b" style={{ marginBottom: '15px' }} />
          <p style={{ fontSize: '1.2rem', color: '#333', marginBottom: '10px', fontWeight: '600' }}>
            ¿Eliminar "{selectedFeriado?.motivo}"?
          </p>
          <p style={{ fontSize: '0.95rem', color: '#666' }}>Esta acción habilitará nuevamente el cronograma para estas fechas.</p>
          <div className="acciones-formulario" style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsDeleteConfirmOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>Cancelar</button>
            <button type="button" onClick={handleConfirmDelete} style={{ padding: '10px 30px', borderRadius: '8px', border: 'none', background: '#ff6b6b', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Eliminar Definitivamente</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Feriados;
