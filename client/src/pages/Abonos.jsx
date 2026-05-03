import { CirclePlus, Pencil, Trash } from 'lucide-react';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';

const Abonos = () => {
  return (
    <div className="main-content">
      <section id="content-header" style={{ minHeight: '200px', height: '250px' }}>
        <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Gestión de Planes</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Gestioná y creá cada plan necesario</p>
        <img src="/img/welcome-background.png" alt="Fondo" style={{ height: '85%', width: '100%', objectFit: 'cover' }} />
      </section>

      <div style={{ padding: '0 15px' }}>
        <div className="header-planes-abonos" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
          <div>
            <h1 style={{ color: '#333', margin: 0, fontSize: '2rem' }}>Abonos y Planes</h1>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}>Configuración de membresías y paquetes de servicios.</p>
          </div>
          <button className="btn-primary" style={{ width: 'auto', height: 'auto', padding: '12px 25px' }}>
            <CirclePlus size={18} style={{ marginRight: '8px' }} /> Nuevo Plan
          </button>
        </div>

        <div className="contenedor-scroll">
          <table className="tabla-cronograma">
            <thead>
              <tr>
                <th className="columna-fija">Código</th>
                <th>Nombre del Plan</th>
                <th>Precio</th>
                <th>Observaciones</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="columna-fija">#001</td>
                <td><strong>Plan Gim 1</strong></td>
                <td>$35.000 x mes</td>
                <td>Paquete básico de 3 clases semanales de 1,5 horas.</td>
                <td><span className="badge-status online" style={{ background: '#ebfbee', color: '#40c057', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Activo</span></td>
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
      </div>
    </div>
  );
};

export default Abonos;
