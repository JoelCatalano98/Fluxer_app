import { useState } from 'react';
import { Pencil, Trash, UserPlus, X, Save } from 'lucide-react';
import Modal from '../components/Modal';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';

const Profesionales = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Nuevo profesional:", nuevoProfesional);
    alert("¡Profesional registrado con éxito! (Simulado)");
    setIsModalOpen(false);
    setNuevoProfesional({
      nombre: '',
      dni: '',
      especialidad: '',
      matricula: '',
      email: '',
      telefono: ''
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
          <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Staff Profesional</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Listado completo de médicos, técnicos y entrenadores del sistema.</p>
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

      <div style={{ padding: '20px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h2 style={{ color: '#333', margin: 0, fontSize: '1.5rem' }}>Gestión de Profesionales</h2>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => setIsModalOpen(true)}
            style={{ 
              width: 'auto', 
              height: 'auto', 
              padding: '10px 20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              backgroundColor: '#00a8e8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 4px 10px rgba(0, 168, 232, 0.2)'
            }}
          >
            <UserPlus size={18} /> Crear un profesional
          </button>
        </div>

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
              <tr>
                <td className="columna-fija"><strong>Juan Pérez</strong></td>
                <td>Kinesiología</td>
                <td>Mat. 12345</td>
                <td>341-555-0123</td>
                <td><span className="badge-status online" style={{ background: '#ebfbee', color: '#40c057', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Activo</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-edit" title="Editar" style={{ border: 'none', background: '#e1f0ff', color: '#00a8e8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Pencil size={14} /></button>
                    <button className="btn-delete" title="Eliminar" style={{ border: 'none', background: '#fff1f1', color: '#e03131', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Trash size={14} /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Crear Nuevo Profesional"
      >
        <div id="modalNuevoProfesional">
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>Completá los datos para dar de alta un miembro.</p>
          <form className="modal-body" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="grupo-entrada">
                <label htmlFor="nombre" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Nombre y Apellido</label>
                <input type="text" id="nombre" placeholder="Ej: Dr. García" value={nuevoProfesional.nombre} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="dni" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>DNI</label>
                <input type="text" id="dni" placeholder="Sin puntos" value={nuevoProfesional.dni} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="especialidad" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Especialidad</label>
                <input type="text" id="especialidad" placeholder="Ej: Traumatología" value={nuevoProfesional.especialidad} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="matricula" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Nro Matrícula (Opcional)</label>
                <input type="text" id="matricula" placeholder="Ej: 12345/A" value={nuevoProfesional.matricula} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Email</label>
                <input type="email" id="email" placeholder="profesional@ejemplo.com" value={nuevoProfesional.email} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
              </div>
              <div className="grupo-entrada">
                <label htmlFor="telefono" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Teléfono de contacto</label>
                <input type="tel" id="telefono" placeholder="+54 9 ..." value={nuevoProfesional.telefono} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
              </div>
            </div>
            
            <div className="pie-formulario" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>
                <X size={18} /> Cancelar
              </button>
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#40c057', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                <Save size={18} /> Registrar Profesional
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Profesionales;
