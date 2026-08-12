import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Loader2, AlertTriangle, Calendar, FileText } from 'lucide-react';
import ComprobanteGenerador from '../components/ComprobanteGenerador';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';

const formatARS = (amount) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const HistoricoSueldos = () => {
    const [liquidaciones, setLiquidaciones] = useState([]);
    const [profesionales, setProfesionales] = useState([]);
    const [filtroProf, setFiltroProf] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comprobanteModal, setComprobanteModal] = useState({ open: false, tipo: '', datos: null });

    const fetchLiquidaciones = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {};
            if (filtroProf) params.profesionalId = filtroProf;
            
            const res = await api.get('/api/liquidaciones', { params });
            const data = res.data?.data || [];
            
            // Si el backend no lo ordenó (el prompt dice que sí lo devuelve ordenado,
            // pero para estar seguros no hacemos nada o lo dejamos como viene).
            setLiquidaciones(data);

            // Obtener lista única de profesionales de las liquidaciones para el filtro,
            // o idealmente llamar al endpoint de profesionales. Llamamos al endpoint de profesionales.
            if (profesionales.length === 0) {
                const resProf = await api.get('/api/profesionales');
                setProfesionales(resProf.data?.data || []);
            }

        } catch (err) {
            console.error('Error al cargar histórico:', err);
            setError(err.response?.data?.message || err.message || 'Error de servidor al cargar histórico');
        } finally {
            setLoading(false);
        }
    }, [filtroProf, profesionales.length]);

    useEffect(() => {
        fetchLiquidaciones();
    }, [fetchLiquidaciones]);

    return (
        <div style={{ padding: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h1 style={{ color: '#333', margin: 0, fontSize: '2rem' }}>Historial de Liquidaciones</h1>
                    <p style={{ color: '#666', margin: '5px 0 0 0' }}>Registro de sueldos pagados a profesionales.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontWeight: 'bold', color: '#555' }}>Filtrar por Profesional:</label>
                    <select 
                        value={filtroProf} 
                        onChange={(e) => setFiltroProf(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
                    >
                        <option value="">Todos</option>
                        {profesionales.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div style={{ backgroundColor: '#fff1f1', color: '#e03131', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="contenedor-scroll">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="columna-fija" style={{ textAlign: 'left' }}>Profesional</th>
                            <th style={{ textAlign: 'center' }}>Período</th>
                            <th style={{ textAlign: 'center' }}>Clases Semanales</th>
                            <th style={{ textAlign: 'right' }}>Monto</th>
                            <th style={{ textAlign: 'center' }}>Método de Pago</th>
                            <th style={{ textAlign: 'center' }}>Fecha de Pago</th>
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-blue)', width: '32px', height: '32px' }} />
                                    <p style={{ marginTop: '10px', color: '#666' }}>Cargando historial...</p>
                                </td>
                            </tr>
                        ) : liquidaciones.length > 0 ? (
                            liquidaciones.map(liq => (
                                <tr key={liq.id}>
                                    <td className="columna-fija">
                                        <strong>{liq.profesional?.nombre} {liq.profesional?.apellido}</strong>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#4b5563' }}>
                                        {liq.periodo}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {liq.clasesSemanales}
                                    </td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
                                        {formatARS(liq.montoTotal)}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{ 
                                            backgroundColor: liq.metodoPago === 'EFECTIVO' ? '#dcfce7' : '#e0e7ff', 
                                            color: liq.metodoPago === 'EFECTIVO' ? '#166534' : '#3730a3',
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold'
                                        }}>
                                            {liq.metodoPago}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                            <Calendar size={14} />
                                            {formatDate(liq.fechaPago)}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => setComprobanteModal({
                                                open: true,
                                                tipo: 'profesional',
                                                datos: {
                                                    nombre: `${liq.profesional?.nombre || ''} ${liq.profesional?.apellido || ''}`.trim(),
                                                    documento: liq.profesional?.dni || '',
                                                    monto: liq.montoTotal,
                                                    concepto: `Liquidación de Sueldo - Período ${liq.periodo}`,
                                                    fecha: liq.fechaPago,
                                                    medioPago: liq.metodoPago
                                                }
                                            })}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #7dd3fc',
                                                padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                                                fontWeight: '600', fontSize: '0.8rem', transition: 'all 0.2s'
                                            }}
                                        >
                                            <FileText size={14} /> Comprobante
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                                    No hay liquidaciones registradas para este filtro.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <ComprobanteGenerador
                isOpen={comprobanteModal.open}
                onClose={() => setComprobanteModal({ open: false, tipo: '', datos: null })}
                tipo={comprobanteModal.tipo}
                datosIniciales={comprobanteModal.datos}
            />
        </div>
    );
};

export default HistoricoSueldos;
