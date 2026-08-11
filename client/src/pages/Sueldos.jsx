import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { RefreshCw, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';

const formatARS = (amount) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

const Sueldos = () => {
    const [sueldos, setSueldos] = useState([]);
    const [categoriasAmbiguas, setCategoriasAmbiguas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchSueldos = useCallback(async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) {
                setIsRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);
            
            const res = await api.get('/api/sueldos');
            const responseData = res.data;
            
            if (responseData.sueldos) {
                setSueldos(responseData.sueldos);
                setCategoriasAmbiguas(responseData.categoriasAmbiguas || []);
            } else {
                throw new Error('Formato de respuesta inesperado');
            }
        } catch (err) {
            console.error('Error al cargar sueldos:', err);
            setError(err.response?.data?.message || err.message || 'Error de servidor al cargar liquidación');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchSueldos();
    }, [fetchSueldos]);

    return (
        <div className="main-content">
            <PageHeader
                title="Liquidación de Sueldos"
                subtitle="Cálculo automático de honorarios de profesionales"
                image="/img/welcome-background.png"
            />

            <div style={{ padding: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 style={{ color: '#333', margin: 0, fontSize: '2rem' }}>Sueldos Estimados</h1>
                        <p style={{ color: '#666', margin: '5px 0 0 0' }}>Proyección en tiempo real basada en clases y tarifas.</p>
                    </div>
                    <button 
                        className="btn-primary" 
                        onClick={() => fetchSueldos(true)}
                        disabled={loading || isRefreshing}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '8px', cursor: (loading || isRefreshing) ? 'not-allowed' : 'pointer', opacity: (loading || isRefreshing) ? 0.7 : 1 }}
                    >
                        <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} /> Recalcular
                    </button>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#fff1f1', color: '#e03131', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {categoriasAmbiguas.length > 0 && (
                    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <AlertCircle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <h4 style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Categorías Ambiguas Detectadas</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>Las siguientes categorías matchean con más de un profesional activo y sus clases no han sido asignadas a nadie en este cálculo:</p>
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '0.9rem', fontWeight: '500' }}>
                                {categoriasAmbiguas.map((cat, idx) => (
                                    <li key={idx}>{cat}</li>
                                ))}
                            </ul>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>Por favor, renombrá la categoría o unificá los nombres de los profesionales para que el sistema pueda asignarlas correctamente.</p>
                        </div>
                    </div>
                )}

                <div className="contenedor-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="columna-fija" style={{ textAlign: 'left' }}>Profesional</th>
                                <th style={{ textAlign: 'left' }}>Especialidad / Disciplina</th>
                                <th style={{ textAlign: 'center' }}>Clases Semanales</th>
                                <th style={{ textAlign: 'right' }}>Tarifa por Clase</th>
                                <th style={{ textAlign: 'right' }}>Sueldo Mensual Estimado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && !isRefreshing ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                                        <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-blue)', width: '32px', height: '32px' }} />
                                        <p style={{ marginTop: '10px', color: '#666' }}>Calculando sueldos...</p>
                                    </td>
                                </tr>
                            ) : sueldos.length > 0 ? (
                                sueldos.map(prof => (
                                    <tr key={prof.id}>
                                        <td className="columna-fija">
                                            <strong>{prof.nombre} {prof.apellido}</strong>
                                        </td>
                                        <td style={{ color: '#6b7280' }}>
                                            {prof.especialidades?.length > 0 ? prof.especialidades.join(", ") : '-'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ 
                                                backgroundColor: prof.clasesSemanales > 0 ? '#e1f0ff' : '#f3f4f6', 
                                                color: prof.clasesSemanales > 0 ? 'var(--accent-blue)' : '#6b7280', 
                                                padding: '4px 12px', 
                                                borderRadius: '12px', 
                                                fontWeight: 'bold',
                                                fontSize: '0.95rem' 
                                            }}>
                                                {prof.clasesSemanales}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '1.05rem', color: '#4b5563' }}>
                                            {formatARS(prof.tarifaPorClase)}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold', color: prof.sueldoMensual > 0 ? '#10b981' : '#6b7280' }}>
                                            {formatARS(prof.sueldoMensual)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                                        No hay profesionales activos para liquidar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Sueldos;
