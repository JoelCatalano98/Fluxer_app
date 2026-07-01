import { useState } from 'react';
import { UserPlus, X, Save, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import TableActions from '../components/TableActions';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';
import '../styles/clientes/profesionales.css';

const Profesionales = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingProfesional, setEditingProfesional] = useState(null);
  const [profesionalToDelete, setProfesionalToDelete] = useState(null);

  const [profesionales, setProfesionales] = useState([
    { id: 1, nombre: 'Juan Pérez', dni: '30123456', especialidad: 'Kinesiología', matricula: 'Mat. 12345', email: 'juan.perez@example.com', telefono: '341-555-0123', estado: 'Activo' },
    { id: 2, nombre: 'Ana García', dni: '32456789', especialidad: 'Nutrición', matricula: 'Mat. 56789', email: 'ana.garcia@example.com', telefono: '341-555-0456', estado: 'Activo' },
  ]);

  const [nuevoProfesional, setNuevoProfesional] = useState({
    nombre: '',
    dni: '',
    especialidad: '',
    matricula: '',
    email: '',
    telefono: ''
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNuevoProfesional(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const openCreateModal = () => {
    setEditingProfesional(null);
    setNuevoProfesional({
      nombre: '',
      dni: '',
      especialidad: '',
      matricula: '',
      email: '',
      telefono: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prof) => {
    setEditingProfesional(prof);
    setNuevoProfesional({
      nombre: prof.nombre,
      dni: prof.dni,
      especialidad: prof.especialidad,
      matricula: prof.matricula.replace('Mat. ', ''),
      email: prof.email,
      telefono: prof.telefono
    });
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (prof) => {
    setProfesionalToDelete(prof);
    setIsDeleteConfirmOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProfesional) {
      setProfesionales(profesionales.map(p => 
        p.id === editingProfesional.id 
          ? { ...p, ...nuevoProfesional, matricula: `Mat. ${nuevoProfesional.matricula}` } 
          : p
      ));
      alert("¡Profesional actualizado con éxito!");
    } else {
      const newId = profesionales.length > 0 ? Math.max(...profesionales.map(p => p.id)) + 1 : 1;
      setProfesionales([...profesionales, { 
        ...nuevoProfesional, 
        id: newId, 
        matricula: `Mat. ${nuevoProfesional.matricula}`, 
        estado: 'Activo' 
      }]);
      alert("¡Profesional registrado con éxito!");
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    setProfesionales(profesionales.filter(p => p.id !== profesionalToDelete.id));
    setIsDeleteConfirmOpen(false);
    setProfesionalToDelete(null);
    alert("Profesional eliminado correctamente");
  };

  return (
    <div className="main-content">
      {/* Encabezado Estandarizado */}
      <PageHeader
        id={null}
        className="dashboard-header content-header"
        title="Staff Profesional"
        subtitle="Listado completo de médicos, técnicos y entrenadores."
        image="/img/welcome-background.png"
      />

      <div className="profesionales-container">
        <div className="profesionales-actions">
          <h2>Gestión de Profesionales</h2>
          <button 
            className="btn-crear-profesional" 
            onClick={openCreateModal}
          >
            <UserPlus size={18} /> <span>Crear un profesional</span>
          </button>
        </div><br></br>

        <div className="contenedor-scroll">
          <table className="tabla-cronograma">
            <thead>
              <tr>
                <th className="columna-fija">Referente</th>
                <th>Especialidad</th>
                <th>Matrícula</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {profesionales.map((prof) => (
                <tr key={prof.id}>
                  <td className="columna-fija"><strong>{prof.nombre}</strong></td>
                  <td>{prof.especialidad}</td>
                  <td>{prof.matricula}</td>
                  <td>{prof.telefono}</td>
                  <td>
                    <span className="badge badge-success-light">{prof.estado}</span>
                  </td>
                  <td>
                    <TableActions
                      onEdit={() => openEditModal(prof)}
                      onDelete={() => openDeleteConfirm(prof)}
                      editClassName="btn-edit-prof"
                      deleteClassName="btn-delete-prof"
                      editTitle="Editar"
                      deleteTitle="Eliminar"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingProfesional ? "Editar Profesional" : "Crear Nuevo Profesional"}
      >
        <div id="modalNuevoProfesional">
          <p className="p-instrucciones">Completá los datos para gestionar al miembro del staff.</p>
          <form className="modal-body" onSubmit={handleSubmit}>
            <div className="profesional-form">
              <div className="grupo-entrada">
                <label htmlFor="nombre">Nombre y Apellido</label>
                <input type="text" id="nombre" placeholder="Ej: Dr. García" value={nuevoProfesional.nombre} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="dni">DNI</label>
                <input type="text" id="dni" placeholder="Sin puntos" value={nuevoProfesional.dni} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="especialidad">Especialidad</label>
                <input type="text" id="especialidad" placeholder="Ej: Traumatología" value={nuevoProfesional.especialidad} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="matricula">Nro Matrícula (Opcional)</label>
                <input type="text" id="matricula" placeholder="Ej: 12345/A" value={nuevoProfesional.matricula} onChange={handleInputChange} />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" placeholder="profesional@ejemplo.com" value={nuevoProfesional.email} onChange={handleInputChange} required />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="telefono">Teléfono de contacto</label>
                <input type="tel" id="telefono" placeholder="+54 9 ..." value={nuevoProfesional.telefono} onChange={handleInputChange} required />
              </div>
            </div>
            
            <div className="pie-formulario">
              <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                <X size={18} /> <span>Cancelar</span>
              </button>
              <button type="submit" className="btn-save">
                <Save size={18} /> <span>{editingProfesional ? "Actualizar Datos" : "Registrar Profesional"}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        title="Confirmar eliminación"
        message={<>¿Estás seguro de que deseas eliminar al profesional <strong>{profesionalToDelete?.nombre}</strong>?</>}
        warning="Esta acción no se puede deshacer."
        icon={<AlertTriangle size={48} className="confirm-icon" />}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        cancelLabel="Cancelar"
        confirmLabel="Eliminar Staff"
      />
    </div>
  );
};

export default Profesionales;
