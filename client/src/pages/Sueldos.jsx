import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { RefreshCw, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';

const formatARS = (amount) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

const Sueldos = ({ isTab = false }) => {
    const [sueldos, setSueldos] = useState([]);
    const [categoriasAmbiguas, setCategoriasAmbiguas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Modal Pagar
    const [pagarModal, setPagarModal] = useState({ open: false, prof: null, metodo: 'EFECTIVO', notas: '' });
    const [pagando, setPagando] = useState(false);
    const [pagoError, setPagoError] = useState('');
    const [pagoSuccess, setPagoSuccess] = useState('');
    const [pagadosIds, setPagadosIds] = useState(new Set()); // Para ocultar el botón en la sesión actual


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

    const handlePagar = async () => {
        if (!pagarModal.prof) return;
        setPagando(true);
        setPagoError('');
        setPagoSuccess('');
        try {
            const now = new Date();
            const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const payload = {
                profesionalId: pagarModal.prof.id,
                periodo,
                clasesSemanales: pagarModal.prof.clasesSemanales,
                montoTotal: pagarModal.prof.sueldoMensual,
                metodoPago: pagarModal.metodo,
                notas: pagarModal.notas
            };
            await api.post('/api/liquidaciones', payload);
            setPagoSuccess(`Sueldo pagado con éxito a ${pagarModal.prof.nombre}`);
            setPagadosIds(prev => new Set(prev).add(pagarModal.prof.id));
            setTimeout(() => setPagarModal({ open: false, prof: null, metodo: 'EFECTIVO', notas: '' }), 1500);
        } catch (err) {
            setPagoError(err.response?.data?.message || 'Error al procesar el pago');
        } finally {
            setPagando(false);
        }
    };

    const content = (
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
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && !isRefreshing ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
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
                                        <td style={{ textAlign: 'center' }}>
                                            {!pagadosIds.has(prof.id) && prof.sueldoMensual > 0 && (
                                                <button
                                                    onClick={() => setPagarModal({ open: true, prof, metodo: 'EFECTIVO', notas: '' })}
                                                    style={{
                                                        backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px',
                                                        padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold'
                                                    }}
                                                >
                                                    Pagar
                                                </button>
                                            )}
                                            {pagadosIds.has(prof.id) && (
                                                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>✓ Pagado</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                                        No hay profesionales activos para liquidar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagarModal.open && pagarModal.prof && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
                            <h2 style={{ margin: '0 0 15px 0' }}>Liquidar Sueldo</h2>
                            <p style={{ margin: '0 0 10px 0' }}><strong>Profesional:</strong> {pagarModal.prof.nombre} {pagarModal.prof.apellido}</p>
                            <p style={{ margin: '0 0 10px 0' }}><strong>Período:</strong> {(() => {
                                const now = new Date();
                                return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                            })()}</p>
                            <p style={{ margin: '0 0 10px 0' }}><strong>Clases Semanales:</strong> {pagarModal.prof.clasesSemanales}</p>
                            <p style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}><strong>Total a Pagar:</strong> {formatARS(pagarModal.prof.sueldoMensual)}</p>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Método de Pago</label>
                                <select 
                                    value={pagarModal.metodo} 
                                    onChange={(e) => setPagarModal({...pagarModal, metodo: e.target.value})}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Notas (opcional)</label>
                                <textarea 
                                    value={pagarModal.notas} 
                                    onChange={(e) => setPagarModal({...pagarModal, notas: e.target.value})}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            {pagoError && <div style={{ color: '#e03131', marginBottom: '15px' }}>{pagoError}</div>}
                            {pagoSuccess && <div style={{ color: '#10b981', marginBottom: '15px' }}>{pagoSuccess}</div>}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button onClick={() => setPagarModal({ open: false, prof: null, metodo: 'EFECTIVO', notas: '' })} style={{ padding: '8px 15px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }} disabled={pagando}>Cancelar</button>
                                <button onClick={handlePagar} style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }} disabled={pagando}>
                                    {pagando ? <Loader2 size={16} className="animate-spin"/> : null} Confirmar Pago
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );

    if (isTab) {
        return content;
    }

    return (
        <div className="main-content">
            <PageHeader
                title="Liquidación de Sueldos"
                subtitle="Cálculo automático de honorarios de profesionales"
                image="/img/welcome-background.png"
            />
            {content}
        </div>
    );
};

export default Sueldos;
