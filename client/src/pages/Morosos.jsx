
import { OctagonAlert, Eye, Banknote } from 'lucide-react'; // Cambié CashStack por Banknote
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';
import '../styles/clientes/morosos.css';

const Morosos = () => {
  return (
    <div className="main-content">
      <section id="content-header" className="morosos-header">
        <div className="header-info-container">
          <h1 id="main-title">Gestión de Clientes morosos</h1>
          <p>Controlá los clientes con pagos atrasados</p>
        </div>
        <img src="/img/welcome-background.png" alt="Fondo" className="header-bg-img" />
      </section>

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
              <tr className="fila-moroso">
                <td>#045</td>
                <td className="columna-fija"><strong>Carlos Méndez</strong></td>
                <td><span className="deuda-monto">$12.500</span></td>
                <td><span className="etiqueta-deuda">15 días</span></td>
                <td>10/03/2026</td>
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
              <tr className="fila-moroso">
                <td>#045</td>
                <td className="columna-fija"><strong>Carlos Méndez</strong></td>
                <td><span className="deuda-monto">$12.500</span></td>
                <td><span className="etiqueta-deuda">15 días</span></td>
                <td>10/03/2026</td>
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
              <tr className="fila-moroso">
                <td>#045</td>
                <td className="columna-fija"><strong>Carlos Méndez</strong></td>
                <td><span className="deuda-monto">$12.500</span></td>
                <td><span className="etiqueta-deuda">15 días</span></td>
                <td>10/03/2026</td>
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
              <tr className="fila-moroso">
                <td>#045</td>
                <td className="columna-fija"><strong>Carlos Méndez</strong></td>
                <td><span className="deuda-monto">$12.500</span></td>
                <td><span className="etiqueta-deuda">15 días</span></td>
                <td>10/03/2026</td>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Morosos;