import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Pencil, Trash, UserPlus, Save, X, Loader2, AlertTriangle, Check, User } from 'lucide-react';
import Modal from '../components/Modal';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';
import '../styles/clientes/formularios_clientes.css';

const ClientesTotales = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formCliente, setFormCliente] = useState({
    id: null,
    nombre: '',
    apellido: '',
    dni_cuit: '',
    email: '',
    telefono: '',
    es_socio: false,
    codigo_socio: '',
    planId: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    observaciones: '',
    estado_pago: 'ALDIA'
  });

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/clientes');
      if (res.data.success) {
        setClientes(res.data.data.clientes);
      } else {
        throw new Error(res.data.message || 'Error al obtener clientes');
      }
    } catch (err) {
      console.error('Error fetchClientes:', err);
      setError('Error al cargar la lista de clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormCliente(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOpenForm = (cliente = null) => {
    if (cliente) {
      setFormCliente({
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        dni_cuit: cliente.dni_cuit,
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        es_socio: cliente.es_socio || false,
        codigo_socio: cliente.codigo_socio || '',
        planId: cliente.planId || '',
        fecha_inicio: cliente.fecha_inicio ? new Date(cliente.fecha_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        observaciones: cliente.observaciones || '',
        estado_pago: cliente.estado_pago || 'ALDIA'
      });
      setIsEditing(true);
    } else {
      setFormCliente({
        id: null,
        nombre: '',
        apellido: '',
        dni_cuit: '',
        email: '',
        telefono: '',
        es_socio: false,
        codigo_socio: '',
        planId: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        observaciones: '',
        estado_pago: 'ALDIA'
      });
      setIsEditing(false);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos obligatorios
    if (!formCliente.nombre || !formCliente.apellido || !formCliente.dni_cuit) {
      alert("Los campos obligatorios (nombre, apellido, dni_cuit) no pueden estar vacíos");
      return;
    }

    if (formCliente.es_socio && !formCliente.codigo_socio) {
      alert("El campo código de socio es obligatorio si es socio");
      return;
    }

    try {
      // Limpiar datos condicionales si no es socio
      const dataToSave = { ...formCliente };
      if (!dataToSave.es_socio) {
        dataToSave.codigo_socio = null;
        dataToSave.planId = null;
        dataToSave.fecha_inicio = null;
      }

      if (isEditing) {
        const res = await api.put(`/api/clientes/${formCliente.id}`, dataToSave);
        if (res.data.success) {
          setClientes(clientes.map(c => c.id === formCliente.id ? res.data.data : c));
          alert('¡Cliente actualizado con éxito!');
        }
      } else {
        const res = await api.post('/api/clientes', dataToSave);
        if (res.data.success) {
          setClientes([res.data.data, ...clientes]);
          alert('¡Cliente registrado con éxito!');
        }
      }
      setShowForm(false);
    } catch (err) {
      console.error('Error handleSubmit:', err);
      alert('Error al guardar: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas dar de baja a este cliente?')) {
      try {
        const res = await api.delete(`/api/clientes/${id}`);
        if (res.data.success) {
          setClientes(clientes.map(c => c.id === id ? { ...c, estado_cliente: 'INACTIVO' } : c));
          alert('Cliente dado de baja correctamente');
        }
      } catch (err) {
        console.error('Error handleDelete:', err);
        alert('Error al dar de baja');
      }
    }
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
          <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Gestión de Clientes</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Administra la base completa de usuarios</p>
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

      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#333', margin: 0, fontSize: '2rem' }}>Clientes Totales</h1>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}>Listado maestro de clientes registrados.</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => handleOpenForm()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            <UserPlus size={20} /> Nuevo Cliente
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fff1f1', color: '#e03131', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="contenedor-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="columna-fija">Nombre</th>
                <th>Apellido</th>
                <th>DNI / CUIT</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-blue)' }} />
                    <p style={{ marginTop: '10px', color: '#666' }}>Cargando clientes...</p>
                  </td>
                </tr>
              ) : clientes.length > 0 ? (
                clientes.map(cliente => (
                  <tr key={cliente.id}>
                    <td className="columna-fija"><strong>{cliente.nombre}</strong></td>
                    <td>{cliente.apellido}</td>
                    <td>{cliente.dni_cuit}</td>
                    <td>{cliente.email || 'N/A'}</td>
                    <td>{cliente.telefono || 'N/A'}</td>
                    <td>
                      {cliente.es_socio ? (
                        <span className="badge" style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}>SOCIO</span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#eee', color: '#666' }}>CLIENTE</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${cliente.estado_cliente === 'ACTIVO' ? 'badge-success-light' : ''}`} style={cliente.estado_cliente !== 'ACTIVO' ? { backgroundColor: '#eee', color: '#666' } : {}}>
                        {cliente.estado_cliente}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-accion-edit" onClick={() => handleOpenForm(cliente)} title="Editar" style={{ border: 'none', background: '#e1f0ff', color: '#00a8e8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn-accion-delete" onClick={() => handleDelete(cliente.id)} title="Dar de baja" style={{ border: 'none', background: '#fff1f1', color: '#e03131', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No hay clientes registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={isEditing ? "Editar Cliente" : "Nuevo Cliente"}>
          <div className="contenedor-formulario" style={{ padding: '0', boxShadow: 'none' }}>
            <form className="formulario-fluxer" onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '100%', padding: '0', boxShadow: 'none' }}>
              <div className="cuadricula-formulario">
                <div className="grupo-campo">
                  <label htmlFor="nombre">Nombre *</label>
                  <input type="text" id="nombre" value={formCliente.nombre} onChange={handleInputChange} placeholder="Nombre" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="apellido">Apellido *</label>
                  <input type="text" id="apellido" value={formCliente.apellido} onChange={handleInputChange} placeholder="Apellido" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="dni_cuit">DNI / CUIT *</label>
                  <input type="text" id="dni_cuit" value={formCliente.dni_cuit} onChange={handleInputChange} placeholder="DNI sin puntos" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" value={formCliente.email} onChange={handleInputChange} placeholder="ejemplo@correo.com" />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="telefono">Teléfono</label>
                  <input type="tel" id="telefono" value={formCliente.telefono} onChange={handleInputChange} placeholder="+54 9..." />
                </div>
                
                <div className="grupo-campo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '25px' }}>
                  <input 
                    type="checkbox" 
                    id="es_socio" 
                    checked={formCliente.es_socio} 
                    onChange={handleInputChange}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <label htmlFor="es_socio" style={{ cursor: 'pointer', marginBottom: 0 }}>¿Es Socio? (Acceso a Planes)</label>
                </div>

                {isEditing && (
                  <div className="grupo-campo">
                    <label htmlFor="estado_pago">Estado de Pago</label>
                    <select 
                      id="estado_pago" 
                      value={formCliente.estado_pago} 
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      <option value="ALDIA">Al Día</option>
                      <option value="MOROSO">Moroso</option>
                    </select>
                  </div>
                )}

                {formCliente.es_socio && (
                  <>
                    <div className="grupo-campo">
                      <label htmlFor="codigo_socio">Código Socio *</label>
                      <input type="text" id="codigo_socio" value={formCliente.codigo_socio} onChange={handleInputChange} placeholder="Ej: SOC-001" required={formCliente.es_socio} />
                    </div>
                    <div className="grupo-campo">
                      <label htmlFor="planId">ID de Plan</label>
                      <input type="number" id="planId" value={formCliente.planId} onChange={handleInputChange} placeholder="ID del plan" />
                    </div>
                    <div className="grupo-campo">
                      <label htmlFor="fecha_inicio">Fecha Inicio</label>
                      <input type="date" id="fecha_inicio" value={formCliente.fecha_inicio} onChange={handleInputChange} />
                    </div>
                  </>
                )}
              </div>
              
              <div className="grupo-campo ancho-completo">
                <label htmlFor="observaciones">Observaciones</label>
                <textarea id="observaciones" rows="3" value={formCliente.observaciones} onChange={handleInputChange} placeholder="Información adicional..."></textarea>
              </div>

              <div className="acciones-formulario">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  <X size={18} style={{ marginRight: '5px' }} /> Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}>
                  <Save size={18} style={{ marginRight: '5px' }} /> {isEditing ? "Guardar Cambios" : "Guardar Cliente"}
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
