import { useState } from 'react';
import { Pencil, Trash, UserPlus, Save, X } from 'lucide-react';
import Modal from '../components/Modal';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';
import '../styles/clientes/formularios_clientes.css';

const ClientesTotales = () => {
  const [showForm, setShowForm] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    codigo: '',
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    plan: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNuevoCliente(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Cliente guardado:", nuevoCliente);
    alert("¡Cliente guardado con éxito! (Simulado)");
    setShowForm(false);
    // Reiniciar formulario
    setNuevoCliente({
      codigo: '',
      nombre: '',
      dni: '',
      email: '',
      telefono: '',
      plan: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      observaciones: ''
    });
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
  <div style={{ position: 'relative', zIndex: 2 }}>
        <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Gestión de Clientes</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Verifica el total de tus Clientes</p>
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

      <div style={{ padding: '5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#333', margin: 0, fontSize: '2rem' }}>Clientes Totales</h1>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}>Listado completo de socios activos en el sistema.</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#00a8e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            <UserPlus size={20} /> Nuevo Cliente
          </button>
        </div>

        <div className="contenedor-scroll">
          <table className="tabla-cronograma">
            <thead>
              <tr>
                <th className="columna-fija">Cod. Cliente</th>
                <th>Nombre Cliente</th>
                <th>DNI</th>
                <th>Teléfono</th>
                <th>Plan / Abono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="columna-fija">#001</td>
                <td><strong>Joel Silva</strong></td>
                <td>12.345.678</td>
                <td>341-555-0123</td>
                <td><span className="etiqueta-plan" style={{ background: '#e1f0ff', color: '#00a8e8', padding: '4px 8px', borderRadius: '4px' }}>Premium</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-help" title="Editar" style={{ border: 'none', background: '#e1f0ff', color: '#00a8e8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Pencil size={14} /></button>
                    <button className="btn-help" title="Eliminar" style={{ border: 'none', background: '#fff1f1', color: '#e03131', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Trash size={14} /></button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="columna-fija">#002</td>
                <td><strong>juan perez</strong></td>
                <td>12.345.678</td>
                <td>341-555-0123</td>
                <td><span className="etiqueta-plan" style={{ background: '#e1f0ff', color: '#00a8e8', padding: '4px 8px', borderRadius: '4px' }}>Premium</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-help" title="Editar" style={{ border: 'none', background: '#e1f0ff', color: '#00a8e8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Pencil size={14} /></button>
                    <button className="btn-help" title="Eliminar" style={{ border: 'none', background: '#fff1f1', color: '#e03131', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Trash size={14} /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo Cliente">
          <div className="contenedor-formulario" style={{ padding: '0', boxShadow: 'none' }}>
            <form className="formulario-fluxer" onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '100%', padding: '0', boxShadow: 'none' }}>
              <div className="cuadricula-formulario">
                <div className="grupo-campo">
                  <label htmlFor="codigo">Cod. Cliente</label>
                  <input type="text" id="codigo" value={nuevoCliente.codigo} onChange={handleInputChange} placeholder="Ej: #002" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="nombre">Nombre Completo</label>
                  <input type="text" id="nombre" value={nuevoCliente.nombre} onChange={handleInputChange} placeholder="Ej: Juan Pérez" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="dni">DNI / CUIT</label>
                  <input type="text" id="dni" value={nuevoCliente.dni} onChange={handleInputChange} placeholder="Sin puntos ni guiones" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="email">Correo Electrónico</label>
                  <input type="email" id="email" value={nuevoCliente.email} onChange={handleInputChange} placeholder="usuario@email.com" />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="telefono">Teléfono / WhatsApp</label>
                  <input type="tel" id="telefono" value={nuevoCliente.telefono} onChange={handleInputChange} placeholder="+54 9 ..." />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="plan">Plan / Abono</label>
                  <select id="plan" value={nuevoCliente.plan} onChange={handleInputChange}>
                    <option value="">Seleccionar plan...</option>
                    <option value="basic">Básico</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className="grupo-campo">
                  <label htmlFor="fecha_inicio">Fecha de Inicio</label>
                  <input type="date" id="fecha_inicio" value={nuevoCliente.fecha_inicio} onChange={handleInputChange} />
                </div>
              </div>
              
              <div className="grupo-campo ancho-completo">
                <label htmlFor="observaciones">Observaciones</label>
                <textarea id="observaciones" rows="3" value={nuevoCliente.observaciones} onChange={handleInputChange} placeholder="Información adicional relevante..."></textarea>
              </div>

              <div className="acciones-formulario">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  <X size={18} style={{ marginRight: '5px' }} /> Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={18} style={{ marginRight: '5px' }} /> Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ClientesTotales;
