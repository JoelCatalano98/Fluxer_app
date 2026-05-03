
import { OctagonAlert, Eye, Banknote } from 'lucide-react'; // Cambié CashStack por Banknote
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';

const Morosos = () => {
  return (
    <div className="main-content">
      <section id="content-header" style={{ minHeight: '200px', height: '220px' }}>
        <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Gestión de Clientes morosos</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Controlá los clientes con pagos atrasados</p>
        <img src="/img/welcome-background.png" alt="Fondo" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
      </section>

      <div style={{ padding: '10px 5px' }}>
        <div className="header-planes-abonos" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
          <div>
            <h1 style={{ color: '#333', margin: 0, fontSize: '2rem' }}>Clientes Morosos</h1>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}>Listado de socios con pagos pendientes y atrasos.</p>
          </div>
          <div className="badge-debt" style={{ background: '#fff5f5', color: '#e03131', border: '1px solid #ffa8a8', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <OctagonAlert size={20} /> Total Deuda: $45.200
          </div>
        </div>

        <div className="contenedor-scroll">
          <table className="tabla-cronograma">
            <thead>
              <tr>
                <th>Cod. Cliente</th>
                <th className="columna-fija">Nombre Cliente</th>
                <th>Deuda</th>
                <th>Días de Atraso</th>
                <th>Último Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr className="fila-moroso">
                <td>#045</td>
                <td className="columna-fija"><strong>Carlos Méndez</strong></td>
                <td><span style={{ color: '#e03131', fontWeight: 600 }}>$12.500</span></td>
                <td><span className="etiqueta-deuda" style={{ background: '#fff5f5', color: '#e03131', padding: '4px 8px', borderRadius: '4px' }}>15 días</span></td>
                <td>10/03/2026</td>
                <td>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-help" title="Ver Detalle" style={{ border: 'none', background: '#e1f0ff', color: '#00a8e8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}><Eye size={14} /></button>
                    {/* Cambié el <i> por el componente Banknote de Lucide */}
                    <button className="btn-help" title="Registrar Pago" style={{ border: 'none', background: '#ebfbee', color: '#40c057', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                      <Banknote size={14} />
                    </button>
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

export default Morosos;