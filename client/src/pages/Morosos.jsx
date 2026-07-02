import { useState, useEffect, useCallback } from 'react';
import { OctagonAlert, Eye, Banknote, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';
import '../styles/clientes/morosos.css';

const Morosos = () => {
  const [morosos, setMorosos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMorosos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/clientes?filtro=morosos');
      if (res.data.success) {
        setMorosos(res.data.data.clientes);
      } else {
        throw new Error(res.data.message || 'Error al obtener morosos');
      }
    } catch (err) {
      console.error('Error fetchMorosos:', err);
      setError('Error al cargar la lista de morosos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMorosos();
  }, [fetchMorosos]);

  const handleTogglePago = async (id, estadoActual) => {
    try {
      const nuevoEstado = estadoActual === 'MOROSO' ? 'ALDIA' : 'MOROSO';
      const res = await api.patch(`/api/clientes/${id}/estado-pago`, { estado_pago: nuevoEstado });
      
      if (res.data.success) {
        if (nuevoEstado === 'ALDIA') {
          setMorosos(prev => prev.filter(m => m.id !== id));
          alert('¡Estado de pago actualizado! El cliente ya no figura como moroso.');
        } else {
          setMorosos(prev => prev.map(m => m.id === id ? { ...m, estado_pago: nuevoEstado } : m));
        }
      }
    } catch (err) {
      console.error('Error handleTogglePago:', err);
      alert('Error al actualizar el estado de pago: ' + (err.response?.data?.message || err.message));
    }
  };

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
            <OctagonAlert size={20} /> Total Morosos: {morosos.length}
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fff1f1', color: '#e03131', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="contenedor-scroll">
          <table className="tabla-cronograma">
            <thead>
              <tr>
                <th>Código Socio</th>
                <th className="columna-fija">Nombre Cliente</th>
                <th>Plan</th>
                <th>Estado Pago</th>
                <th>Estado Cliente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-blue)' }} />
                    <p style={{ marginTop: '10px', color: '#666' }}>Cargando morosos...</p>
                  </td>
                </tr>
              ) : morosos.length > 0 ? (
                morosos.map((moroso) => (
                  <tr key={moroso.id} className="fila-moroso">
                    <td>{moroso.codigo_socio || 'N/A'}</td>
                    <td className="columna-fija"><strong>{moroso.nombre} {moroso.apellido}</strong></td>
                    <td>{moroso.plan?.nombre || 'Sin Plan'}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#fff1f1', color: '#e03131', border: '1px solid #ffc9c9' }}>
                        {moroso.estado_pago}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${moroso.estado_cliente === 'ACTIVO' ? 'badge-success-light' : ''}`} style={moroso.estado_cliente !== 'ACTIVO' ? { backgroundColor: '#eee', color: '#666' } : {}}>
                        {moroso.estado_cliente}
                      </span>
                    </td>
                    <td>
                      <div className="acciones-flex">
                        <button 
                          className="btn-accion-moroso btn-pago" 
                          title="Marcar como Al Día"
                          onClick={() => handleTogglePago(moroso.id, moroso.estado_pago)}
                          style={{ backgroundColor: '#e6ffed', color: '#28a745', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button className="btn-accion-moroso btn-detalle" title="Ver Detalle" style={{ cursor: 'pointer' }}>
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No hay clientes morosos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Morosos;
