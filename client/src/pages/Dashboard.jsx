import { Users, UserCheck, CircleAlert } from 'lucide-react';
import '../styles/style.css';

const Dashboard = () => {
  return (
    <div className="main-content">
      {/* Encabezado con imagen de fondo */}
      <section id="content-header" className="dashboard-header">
        <div className="header-overlay">
          <h1 className="header-title">Panel de Control</h1>
          <p className="header-subtitle">Bienvenido a Fluxer Gestion.</p>
        </div>
        <img 
          src="/img/welcome-background.png" 
          alt="Fondo" 
          className="header-bg-img"
        />
      </section>
      
      {/* Grilla de estadísticas */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <Users size={48} color="#00a8e8" />
          <div className="stat-content">
            <span className="stat-value">120</span>
            <h3 className="stat-label">Clientes Totales</h3>
          </div>
        </div>

        <div className="stat-card">
          <UserCheck size={48} color="#00a8e8" />
          <div className="stat-content">
            <span className="stat-value">15</span>
            <h3 className="stat-label">Turnos Hoy</h3>
          </div>
        </div>

        <div className="stat-card">
          <UserCheck size={48} color="#00a8e8" />
          <div className="stat-content">
            <span className="stat-value">15</span>
            <h3 className="stat-label">Ingreso (Mes)</h3>
          </div>
        </div>

        <div className="stat-card">
          <CircleAlert size={48} color="#e03131" />
          <div className="stat-content">
            <span className="stat-value">8</span>
            <h3 className="stat-label">Morosos</h3>
          </div>
        </div>
      </div>

      {/* Sección de Actividad Reciente */}
      <div className="recent-activity-section">
        <h2 className="activity-title">Actividad Reciente</h2>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr className="table-header-row">
                <th>Socio</th>
                <th>Actividad</th>
                <th>Hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-row">
                <td>Joel Silva</td>
                <td>Ingreso Sala Musculación</td>
                <td>08:15 AM</td>
                <td>
                  <span className="badge badge-success-light">OK</span>
                </td>
              </tr>
              <tr className="table-row">
                <td>Tomás Silva</td>
                <td>Pago Mensualidad</td>
                <td>09:30 AM</td>
                <td>
                  <span className="badge badge-success-light">Pagado</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
