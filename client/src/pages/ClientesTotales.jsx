import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Pencil, Trash, UserPlus, Save, X, Loader2, AlertTriangle, Check, User, RefreshCw, MessageCircle, Dumbbell, Search } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import TableActions from '../components/TableActions';
import ModalRutinas from '../components/ModalRutinas';
import { useForm } from '../hooks/useForm';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';
import '../styles/clientes/formularios_clientes.css';

const ClientesTotales = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [clienteRutinaSeleccionado, setClienteRutinaSeleccionado] = useState(null);
  const [categoriasList, setCategoriasList] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Cargar categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await api.get('/api/categorias');
        if (res.data.success) {
          setCategoriasList(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching categorias:', err);
      }
    };
    fetchCategorias();
  }, []);

  // Hook useForm para controlar el formulario de Clientes
  const [formValues, handleInputChange, resetForm, setFormValues] = useForm({
    id: null,
    nombre: '',
    apellido: '',
    dni_cuit: '',
    email: '',
    telefono: '',
    es_socio: false,
    codigo_socio: '',
    categoriaId: '',
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

  const handleNewCliente = () => {
    setIsEditing(false);
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (cliente) => {
    setIsEditing(true);
    setFormValues({
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      dni_cuit: cliente.dni_cuit,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      es_socio: cliente.es_socio || false,
      codigo_socio: cliente.codigo_socio || '',
      categoriaId: cliente.categoriaId || '',
      fecha_inicio: cliente.fecha_inicio ? new Date(cliente.fecha_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      observaciones: cliente.observaciones || '',
      estado_pago: cliente.estado_pago || 'ALDIA'
    });
    setShowForm(true);
  };

  const openDeleteConfirm = (cliente) => {
    setClienteToDelete(cliente);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await api.delete(`/api/clientes/${clienteToDelete.id}`);
      if (res.data.success) {
        setClientes(clientes.map(c => c.id === clienteToDelete.id ? { ...c, estado_cliente: 'INACTIVO' } : c));
        alert('Cliente dado de baja correctamente');
      }
    } catch (err) {
      console.error('Error handleDelete:', err);
      alert('Error al dar de baja');
    } finally {
      setIsDeleteConfirmOpen(false);
      setClienteToDelete(null);
    }
  };

  const handleReactivar = async (cliente) => {
    if (!window.confirm(`¿Reactivar al cliente ${cliente.nombre} ${cliente.apellido}?`)) return;
    try {
      const res = await api.put(`/api/clientes/${cliente.id}`, { estado_cliente: 'ACTIVO' });
      if (res.data.success) {
        setClientes(clientes.map(c => c.id === cliente.id ? { ...c, estado_cliente: 'ACTIVO' } : c));
        alert('Cliente reactivado con éxito');
      }
    } catch (err) {
      console.error('Error handleReactivar:', err);
      alert('Error al reactivar al cliente');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setIsEditing(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos obligatorios
    if (!formValues.nombre || !formValues.apellido || !formValues.dni_cuit) {
      alert("Los campos obligatorios (nombre, apellido, dni_cuit) no pueden estar vacíos");
      return;
    }

    if (formValues.es_socio && !formValues.codigo_socio) {
      alert("El campo código de socio es obligatorio si es socio");
      return;
    }

    try {
      // Limpiar datos condicionales si no es socio
      const dataToSave = { ...formValues };
      if (!dataToSave.es_socio) {
        dataToSave.codigo_socio = null;
        dataToSave.fecha_inicio = null;
      }

      if (isEditing) {
        const res = await api.put(`/api/clientes/${formValues.id}`, dataToSave);
        if (res.data.success) {
          setClientes(clientes.map(c => c.id === formValues.id ? res.data.data : c));
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

  const clientesFiltrados = clientes.filter(cliente => {
    const termino = busqueda.toLowerCase();
    const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellido || ''}`.toLowerCase();
    const dni = (cliente.dni_cuit || '').toLowerCase();
    return nombreCompleto.includes(termino) || dni.includes(termino);
  });

  return (
    <div className="main-content">
      <PageHeader
        title="Gestión de Clientes"
        subtitle="Verifica el total de tus Clientes"
        image="/img/welcome-background.png"
      />

      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#333', margin: 0, fontSize: '2rem' }}>Clientes Totales</h1>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}>Listado maestro de clientes registrados.</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={handleNewCliente}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            <UserPlus size={20} /> Nuevo Cliente
          </button>
        </div>

        <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, apellido o DNI..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem' }}
          />
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
                <th>Categoría</th>
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
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-blue)' }} />
                    <p style={{ marginTop: '10px', color: '#666' }}>Cargando clientes...</p>
                  </td>
                </tr>
              ) : clientesFiltrados.length > 0 ? (
                clientesFiltrados.map(cliente => (
                  <tr key={cliente.id}>
                    <td className="columna-fija"><strong>{cliente.nombre}</strong></td>
                    <td>{cliente.apellido}</td>
                    <td>{cliente.dni_cuit}</td>
                    <td>
                      {cliente.categoria ? (
                        <span className="etiqueta-plan-socio" style={{
                          backgroundColor: '#e1f0ff',
                          color: 'var(--accent-blue)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '0.85rem'
                        }}>
                          {cliente.categoria.nombre}
                        </span>
                      ) : (
                        <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.85rem' }}>Sin Categoría</span>
                      )}
                    </td>
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
                        <TableActions
                          onEdit={() => handleEdit(cliente)}
                          onDelete={() => openDeleteConfirm(cliente)}
                          containerClassName=""
                          containerStyle={{ display: 'flex', gap: '10px' }}
                          editClassName="btn-accion-edit"
                          deleteClassName="btn-accion-delete"
                          editTitle="Editar"
                          deleteTitle="Dar de baja"
                          editStyle={{ border: 'none', background: '#e1f0ff', color: '#00a8e8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                          deleteStyle={{ border: 'none', background: '#fff1f1', color: '#e03131', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                        />
                        {cliente.telefono && (
                          <a 
                            href={`https://wa.me/${cliente.telefono.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="Enviar WhatsApp"
                            style={{ display: 'flex', alignItems: 'center', background: '#e6f9ee', color: '#25D366', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none' }}
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                        <button
                          onClick={() => setClienteRutinaSeleccionado(cliente)}
                          title="Gestionar Rutinas"
                          style={{ display: 'flex', alignItems: 'center', background: '#f4f0ff', color: '#845ef7', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <Dumbbell size={16} />
                        </button>
                        {cliente.estado_cliente === 'INACTIVO' && (
                          <button
                            title="Reactivar cliente"
                            onClick={() => handleReactivar(cliente)}
                            style={{ border: 'none', background: '#e6f9ee', color: '#2b8a3e', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>No hay clientes registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Modal isOpen={showForm} onClose={handleCloseForm} title={isEditing ? "Editar Cliente" : "Nuevo Cliente"}>
          <div className="contenedor-formulario" style={{ padding: '0', boxShadow: 'none' }}>
            <form className="formulario-fluxer" onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '100%', padding: '0', boxShadow: 'none' }}>
              <div className="cuadricula-formulario">
                <div className="grupo-campo">
                  <label htmlFor="nombre">Nombre *</label>
                  <input type="text" id="nombre" name="nombre" value={formValues.nombre} onChange={handleInputChange} placeholder="Nombre" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="apellido">Apellido *</label>
                  <input type="text" id="apellido" name="apellido" value={formValues.apellido} onChange={handleInputChange} placeholder="Apellido" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="dni_cuit">DNI / CUIT *</label>
                  <input type="text" id="dni_cuit" name="dni_cuit" value={formValues.dni_cuit} onChange={handleInputChange} placeholder="DNI sin puntos" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" value={formValues.email} onChange={handleInputChange} placeholder="ejemplo@correo.com" />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="telefono">Teléfono</label>
                  <input type="tel" id="telefono" name="telefono" value={formValues.telefono} onChange={handleInputChange} placeholder="+54 9..." />
                </div>
                
                <div className="grupo-campo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '25px' }}>
                  <input 
                    type="checkbox" 
                    id="es_socio" 
                    name="es_socio"
                    checked={formValues.es_socio} 
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
                      name="estado_pago"
                      value={formValues.estado_pago} 
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      <option value="ALDIA">Al Día</option>
                      <option value="MOROSO">Moroso</option>
                    </select>
                  </div>
                )}

                {formValues.es_socio && (
                  <>
                    <div className="grupo-campo">
                      <label htmlFor="codigo_socio">Código Socio *</label>
                      <input type="text" id="codigo_socio" name="codigo_socio" value={formValues.codigo_socio} onChange={handleInputChange} placeholder="Ej: SOC-001" required={formValues.es_socio} />
                    </div>
                    <div className="grupo-campo">
                      <label htmlFor="fecha_inicio">Fecha Inicio</label>
                      <input type="date" id="fecha_inicio" name="fecha_inicio" value={formValues.fecha_inicio} onChange={handleInputChange} />
                    </div>
                  </>
                )}

                <div className="grupo-campo">
                  <label htmlFor="categoriaId">Asignar Categoría / Actividad</label>
                  <select 
                    id="categoriaId" 
                    name="categoriaId" 
                    value={formValues.categoriaId} 
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value="">-- Sin Categoría (Selecciona una) --</option>
                    {categoriasList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.plan ? `(${c.plan.nombre})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grupo-campo ancho-completo">
                <label htmlFor="observaciones">Observaciones</label>
                <textarea id="observaciones" name="observaciones" rows="3" value={formValues.observaciones} onChange={handleInputChange} placeholder="Información adicional..."></textarea>
              </div>

              <div className="acciones-formulario">
                <button type="button" className="btn-secondary" onClick={handleCloseForm}>
                  <X size={18} style={{ marginRight: '5px' }} /> Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}>
                  <Save size={18} style={{ marginRight: '5px' }} /> {isEditing ? "Guardar Cambios" : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </Modal>

        <ConfirmDeleteModal
          isOpen={isDeleteConfirmOpen}
          title="Confirmar eliminación"
          message={<>¿Estás seguro de que deseas eliminar al cliente <strong>{clienteToDelete?.nombre}</strong>?</>}
          warning="Esta acción no se puede deshacer."
          icon={<AlertTriangle size={48} className="confirm-icon" />}
          onCancel={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          cancelLabel="Cancelar"
          confirmLabel="Eliminar Cliente"
        />

        <ModalRutinas 
          isOpen={!!clienteRutinaSeleccionado}
          onClose={() => setClienteRutinaSeleccionado(null)}
          cliente={clienteRutinaSeleccionado}
        />
      </div>
    </div>
  );
};

export default ClientesTotales;
