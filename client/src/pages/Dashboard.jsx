import { Users, UserCheck, CircleAlert } from 'lucide-react';
import '../styles/style.css';

const Dashboard = () => {
  return (
    <div className="main-content">
      <section id="content-header" style={{ minHeight: '400px', height: '400px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2, padding: '40px' }}>
          <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0, fontSize: '2.5rem' }}>Panel de Control</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0', fontSize: '1.2rem' }}>Bienvenido a Fluxer - Gestión de Gimnasio</p>
        </div>
        <img 
          src="/img/welcome-background.png" 
          alt="Fondo" 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            zIndex: 1 
          }} 
        />
      </section>
      
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', padding: '30px' }}>
        <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Users size={48} color="#00a8e8" />
          <div>
            <span className="stat" style={{ fontSize: '1.8rem', fontWeight: '700', display: 'block' }}>120</span>
            <h3 style={{ margin: 0, color: '#666', fontSize: '1rem' }}>Socios Activos</h3>
          </div>
        </div>

        <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <UserCheck size={48} color="#00a8e8" />
          <div>
            <span className="stat" style={{ fontSize: '1.8rem', fontWeight: '700', display: 'block' }}>15</span>
            <h3 style={{ margin: 0, color: '#666', fontSize: '1rem' }}>Nuevos (Mes)</h3>
          </div>
        </div>

        <div className="card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <CircleAlert size={48} color="#e03131" />
          <div>
            <span className="stat" style={{ fontSize: '1.8rem', fontWeight: '700', display: 'block' }}>8</span>
            <h3 style={{ margin: 0, color: '#666', fontSize: '1rem' }}>Morosos</h3>
          </div>
        </div>
      </div>

      <div className="recent-activity" style={{ marginTop: '20px', padding: '0 30px 40px 30px' }}>
        <h2 style={{ color: '#333', marginBottom: '20px', fontSize: '1.5rem' }}>Actividad Reciente</h2>
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Socio</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Actividad</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Hora</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px' }}>Joel Silva</td>
                <td style={{ padding: '15px' }}>Ingreso Sala Musculación</td>
                <td style={{ padding: '15px' }}>08:15 AM</td>
                <td style={{ padding: '15px' }}><span className="badge badge-success" style={{ background: '#d3f9d8', color: '#2b8a3e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>OK</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px' }}>Tomás Silva</td>
                <td style={{ padding: '15px' }}>Pago Mensualidad</td>
                <td style={{ padding: '15px' }}>09:30 AM</td>
                <td style={{ padding: '15px' }}><span className="badge badge-success" style={{ background: '#d3f9d8', color: '#2b8a3e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>Pagado</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;