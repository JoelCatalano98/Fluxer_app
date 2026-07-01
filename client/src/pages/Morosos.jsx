
import { OctagonAlert, Eye, Banknote } from 'lucide-react'; // Cambié CashStack por Banknote
import PageHeader from '../components/PageHeader';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';
import '../styles/clientes/morosos.css';

const morosos = [
  { id: 'moroso-1', codigo: '#045', nombre: 'Carlos Méndez', deuda: '$12.500', atraso: '15 días', ultimoPago: '10/03/2026' },
  { id: 'moroso-2', codigo: '#045', nombre: 'Carlos Méndez', deuda: '$12.500', atraso: '15 días', ultimoPago: '10/03/2026' },
  { id: 'moroso-3', codigo: '#045', nombre: 'Carlos Méndez', deuda: '$12.500', atraso: '15 días', ultimoPago: '10/03/2026' },
  { id: 'moroso-4', codigo: '#045', nombre: 'Carlos Méndez', deuda: '$12.500', atraso: '15 días', ultimoPago: '10/03/2026' },
];

const Morosos = () => {
  return (
    <div className="main-content">
      <PageHeader
        title="Gestión de Clientes morosos"
        subtitle="Controlá los clientes con pagos atrasados"
        image="/img/welcome-background.png"
      />

      <div className="morosos-main-container">
        <div className="morosos-list-header">
          <div className="morosos-title-section">
            <h1>Clientes Morosos</h1>
            <p>Listado de socios con pagos pendientes y atrasos.</p>
          </div>
          <div className="badge-debt">
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
              {morosos.map((moroso) => (
                <tr key={moroso.id} className="fila-moroso">
                  <td>{moroso.codigo}</td>
                  <td className="columna-fija"><strong>{moroso.nombre}</strong></td>
                  <td><span className="deuda-monto">{moroso.deuda}</span></td>
                  <td><span className="etiqueta-deuda">{moroso.atraso}</span></td>
                  <td>{moroso.ultimoPago}</td>
                  <td>
                    <div className="acciones-flex">
                      <button className="btn-accion-moroso btn-detalle" title="Ver Detalle">
                        <Eye size={14} />
                      </button>
                      <button className="btn-accion-moroso btn-pago" title="Registrar Pago">
                        <Banknote size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Morosos;
