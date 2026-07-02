import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Pencil, Save, X, Loader2, AlertTriangle, Search, DollarSign } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import TableActions from '../components/TableActions';

// Importamos los estilos
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';
import '../styles/clientes/socios.css';

const Socios = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formSocio, setFormSocio] = useState({
    id: null,
    codigo_socio: '',
    nombre: '',
    apellido: '',
    dni_cuit: '',
    email: '',
    telefono: '',
    fecha_inicio: '',
    planId: '',
    observaciones: ''
  });

  const fetchSocios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Filtro para traer solo socios
      const res = await api.get('/api/clientes?filtro=socios');
      if (res.data.success) {
        setClientes(res.data.data.clientes);
      } else {
        throw new Error(res.data.message || 'Error al obtener socios');
      }
    } catch (err) {
      console.error('Error fetchSocios:', err);
      setError('Error al cargar la lista de socios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSocios();
  }, [fetchSocios]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormSocio(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleOpenEdit = (cliente) => {
    setFormSocio({
      id: cliente.id,
      codigo_socio: cliente.codigo_socio,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      dni_cuit: cliente.dni_cuit,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      fecha_inicio: cliente.fecha_inicio ? new Date(cliente.fecha_inicio).toISOString().split('T')[0] : '',
      planId: cliente.planId || '',
      observaciones: cliente.observaciones || ''
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/api/clientes/${formSocio.id}`, formSocio);
      if (res.data.success) {
        setClientes(clientes.map(c => c.id === formSocio.id ? res.data.data : c));
        alert('¡Socio actualizado con éxito!');
        setShowForm(false);
      }
    } catch (err) {
      console.error('Error handleSubmit:', err);
      alert('Error al guardar cambios');
    }
  };

  const toggleEstadoPago = async (cliente) => {
    const nuevoEstado = cliente.estado_pago === 'ALDIA' ? 'MOROSO' : 'ALDIA';
    try {
      const res = await api.patch(`/api/clientes/${cliente.id}/estado-pago`, { estado_pago: nuevoEstado });
      if (res.data.success) {
        setClientes(clientes.map(c => c.id === cliente.id ? { ...c, estado_pago: nuevoEstado } : c));
      }
    } catch (err) {
      console.error('Error toggleEstadoPago:', err);
      alert('Error al cambiar estado de pago');
    }
  };

  const sociosFiltrados = clientes.filter(cliente => {
    const busqueda = searchTerm.toLowerCase();
    return (
      cliente.nombre.toLowerCase().includes(busqueda) ||
      cliente.apellido.toLowerCase().includes(busqueda) ||
      cliente.dni_cuit.includes(busqueda) ||
      (cliente.codigo_socio && cliente.codigo_socio.toLowerCase().includes(busqueda))
    );
  });

  return (
    <div className="main-content">
      {/* Encabezado Estandarizado */}
      <PageHeader
        title="Gestión de Socios"
        subtitle="Administra la base de miembros y sus abonos."
        image="/img/welcome-background.png"
      />

      <div className="socios-container">
        <div className="socios-actions" style={{ justifyContent: 'flex-start' }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por código, nombre o DNI..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p style={{ marginLeft: '20px', color: '#666', fontSize: '0.9rem' }}>
            * Los socios se gestionan desde la vista de <strong>Clientes Totales</strong>.
          </p>
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
                <th className="columna-fija">Código</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Plan</th>
                <th>Estado Pago</th>
                <th>Estado Cliente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-blue)' }} />
                    <p style={{ marginTop: '10px', color: '#666' }}>Cargando socios...</p>
                  </td>
                </tr>
              ) : sociosFiltrados.length > 0 ? (
                sociosFiltrados.map(cliente => (
                  <tr key={cliente.id}>
                    <td className="columna-fija"><strong>{cliente.codigo_socio}</strong></td>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.apellido}</td>
                    <td>
                      <span className="etiqueta-plan-socio">
                        {cliente.plan?.nombre || 'Sin Plan'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${cliente.estado_pago === 'ALDIA' ? 'badge-success-light' : 'badge-danger-light'}`}>
                        {cliente.estado_pago}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${cliente.estado_cliente === 'ACTIVO' ? 'badge-success-light' : ''}`} style={cliente.estado_cliente !== 'ACTIVO' ? { backgroundColor: '#eee', color: '#666' } : {}}>
                        {cliente.estado_cliente}
                      </span>
                    </td>
                    <td>
                      <TableActions
                        onEdit={() => handleOpenEdit(cliente)}
                        onDelete={() => toggleEstadoPago(cliente)}
                        editClassName="btn-accion-edit"
                        editTitle="Editar"
                        deleteIcon={<DollarSign size={14} />}
                        deleteTitle="Cambiar Estado Pago"
                        deleteStyle={{ border: 'none', background: '#f0f4f8', color: '#555', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No se encontraron socios.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Editar Socio">
          <div className="contenedor-form-socio">
            <form className="formulario-socio" onSubmit={handleSubmit}>
              <div className="grupo-entrada-socio">
                <label htmlFor="codigo_socio">Código Socio *</label>
                <input type="text" id="codigo_socio" value={formSocio.codigo_socio} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada-socio">
                <label htmlFor="nombre">Nombre *</label>
                <input type="text" id="nombre" value={formSocio.nombre} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada-socio">
                <label htmlFor="apellido">Apellido *</label>
                <input type="text" id="apellido" value={formSocio.apellido} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada-socio">
                <label htmlFor="dni_cuit">DNI / CUIT *</label>
                <input type="text" id="dni_cuit" value={formSocio.dni_cuit} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada-socio">
                <label htmlFor="planId">ID de Plan</label>
                <input type="number" id="planId" value={formSocio.planId} onChange={handleInputChange} />
              </div>
              <div className="grupo-entrada-socio">
                <label htmlFor="fecha_inicio">Fecha Inicio</label>
                <input type="date" id="fecha_inicio" value={formSocio.fecha_inicio} onChange={handleInputChange} />
              </div>
              <div className="grupo-entrada-socio ancho-total">
                <label htmlFor="observaciones">Observaciones</label>
                <textarea id="observaciones" rows="2" value={formSocio.observaciones} onChange={handleInputChange}></textarea>
              </div>

              <div className="pie-form-socio ancho-total">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  <X size={18} /> Cancelar
                </button>
                <button type="submit" className="btn-save" style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}>
                  <Save size={18} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Socios;
