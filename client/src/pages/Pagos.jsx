import { useState } from 'react';
import { CirclePlus, Banknote, Landmark, Save, CreditCard, Smartphone, X, Trash, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import '../styles/style.css';
import '../styles/utilidades/configuracion_pagos.css';
import '../styles/utilidades/pagos.css';

const Pagos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const [metodos, setMetodos] = useState([
    { id: 1, nombre: 'Efectivo', tipo: 'Efectivo', valor: -10, detalle: 'Descuento por pago contado', icon: <Banknote size={24} /> },
    { id: 2, nombre: 'Transferencia', tipo: 'Banco', valor: 0, detalle: 'CBU: 00000031000123456789\nAlias: fluxer.gym.ok', icon: <Landmark size={24} /> },
    { id: 3, nombre: 'Mercado Pago', tipo: 'Virtual', valor: 5, detalle: 'CVU: 00000031000123456789\nAlias: fluxer.mp', icon: <Smartphone size={24} /> },
    { id: 4, nombre: 'Tarjeta de Crédito', tipo: 'Tarjeta', valor: 15, detalle: '1 cuota sin interés, resto con recargo', icon: <CreditCard size={24} /> },
  ]);

  const [nuevoMetodo, setNuevoMetodo] = useState({
    nombre: '',
    tipo: 'Efectivo',
    recargo: '0',
    descuento: '0',
    detalle: '',
    observaciones: ''
  });

  const handleInputChange = (id, field, value) => {
    setMetodos(metodos.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleNewMethodChange = (e) => {
    const { id, value } = e.target;
    setNuevoMetodo(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveMethod = (id) => {
    const metodo = metodos.find(m => m.id === id);
    console.log("Guardando método:", metodo);
    alert(`¡Configuración de ${metodo.nombre} guardada! (Simulado)`);
  };

  const handleOpenDeleteConfirm = (metodo) => {
    setSelectedMethod(metodo);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setMetodos(metodos.filter(m => m.id !== selectedMethod.id));
    setIsDeleteConfirmOpen(false);
    setSelectedMethod(null);
    alert("Medio de pago eliminado");
  };

  const handleCreateMethod = (e) => {
    e.preventDefault();
    const valorFinal = parseFloat(nuevoMetodo.recargo) - parseFloat(nuevoMetodo.descuento);
    const newEntry = {
      id: Date.now(),
      nombre: nuevoMetodo.nombre,
      tipo: nuevoMetodo.tipo,
      valor: valorFinal,
      detalle: nuevoMetodo.detalle,
      icon: <CirclePlus size={24} /> // Ícono por defecto para nuevos
    };
    setMetodos([...metodos, newEntry]);
    setIsModalOpen(false);
    setNuevoMetodo({ nombre: '', tipo: 'Efectivo', recargo: '0', descuento: '0', detalle: '', observaciones: '' });
    alert("Nuevo medio de pago creado con éxito");
  };

  return (
    <div className="main-content">
      <PageHeader
        className="pagos-header"
        contentClassName="pagos-header-info"
        titleId="main-title"
        titleClassName=""
        subtitleClassName=""
        title="Medios de Pago"
        subtitle="Configura tus canales de cobro y recargos"
        image="/img/welcome-background.png"
        imageClassName="pagos-header-bg"
      />

      <div className="contenedor-pagos">
        <div style={{ paddingBottom: '20px' }}>
          <button 
            className="btn-nuevo-pago" 
            onClick={() => setIsModalOpen(true)}
          >
            <CirclePlus size={18} /> Nuevo Medio de Pago
          </button>
        </div>

        <div className="cuadricula-pagos">
          {metodos.map(metodo => (
            <article key={metodo.id} className="tarjeta-pago activo">
              <div className="cabecera-tarjeta-pago">
                <div className="info-metodo">
                  <div className="info-metodo-icon">
                    {metodo.icon}
                  </div>
                  <h3>{metodo.nombre}</h3>
                </div>
                <button 
                  className="btn-eliminar-pago"
                  onClick={() => handleOpenDeleteConfirm(metodo)}
                  title="Eliminar Medio"
                >
                  <Trash size={16} />
                </button>
              </div>

              <div className="cuerpo-tarjeta-pago">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <div className={`etiqueta-comision ${metodo.valor >= 0 ? 'comision-positiva' : 'comision-negativa'} etiqueta-comision-personalizada`}>
                        {metodo.valor >= 0 ? `+${metodo.valor}% Recargo` : `${metodo.valor}% Descuento`}
                    </div>
                </div>
                <div className="caja-instrucciones">
                  <label>Valor de Recargo / Descuento (%)</label>
                  <input 
                    type="number" 
                    value={metodo.valor} 
                    onChange={(e) => handleInputChange(metodo.id, 'valor', e.target.value)}
                    placeholder="Ej: -10 o 5"
                  />
                </div>
                <div className="caja-instrucciones">
                  <label>CBU / Alias / Detalles</label>
                  <textarea 
                    value={metodo.detalle} 
                    onChange={(e) => handleInputChange(metodo.id, 'detalle', e.target.value)}
                    rows="3"
                    placeholder="Ingresa los datos para este medio..."
                  ></textarea>
                </div>
              </div>

              <div className="pie-tarjeta-pago">
                <button 
                  className="btn-guardar-cambios" 
                  onClick={() => handleSaveMethod(metodo.id)}
                >
                  <Save size={18} /> Guardar Cambios
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Modal Nuevo Medio de Pago */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nuevo Medio de Pago"
      >
        <form onSubmit={handleCreateMethod} className="form-nuevo-pago">
          <div className="grid-formulario-pagos">
            <div className="grupo-campo grid-full-width">
              <label htmlFor="nombre">Nombre del Medio</label>
              <input 
                type="text" 
                id="nombre" 
                value={nuevoMetodo.nombre} 
                onChange={handleNewMethodChange} 
                placeholder="Ej: PayPal, Cheque, etc." 
                required 
              />
            </div>
            <div className="grupo-campo">
              <label htmlFor="tipo">Tipo de Medio</label>
              <select 
                id="tipo" 
                value={nuevoMetodo.tipo} 
                onChange={handleNewMethodChange}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Banco">Banco / CBU</option>
                <option value="Virtual">Billetera Virtual</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="grupo-campo">
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="recargo">Recargo %</label>
                  <input 
                    type="number" 
                    id="recargo" 
                    value={nuevoMetodo.recargo} 
                    onChange={handleNewMethodChange} 
                    placeholder="0" 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="descuento">Desc. %</label>
                  <input 
                    type="number" 
                    id="descuento" 
                    value={nuevoMetodo.descuento} 
                    onChange={handleNewMethodChange} 
                    placeholder="0" 
                  />
                </div>
              </div>
            </div>
            <div className="grupo-campo grid-full-width">
              <label htmlFor="detalle">CBU / Alias / Instrucciones</label>
              <textarea 
                id="detalle" 
                value={nuevoMetodo.detalle} 
                onChange={handleNewMethodChange} 
                placeholder="CBU: 000... / Alias: mi.gym.mp" 
                rows="2"
              ></textarea>
            </div>
            <div className="grupo-campo grid-full-width">
              <label htmlFor="observaciones">Observaciones</label>
              <textarea 
                id="observaciones" 
                value={nuevoMetodo.observaciones} 
                onChange={handleNewMethodChange} 
                placeholder="Notas internas..." 
                rows="2"
              ></textarea>
            </div>
          </div>
          <div className="acciones-formulario-pagos">
            <button type="button" className="btn-modal-cancelar" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-modal-confirmar">Crear Medio</button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        title="Confirmar eliminación"
        message={<>¿Estás seguro de que quieres eliminar el medio de pago <strong>{selectedMethod?.nombre}</strong>?</>}
        warning="Esta acción no se puede deshacer."
        icon={<AlertCircle size={48} color="#ff6b6b" style={{ marginBottom: '15px', marginLeft: 'auto', marginRight: 'auto' }} />}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        cancelLabel="Cancelar"
        confirmLabel="Eliminar Medio"
        containerClassName=""
        containerStyle={{ padding: '10px', textAlign: 'center' }}
        messageClassName=""
        messageStyle={{ fontSize: '1.1rem', color: '#333', marginBottom: '10px' }}
        warningClassName=""
        warningStyle={{ fontSize: '0.9rem', color: '#666' }}
        actionsClassName="acciones-formulario-pagos"
        actionsStyle={{ justifyContent: 'center' }}
        cancelClassName="btn-modal-cancelar"
        confirmClassName="btn-modal-eliminar"
      />
    </div>
  );
};

export default Pagos;
