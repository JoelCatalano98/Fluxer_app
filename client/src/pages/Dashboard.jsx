import { useState, useEffect } from 'react';
import { Users, UserCheck, DollarSign, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import '../styles/style.css';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rango, setRango] = useState('semanal');
  const { hasPermission } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/dashboard?rango=${rango}`);
        if (res.data.success) {
          setMetrics(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [rango]);

  const PIE_COLORS = ['#00a8e8', '#ff7878', '#4caf50', '#ff9800', '#9c27b0', '#607d8b'];

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(value);
  };

  const renderLoading = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '200px' }}>
      <span style={{ color: '#aaa' }}>Cargando datos...</span>
    </div>
  );

  return (
    <div className="main-content">
      {/* Encabezado con imagen de fondo */}
      <PageHeader
        title="Panel de Control"
        subtitle="Métricas principales y estado del gimnasio."
        image="/img/welcome-background.png"
      />
      
      {/* Filtro Temporal */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <div className="range-toggle-container">
          <button 
            className={`range-btn ${rango === 'semanal' ? 'active' : ''}`}
            onClick={() => setRango('semanal')}
          >
            Semana
          </button>
          <button 
            className={`range-btn ${rango === 'mensual' ? 'active' : ''}`}
            onClick={() => setRango('mensual')}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Grilla de estadísticas */}
      <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <Link to="/clientes-totales" className="stat-card clickable-card">
          <Users size={48} color="#00a8e8" />
          <div className="stat-content">
            <span className="stat-value">{metrics?.kpis.totalSocios || 0}</span>
            <h3 className="stat-label">Clientes Activos</h3>
          </div>
        </Link>

        <Link to="/turnos" className="stat-card clickable-card">
          <UserCheck size={48} color="#00a8e8" />
          <div className="stat-content">
            <span className="stat-value">{metrics?.kpis.turnosSemana || 0}</span>
            <h3 className="stat-label">
              {rango === 'semanal' ? 'Turnos de la Semana' : 'Turnos del Mes'}
            </h3>
          </div>
        </Link>

        {hasPermission('permisoFinanzas') ? (
          <Link to="/gestion-planes" className="stat-card clickable-card">
            <DollarSign size={48} color="#00a8e8" />
            <div className="stat-content">
              <span className="stat-value" style={{ fontSize: '1.6rem' }}>
                {formatCurrency(metrics?.kpis.ingresosProyectados || 0)}
              </span>
              <h3 className="stat-label">Ingresos Proyectados</h3>
            </div>
          </Link>
        ) : (
          <div className="stat-card" style={{ opacity: 0.6 }}>
            <Lock size={48} color="#666" />
            <div className="stat-content">
              <span className="stat-value" style={{ fontSize: '1.2rem', color: '#666' }}>Restringido</span>
              <h3 className="stat-label">Finanzas Privadas</h3>
            </div>
          </div>
        )}
      </div>

      {/* Sección de Gráficos (Rediseño 3 Columnas/Filas) */}
      <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginTop: '30px' }}>
        
        {/* Gráfico 1: Clientes por Disciplina (BarChart) */}
        <div className="chart-card">
          <h3 className="chart-title">Crecimiento por Disciplina</h3>
          <div style={{ width: '100%', height: 300 }}>
            {loading ? renderLoading() : (
              <ResponsiveContainer>
                <BarChart
                  data={metrics?.clientesPorDisciplina || []}
                  margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33333b" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#aaa" 
                    tick={{ fill: '#aaa', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#aaa" 
                    tick={{ fill: '#aaa', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#2a2a33' }}
                    contentStyle={{ backgroundColor: '#1a1a1f', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar 
                    dataKey="cantidad" 
                    fill="#00a8e8" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30}
                    name="Clientes"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico 2: Ingresos por Plan (PieChart) */}
        {hasPermission('permisoFinanzas') ? (
          <div className="chart-card">
            <h3 className="chart-title">Distribución de Ingresos por Plan</h3>
            <div style={{ width: '100%', height: 300 }}>
              {loading ? renderLoading() : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={metrics?.ingresosPorPlan || []}
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="ingresos"
                      stroke="none"
                    >
                      {(metrics?.ingresosPorPlan || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1f', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        ) : (
          <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
            <Lock size={48} color="#666" style={{ marginBottom: '15px' }} />
            <h3 style={{ color: '#666', margin: 0 }}>Distribución de Ingresos Restringida</h3>
          </div>
        )}

        {/* Gráfico 3: Horarios Populares (BarChart) */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="chart-title">Horarios Más Usados ({rango === 'semanal' ? 'Semana' : 'Mes'})</h3>
          <div style={{ width: '100%', height: 350 }}>
            {loading ? renderLoading() : (
              <ResponsiveContainer>
                <BarChart
                  data={metrics?.horariosPopulares || []}
                  margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33333b" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#aaa" 
                    tick={{ fill: '#aaa', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#aaa" 
                    tick={{ fill: '#aaa', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#2a2a33' }}
                    contentStyle={{ backgroundColor: '#1a1a1f', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => [value, 'Turnos']}
                  />
                  <Bar 
                    dataKey="turnos" 
                    fill="#333639" 
                    stroke="#5c5f66"
                    strokeWidth={1}
                    radius={[4, 4, 0, 0]} 
                    barSize={45}
                    name="Asistencias"
                  >
                    {/* Reemplazamos el color de barra estándar por un tono grafito/acento sutil según requerimiento */}
                    {(metrics?.horariosPopulares || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#00a8e8' : '#333639'} /> // El primero resalta
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Estilos inyectados específicos para Dashboard */}
      <style dangerouslySetInnerHTML={{ __html: `
        .clickable-card {
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        
        .clickable-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 168, 232, 0.15);
          border-color: #00a8e8 !important;
        }

        .range-toggle-container {
          display: inline-flex;
          background-color: #202026;
          border-radius: 8px;
          border: 1px solid #2a2a33;
          padding: 4px;
        }

        .range-btn {
          background: transparent;
          border: none;
          color: #aaa;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .range-btn:hover {
          color: #fff;
        }

        .range-btn.active {
          background-color: #00a8e8;
          color: #fff;
        }

        .chart-card {
          background-color: #202026;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #2a2a33;
        }

        .chart-title {
          color: #ffffff;
          margin-bottom: 20px;
          font-size: 1.15rem;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .charts-container {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
};

export default Dashboard;
