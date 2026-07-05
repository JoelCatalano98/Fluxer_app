import { useState, useEffect } from 'react';
import { Plus, Lock, Trash2, AlertTriangle, Save } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import api from '../services/api';
import '../styles/style.css';
import '../styles/utilidades/calendario_feriados.css';

const Feriados = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedFeriado, setSelectedFeriado] = useState(null);

  const [feriados, setFeriados] = useState([]);

  const [nuevoFeriado, setNuevoFeriado] = useState({
    motivo: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchFeriados();
  }, []);

  const fetchFeriados = async () => {
    try {
      const res = await api.get('/api/feriados');
      setFeriados(res.data);
    } catch (error) {
      console.error('Error fetching feriados:', error);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNuevoFeriado(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleCreateFeriado = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/feriados', nuevoFeriado);
      setIsModalOpen(false);
      setNuevoFeriado({
        motivo: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: new Date().toISOString().split('T')[0]
      });
      alert("Feriado registrado con éxito");
      fetchFeriados();
    } catch (error) {
      console.error('Error creating feriado:', error);
      alert("Error al registrar el feriado");
    }
  };

  const handleOpenDeleteConfirm = (feriado) => {
    setSelectedFeriado(feriado);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/api/feriados/${selectedFeriado.id}`);
      setIsDeleteConfirmOpen(false);
      setSelectedFeriado(null);
      alert("Feriado eliminado");
      fetchFeriados();
    } catch (error) {
      console.error('Error deleting feriado:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return {
      dia: date.getDate().toString().padStart(2, '0'),
      mes: date.toLocaleDateString('es-ES', { month: 'long' })
    };
  };

  return (
    <div className="main-content">
      <PageHeader
        title="Calendario Operativo"
        subtitle="Días no laborables y cierres temporales"
        image="/img/welcome-background.png"
      />

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
            const dateInfo = formatDate(feriado.fechaInicio);
            const esRango = feriado.fechaInicio !== feriado.fechaFin;
            return (
              <article key={feriado.id} className="item-feriado nacional" style={{ padding: '25px 30px' }}>
                <div className="info-feriado">
                  <div className="caja-fecha-feriado" style={{ minWidth: '90px', padding: '15px' }}>
                    <span className="dia" style={{ fontSize: '1.8rem' }}>{dateInfo.dia}</span>
                    <span className="month">{dateInfo.mes}</span>
                  </div>
                  <div className="detalles-feriado">
                    <h3 style={{ fontSize: '1.3rem' }}>{feriado.motivo}</h3>
                    <p style={{ fontSize: '0.95rem' }}>
                      {esRango 
                        ? `Desde ${feriado.fechaInicio} hasta ${feriado.fechaFin}` 
                        : `Día Único • ${feriado.fechaInicio}`}
                    </p>
                  </div>
                </div>
                <div className="estado-feriado" style={{ gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4b4b' }}>
                    <Lock size={18} /> <span style={{ fontSize: '0.9rem' }}>BLOQUEADO</span>
                  </div>
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
            <div className="grupo-rango-fechas" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
              <div className="grupo-campo">
                <label htmlFor="fechaInicio" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Fecha Inicio</label>
                <input 
                  type="date" 
                  id="fechaInicio" 
                  value={nuevoFeriado.fechaInicio} 
                  onChange={handleInputChange} 
                  required 
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
              <div className="grupo-campo" style={{ marginTop: '12px' }}>
                <label htmlFor="fechaFin" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Fecha Fin</label>
                <input 
                  type="date" 
                  id="fechaFin" 
                  value={nuevoFeriado.fechaFin} 
                  onChange={handleInputChange} 
                  required 
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
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
      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        title="Confirmar eliminación"
        message={<>¿Eliminar "{selectedFeriado?.motivo}"?</>}
        warning="Esta acción habilitará nuevamente el cronograma para estas fechas."
        icon={<AlertTriangle size={50} color="#ff6b6b" style={{ marginBottom: '15px' }} />}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        cancelLabel="Cancelar"
        confirmLabel="Eliminar Definitivamente"
        containerClassName=""
        containerStyle={{ padding: '10px', textAlign: 'center' }}
        messageClassName=""
        messageStyle={{ fontSize: '1.2rem', color: '#333', marginBottom: '10px', fontWeight: '600' }}
        warningClassName=""
        warningStyle={{ fontSize: '0.95rem', color: '#666' }}
        actionsClassName="acciones-formulario"
        actionsStyle={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px' }}
        cancelClassName="btn-secondary"
        cancelStyle={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}
        confirmClassName=""
        confirmStyle={{ padding: '10px 30px', borderRadius: '8px', border: 'none', background: '#ff6b6b', color: 'white', fontWeight: '600', cursor: 'pointer' }}
      />
    </div>
  );
};

export default Feriados;
