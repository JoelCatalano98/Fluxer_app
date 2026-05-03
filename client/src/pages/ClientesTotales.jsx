import { Pencil, Trash } from 'lucide-react';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';

const ClientesTotales = () => {
  return (
    <div className="main-content">
      <section id="content-header" style={{ minHeight: '200px', height: '250px' }}>
        <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Gestión de Clientes</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Verifica el total de tus Clientes</p>
        <img src="/img/welcome-background.png" alt="Fondo" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
      </section>

      <div style={{ padding: '20px 5px' }}>
        <div style={{ marginBottom: '25px' }}>
          <h1 style={{ color: '#333', margin: 0, fontSize: '2rem' }}>Clientes Totales</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>Listado completo de socios activos en el sistema.</p>
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
              <tr>
                <td className="columna-fija">#001</td>
                <td><strong>Joel Silva</strong></td>
                <td>12.345.678</td>
                <td>341-555-0123</td>
                <td><span className="etiqueta-plan" style={{ background: '#e1f0ff', color: '#00a8e8', padding: '4px 8px', borderRadius: '4px' }}>Premium</span></td>
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

export default ClientesTotales;
