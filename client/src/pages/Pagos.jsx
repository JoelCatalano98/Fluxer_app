import { useState } from 'react';
import { CirclePlus, Banknote, Landmark, Save, CreditCard, Smartphone, X, Trash, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import '../styles/style.css';
import '../styles/utilidades/configuracion_pagos.css';

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
          <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Medios de Pago</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Configura tus canales de cobro y recargos</p>
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

      <div className="contenedor-pagos">
        <div style={{ padding: '0 0 20px 0' }}>
          <button 
            className="btn-primary" 
            onClick={() => setIsModalOpen(true)}
            style={{ width: 'auto', height: 'auto', padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#00a8e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            <CirclePlus size={18} /> Nuevo Medio de Pago
          </button>
        </div>

        <div className="cuadricula-pagos">
          {metodos.map(metodo => (
            <article key={metodo.id} className="tarjeta-pago activo">
              <div className="cabecera-tarjeta-pago">
                <div className="info-metodo">
                  <div style={{ background: '#e1f0ff', color: '#00a8e8', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                    {metodo.icon}
                  </div>
                  <h3>{metodo.nombre}</h3>
                </div>
                <button 
                  onClick={() => handleOpenDeleteConfirm(metodo)}
                  style={{ border: 'none', background: '#ffe3e3', color: '#e03131', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Eliminar Medio"
                >
                  <Trash size={16} />
                </button>
              </div>

              <div className="cuerpo-tarjeta-pago">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <div className={`etiqueta-comision ${metodo.valor >= 0 ? 'comision-positiva' : 'comision-negativa'}`} style={{ fontSize: '0.9rem', padding: '5px 15px' }}>
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

              <div className="pie-tarjeta-pago" style={{ gap: '10px' }}>
                <button 
                  className="btn-help" 
                  onClick={() => handleSaveMethod(metodo.id)}
                  style={{ background: '#00a8e8', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '600', width: '100%', justifyContent: 'center' }}
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
        <form onSubmit={handleCreateMethod} style={{ padding: '10px' }}>
          <div className="cuadricula-formulario" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="grupo-campo" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="nombre" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nombre del Medio</label>
              <input 
                type="text" 
                id="nombre" 
                value={nuevoMetodo.nombre} 
                onChange={handleNewMethodChange} 
                placeholder="Ej: PayPal, Cheque, etc." 
                required 
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
              />
            </div>
            <div className="grupo-campo">
              <label htmlFor="tipo" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Tipo de Medio</label>
              <select 
                id="tipo" 
                value={nuevoMetodo.tipo} 
                onChange={handleNewMethodChange}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Banco">Banco / CBU</option>
                <option value="Virtual">Billetera Virtual</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="grupo-campo">
              <label htmlFor="recargo" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Recargo (%)</label>
              <input 
                type="number" 
                id="recargo" 
                value={nuevoMetodo.recargo} 
                onChange={handleNewMethodChange} 
                placeholder="0" 
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
              />
            </div>
            <div className="grupo-campo">
              <label htmlFor="descuento" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Descuento (%)</label>
              <input 
                type="number" 
                id="descuento" 
                value={nuevoMetodo.descuento} 
                onChange={handleNewMethodChange} 
                placeholder="0" 
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
              />
            </div>
            <div className="grupo-campo" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="detalle" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>CBU / Alias / Instrucciones</label>
              <textarea 
                id="detalle" 
                value={nuevoMetodo.detalle} 
                onChange={handleNewMethodChange} 
                placeholder="CBU: 000... / Alias: mi.gym.mp" 
                rows="2"
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
              ></textarea>
            </div>
            <div className="grupo-campo" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="observaciones" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Observaciones</label>
              <textarea 
                id="observaciones" 
                value={nuevoMetodo.observaciones} 
                onChange={handleNewMethodChange} 
                placeholder="Notas internas..." 
                rows="2"
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
              ></textarea>
            </div>
          </div>
          <div className="acciones-formulario" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#00a8e8', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Crear Medio</button>
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
          <AlertCircle size={48} color="#ff6b6b" style={{ marginBottom: '15px' }} />
          <p style={{ fontSize: '1.1rem', color: '#333', marginBottom: '10px' }}>
            ¿Estás seguro de que quieres eliminar el medio de pago <strong>{selectedMethod?.nombre}</strong>?
          </p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>Esta acción no se puede deshacer.</p>
          <div className="acciones-formulario" style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsDeleteConfirmOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>Cancelar</button>
            <button type="button" onClick={handleConfirmDelete} style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#ff6b6b', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Eliminar Medio</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Pagos;
