import { Pencil, Trash } from 'lucide-react';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';

const Profesionales = () => {
  return (
    <div className="main-content">
      <section id="content-header" style={{ minHeight: '200px', height: '250px' }}>
        <img src="/img/welcome-background.png" alt="Fondo" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
      </section>

      <div style={{ padding: '20px 5px' }}>
        <div style={{ marginBottom: '25px' }}>
          <h1 style={{ color: '#333', margin: 0, fontSize: '2rem' }}>Staff Profesional</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>Listado completo de médicos, técnicos y entrenadores del sistema.</p>
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
    </div>
  );
};

export default Profesionales;
