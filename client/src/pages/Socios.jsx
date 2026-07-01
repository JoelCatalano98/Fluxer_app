import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { UserPlus, Save, X, AlertTriangle, Search } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import TableActions from '../components/TableActions';

// Importamos los estilos
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';
import '../styles/clientes/socios.css';

const Socios = () => {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [socioToDelete, setSocioToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [nuevoSocio, setNuevoSocio] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    plan: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  // Función para obtener socios (con datos de respaldo si el servidor no responde)
  const fetchSocios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/socios');
      setSocios(res.data);
    } catch (error) {
      console.warn("Servidor no disponible, cargando datos de prueba.");
      // Datos de respaldo para la demo
      setSocios([
        { _id: '1', nombre: 'Joel', apellido: 'Silva', dni: '35123456', email: 'joel@example.com', telefono: '341-555-0011', plan: 'Premium', fecha_inicio: '2024-05-01' },
        { _id: '2', nombre: 'Tomás', apellido: 'García', dni: '38123456', email: 'tomas@example.com', telefono: '341-555-0022', plan: 'Básico', fecha_inicio: '2024-05-15' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSocios();
  }, [fetchSocios]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNuevoSocio(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleOpenForm = (socio = null) => {
    if (socio) {
      setNuevoSocio({
        ...socio,
        _id: socio._id // Aseguramos el ID para edición
      });
      setIsEditing(true);
    } else {
      setNuevoSocio({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
        plan: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        observaciones: ''
      });
      setIsEditing(false);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Simulación de actualización local
        setSocios(socios.map(s => s._id === nuevoSocio._id ? { ...nuevoSocio } : s));
        alert('¡Socio actualizado con éxito!');
      } else {
        // Simulación de creación local
        const fakeId = Math.random().toString(36).substr(2, 9);
        const socioCreado = { ...nuevoSocio, _id: fakeId };
        setSocios([...socios, socioCreado]);
        alert('¡Socio registrado con éxito!');
      }
      setShowForm(false);
    } catch (error) {
      console.error("Error al guardar socio:", error);
    }
  };

  const openDeleteConfirm = (socio) => {
    setSocioToDelete(socio);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setSocios(socios.filter(s => s._id !== socioToDelete._id));
    setIsDeleteConfirmOpen(false);
    setSocioToDelete(null);
    alert("Socio eliminado correctamente");
  };

  // Filtrado de socios por nombre, apellido o DNI
  const sociosFiltrados = socios.filter(socio => {
    const busqueda = searchTerm.toLowerCase();
    return (
      socio.nombre.toLowerCase().includes(busqueda) ||
      socio.apellido.toLowerCase().includes(busqueda) ||
      socio.dni.includes(busqueda)
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
        <div className="socios-actions">
          <div className="search-bar search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o DNI..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-nuevo-socio" onClick={() => handleOpenForm()}>
            <UserPlus size={20} /> <span>Nuevo Socio</span>
          </button>
        </div>

        <div className="contenedor-scroll">
          <table className="tabla-cronograma">
            <thead>
              <tr>
                <th className="columna-fija">Cod. Cliente</th>
                <th>Nombre Completo</th>
                <th>DNI</th>
                <th>Teléfono</th>
                <th>Plan / Abono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Cargando socios...</td></tr>
              ) : sociosFiltrados.length > 0 ? (
                sociosFiltrados.map(socio => (
                  <tr key={socio._id}>
                    <td className="columna-fija">#SOC-{socio._id.slice(-4)}</td>
                    <td><strong>{socio.nombre} {socio.apellido}</strong></td>
                    <td>{socio.dni}</td>
                    <td>{socio.telefono || 'N/A'}</td>
                    <td>
                      <span className="etiqueta-plan-socio">
                        {socio.plan || 'Básico'}
                      </span>
                    </td>
                    <td>
                      <TableActions
                        onEdit={() => handleOpenForm(socio)}
                        onDelete={() => openDeleteConfirm(socio)}
                        editClassName="btn-accion-edit"
                        deleteClassName="btn-accion-delete"
                        editTitle="Editar"
                        deleteTitle="Eliminar"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No se encontraron socios que coincidan con la búsqueda.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Crear/Editar */}
        <Modal 
          isOpen={showForm} 
          onClose={() => setShowForm(false)} 
          title={isEditing ? "Editar Socio" : "Registrar Nuevo Socio"}
        >
          <div className="contenedor-form-socio">
            <p className="instrucciones-form">
              {isEditing ? "Modifica los datos del socio seleccionado." : "Completa la ficha del nuevo miembro del gimnasio."}
            </p>

            <form className="formulario-socio" onSubmit={handleSubmit}>
              <div className="grupo-entrada-socio">
                <label htmlFor="nombre">Nombre</label>
                <input type="text" id="nombre" value={nuevoSocio.nombre} onChange={handleInputChange} placeholder="Ej: Juan" required />
              </div>
              <div className="grupo-entrada-socio">
                <label htmlFor="apellido">Apellido</label>
                <input type="text" id="apellido" value={nuevoSocio.apellido} onChange={handleInputChange} placeholder="Ej: Pérez" required />
              </div>
              <div className="grupo-entrada-socio">
                <label htmlFor="dni">DNI / Identificación</label>
                <input type="text" id="dni" value={nuevoSocio.dni} onChange={handleInputChange} placeholder="Sin puntos" required />
              </div>
              <div className="grupo-entrada-socio">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" value={nuevoSocio.email} onChange={handleInputChange} placeholder="usuario@email.com" />
              </div>
              <div className="grupo-entrada-socio">
                <label htmlFor="telefono">Teléfono / WhatsApp</label>
                <input type="tel" id="telefono" value={nuevoSocio.telefono} onChange={handleInputChange} placeholder="+54 9 ..." />
              </div>
              <div className="grupo-entrada-socio">
                <label htmlFor="plan">Plan / Abono</label>
                <select id="plan" value={nuevoSocio.plan} onChange={handleInputChange} required>
                  <option value="">Seleccionar...</option>
                  <option value="Básico">Básico</option>
                  <option value="Premium">Premium</option>
                  <option value="Familiar">Familiar</option>
                </select>
              </div>
              <div className="grupo-entrada-socio">
                <label htmlFor="fecha_inicio">Fecha de Inicio</label>
                <input type="date" id="fecha_inicio" value={nuevoSocio.fecha_inicio} onChange={handleInputChange} />
              </div>
              <div className="grupo-entrada-socio ancho-total">
                <label htmlFor="observaciones">Observaciones</label>
                <textarea id="observaciones" rows="2" value={nuevoSocio.observaciones} onChange={handleInputChange} placeholder="Notas médicas, deudas, etc..."></textarea>
              </div>

              <div className="pie-form-socio ancho-total">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  <X size={18} /> Cancelar
                </button>
                <button type="submit" className="btn-save">
                  <Save size={18} /> {isEditing ? "Actualizar" : "Registrar"} Socio
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Modal Confirmar Eliminación */}
        <ConfirmDeleteModal
          isOpen={isDeleteConfirmOpen}
          title="Confirmar eliminación"
          message={<>¿Estás seguro de que deseas eliminar al socio <strong>{socioToDelete?.nombre} {socioToDelete?.apellido}</strong>?</>}
          warning="Esta acción no se puede deshacer."
          icon={<AlertTriangle size={48} className="confirm-icon" />}
          onCancel={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          cancelLabel="Cancelar"
          confirmLabel="Eliminar Socio"
        />
      </div>
    </div>
  );
};

export default Socios;
