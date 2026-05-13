import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { UserPlus, Save, X, Pencil, Trash } from 'lucide-react';
import Modal from '../components/Modal';

// Importamos los estilos globales y específicos
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';
import '../styles/clientes/formularios_clientes.css';

const Socios = () => {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  const fetchSocios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/socios');
      setSocios(res.data);
    } catch (error) {
      console.error("Error fetching socios:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSocios();
    }, 0);
    return () => clearTimeout(timer);
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
      setNuevoSocio(socio);
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
        console.log("Actualizando socio:", nuevoSocio);
        alert('¡Socio actualizado con éxito! (Simulado)');
      } else {
        console.log("Creando socio:", nuevoSocio);
        alert('¡Socio registrado con éxito! (Simulado)');
      }
      setShowForm(false);
      fetchSocios();
    } catch (error) {
      console.error("Error saving socio:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este socio?')) {
      try {
        console.log("Eliminando socio:", id);
        alert('Socio eliminado (Simulado)');
        fetchSocios();
      } catch (error) {
        console.error("Error deleting socio:", error);
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
      <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Gestión de Socios </h1>
      <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}> Da de alta y administra tus socios</p>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <div className="search-bar" style={{ width: '300px', margin: 0 }}>
            <input type="text" placeholder="Buscar socio..." />
          </div>
          <button className="btn-primary" onClick={() => handleOpenForm()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#00a8e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <UserPlus size={20} /> Nuevo Socio
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
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Cargando socios...</td></tr>
              ) : socios.length > 0 ? (
                socios.map(socio => (
                  <tr key={socio._id}>
                    <td className="columna-fija">#SOC-{socio._id.slice(-4)}</td>
                    <td><strong>{socio.nombre} {socio.apellido}</strong></td>
                    <td>{socio.dni}</td>
                    <td>{socio.telefono || 'N/A'}</td>
                    <td><span className="etiqueta-plan" style={{ background: '#e1f0ff', color: '#00a8e8', padding: '4px 8px', borderRadius: '4px' }}>{socio.plan || 'Básico'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-help" onClick={() => handleOpenForm(socio)} title="Editar" style={{ border: 'none', background: '#e1f0ff', color: '#00a8e8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Pencil size={14} /></button>
                        <button className="btn-help" onClick={() => handleDelete(socio._id)} title="Eliminar" style={{ border: 'none', background: '#fff1f1', color: '#e03131', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Trash size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No se encontraron socios.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={isEditing ? "Editar Socio" : "Nuevo Socio"}>
          <div className="contenedor-formulario" style={{ padding: '0', boxShadow: 'none' }}>
            <div className="cabecera-formulario">
              <p>{isEditing ? "Modifica los datos del socio." : "Completa los datos personales y de abono del nuevo socio."}</p>
            </div>

            <form className="formulario-fluxer" onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '100%', padding: '0', boxShadow: 'none' }}>
              <div className="cuadricula-formulario">
                <div className="grupo-campo">
                  <label htmlFor="nombre">Nombre Completo</label>
                  <input type="text" id="nombre" value={nuevoSocio.nombre} onChange={handleInputChange} placeholder="Ej: Juan Pérez" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="apellido">Apellido</label>
                  <input type="text" id="apellido" value={nuevoSocio.apellido} onChange={handleInputChange} placeholder="Ej: Pérez" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="dni">DNI / Identificación</label>
                  <input type="text" id="dni" value={nuevoSocio.dni} onChange={handleInputChange} placeholder="Sin puntos ni guiones" required />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="email">Correo Electrónico</label>
                  <input type="email" id="email" value={nuevoSocio.email} onChange={handleInputChange} placeholder="usuario@email.com" />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="telefono">Teléfono / WhatsApp</label>
                  <input type="tel" id="telefono" value={nuevoSocio.telefono} onChange={handleInputChange} placeholder="+54 9 ..." />
                </div>
                <div className="grupo-campo">
                  <label htmlFor="plan">Plan / Abono</label>
                  <select id="plan" value={nuevoSocio.plan} onChange={handleInputChange}>
                    <option value="">Seleccionar plan...</option>
                    <option value="basic">Básico</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className="grupo-campo">
                  <label htmlFor="fecha_inicio">Fecha de Inicio</label>
                  <input type="date" id="fecha_inicio" value={nuevoSocio.fecha_inicio} onChange={handleInputChange} />
                </div>
              </div>
              
              <div className="grupo-campo ancho-completo">
                <label htmlFor="observaciones">Observaciones</label>
                <textarea id="observaciones" rows="3" value={nuevoSocio.observaciones} onChange={handleInputChange} placeholder="Información adicional relevante..."></textarea>
              </div>

              <div className="acciones-formulario">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  <X size={18} style={{ marginRight: '5px' }} /> Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={18} style={{ marginRight: '5px' }} /> {isEditing ? "Actualizar" : "Guardar"} Cliente
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
