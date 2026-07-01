import { useState } from 'react';
import { UserPlus, Save, X, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import TableActions from '../components/TableActions';
import { useForm } from '../hooks/useForm';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';
import '../styles/clientes/formularios_clientes.css';

const ClientesTotales = () => {
  const [clientes, setClientes] = useState([
    {
      codigo: '#001',
      nombre: 'Joel Silva',
      dni: '12.345.678',
      email: 'joel@email.com',
      telefono: '341-555-0123',
      plan: 'premium',
      fecha_inicio: '2026-01-01',
      observaciones: 'Cliente inicial',
      isMoroso: false
    },
    {
      codigo: '#002',
      nombre: 'juan perez',
      dni: '12.345.678',
      email: 'juan@email.com',
      telefono: '341-555-0123',
      plan: 'premium',
      fecha_inicio: '2026-01-02',
      observaciones: 'Cliente inicial 2',
      isMoroso: false
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCodigo, setEditingCodigo] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);

  // Hook useForm para controlar el formulario de Clientes
  const [formValues, handleInputChange, resetForm, setFormValues] = useForm({
    codigo: '',
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    plan: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    observaciones: '',
    isMoroso: false
  });

  const handleNewCliente = () => {
    setIsEditing(false);
    setEditingCodigo(null);
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (cliente) => {
    setIsEditing(true);
    setEditingCodigo(cliente.codigo);
    setFormValues({
      ...cliente,
      isMoroso: cliente.isMoroso || false
    });
    setShowForm(true);
  };

  const openDeleteConfirm = (cliente) => {
    setClienteToDelete(cliente);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setClientes(prev => prev.filter(c => c.codigo !== clienteToDelete.codigo));
    setIsDeleteConfirmOpen(false);
    setClienteToDelete(null);
    alert("Cliente eliminado correctamente");
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditingCodigo(null);
    resetForm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos del cliente enviados:', formValues); // Log de datos controlados con isMoroso
    
    if (isEditing) {
      if (formValues.codigo !== editingCodigo && clientes.some(c => c.codigo === formValues.codigo)) {
        alert("El código de cliente ya existe. Por favor, use otro.");
        return;
      }
      setClientes(prev => prev.map(c => c.codigo === editingCodigo ? formValues : c));
      alert("¡Cliente editado con éxito!");
    } else {
      if (clientes.some(c => c.codigo === formValues.codigo)) {
        alert("El código de cliente ya existe. Por favor, use otro.");
        return;
      }
      setClientes(prev => [...prev, formValues]);
      alert("¡Cliente guardado con éxito!");
    }
    
    handleCloseForm();
  };

  return (
    <div className="main-content">
      <PageHeader
        title="Gestión de Clientes"
        subtitle="Verifica el total de tus Clientes"
        image="/img/welcome-background.png"
      />

      <div style={{ padding: '5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#333', margin: 0, fontSize: '2rem' }}>Clientes Totales</h1>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}>Listado completo de socios activos en el sistema.</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={handleNewCliente}
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
              {clientes.map(cliente => (
                <tr key={cliente.codigo}>
                  <td className="columna-fija">{cliente.codigo}</td>
                  <td><strong>{cliente.nombre}</strong></td>
                  <td>{cliente.dni}</td>
                  <td>{cliente.telefono}</td>
                  <td>
                    <span 
                      className="etiqueta-plan" 
                      style={{ 
                        background: cliente.plan === 'premium' ? '#e1f0ff' : cliente.plan === 'basic' ? '#e6fcf5' : '#f1f3f5', 
                        color: cliente.plan === 'premium' ? '#00a8e8' : cliente.plan === 'basic' ? '#0ca678' : '#495057', 
                        padding: '4px 8px', 
                        borderRadius: '4px' 
                      }}
                    >
                      {cliente.plan === 'premium' ? 'Premium' : cliente.plan === 'basic' ? 'Básico' : 'Sin Plan'}
                    </span>
                  </td>
                  <td>
                    <TableActions
                      onEdit={() => handleEdit(cliente)}
                      onDelete={() => openDeleteConfirm(cliente)}
                      containerClassName=""
                      containerStyle={{ display: 'flex', gap: '10px' }}
                      editClassName="btn-help"
                      deleteClassName="btn-help"
                      editTitle="Editar"
                      deleteTitle="Eliminar"
                      editStyle={{ border: 'none', background: '#e1f0ff', color: '#00a8e8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                      deleteStyle={{ border: 'none', background: '#fff1f1', color: '#e03131', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal isOpen={showForm} onClose={handleCloseForm} title={isEditing ? "Editar Cliente" : "Nuevo Cliente"}>
          <div className="contenedor-formulario" style={{ padding: '0', boxShadow: 'none' }}>
            <form className="formulario-fluxer" onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '100%', padding: '0', boxShadow: 'none' }}>
              <div className="cuadricula-formulario">
                <div className="grupo-campo">
                  <label htmlFor="codigo">Cod. Cliente</label>
                  <input type="text" id="codigo" name="codigo" value={formValues.codigo} onChange={handleInputChange} placeholder="Ej: #002" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="nombre">Nombre Completo</label>
                  <input type="text" id="nombre" name="nombre" value={formValues.nombre} onChange={handleInputChange} placeholder="Ej: Juan Pérez" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="dni">DNI / CUIT</label>
                  <input type="text" id="dni" name="dni" value={formValues.dni} onChange={handleInputChange} placeholder="Sin puntos ni guiones" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="email">Correo Electrónico</label>
                  <input type="email" id="email" name="email" value={formValues.email} onChange={handleInputChange} placeholder="usuario@email.com" />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="telefono">Teléfono / WhatsApp</label>
                  <input type="tel" id="telefono" name="telefono" value={formValues.telefono} onChange={handleInputChange} placeholder="+54 9 ..." />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="plan">Plan / Abono</label>
                  <select id="plan" name="plan" value={formValues.plan} onChange={handleInputChange}>
                    <option value="">Seleccionar plan...</option>
                    <option value="basic">Básico</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className="grupo-campo">
                  <label htmlFor="fecha_inicio">Fecha de Inicio</label>
                  <input type="date" id="fecha_inicio" name="fecha_inicio" value={formValues.fecha_inicio} onChange={handleInputChange} />
                </div>
              </div>
              
              <div className="grupo-campo ancho-completo">
                <label htmlFor="observaciones">Observaciones</label>
                <textarea id="observaciones" name="observaciones" rows="3" value={formValues.observaciones} onChange={handleInputChange} placeholder="Información adicional relevante..."></textarea>
              </div>

              <div className="form-check mb-3" style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="isMoroso"
                  name="isMoroso"
                  checked={formValues.isMoroso || false}
                  onChange={handleInputChange}
                  style={{ width: '18px', height: '18px', marginRight: '8px', cursor: 'pointer', verticalAlign: 'middle' }}
                />
                <label className="form-check-label" htmlFor="isMoroso" style={{ fontWeight: '600', cursor: 'pointer', verticalAlign: 'middle' }}>
                  ¿Es moroso?
                </label>
              </div>

              <div className="acciones-formulario">
                <button type="button" className="btn-secondary" onClick={handleCloseForm}>
                  <X size={18} style={{ marginRight: '5px' }} /> Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={18} style={{ marginRight: '5px' }} /> Guardar Cliente
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
      </div>
    </div>
  );
};

export default ClientesTotales;
