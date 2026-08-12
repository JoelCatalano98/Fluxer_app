import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import api from '../services/api';
import { Loader2, Plus, Printer, Calendar as CalendarIcon, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import '../styles/style.css';
import '../styles/clientes/listados_gestion.css';

const formatARS = (amount) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

const formatDate = (dateString) => {
    // We add T12:00:00 to avoid timezone shift issues (rendering previous day)
    return new Date(dateString + 'T12:00:00').toLocaleDateString('es-AR');
};

const LibroDiario = () => {
    // defaults: mes actual
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [desde, setDesde] = useState(firstDay);
    const [hasta, setHasta] = useState(lastDay);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({
        tipo: 'INGRESO',
        monto: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0]
    });

    const fetchMovimientos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get('/api/movimientos-generales', {
                params: { desde, hasta }
            });
            setMovimientos(res.data?.data || []);
        } catch (err) {
            console.error(err);
            setError('Error al cargar los movimientos del libro diario');
        } finally {
            setLoading(false);
        }
    }, [desde, hasta]);

    useEffect(() => {
        fetchMovimientos();
    }, [fetchMovimientos]);

    const handleCrearMovimiento = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/movimientos-generales', form);
            setIsModalOpen(false);
            setForm({
                tipo: 'INGRESO',
                monto: '',
                descripcion: '',
                fecha: new Date().toISOString().split('T')[0]
            });
            fetchMovimientos();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al guardar el movimiento');
        }
    };

    const groupedMovimientos = useMemo(() => {
        const groups = {};
        movimientos.forEach(mov => {
            const dateStr = mov.fecha.split('T')[0];
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(mov);
        });
        
        // Sort descending by date
        return Object.keys(groups).sort((a,b) => b.localeCompare(a)).map(date => {
            const dayMovs = groups[date];
            const ingresos = dayMovs.filter(m => m.tipo === 'INGRESO').reduce((acc, m) => acc + m.monto, 0);
            const egresos = dayMovs.filter(m => m.tipo === 'EGRESO').reduce((acc, m) => acc + m.monto, 0);
            return {
                date,
                movimientos: dayMovs,
                ingresos,
                egresos,
                neto: ingresos - egresos
            };
        });
    }, [movimientos]);

    const totales = useMemo(() => {
        const ingresos = movimientos.filter(m => m.tipo === 'INGRESO').reduce((acc, m) => acc + m.monto, 0);
        const egresos = movimientos.filter(m => m.tipo === 'EGRESO').reduce((acc, m) => acc + m.monto, 0);
        return { ingresos, egresos, neto: ingresos - egresos };
    }, [movimientos]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="main-content libro-diario-imprimir">
            <div className="no-print">
                <PageHeader 
                    title="Libro Diario"
                    subtitle="Registro general de ingresos y egresos"
                    image="/img/welcome-background.png"
                />
            </div>

            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                
                {/* Cabecera y Filtros */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', width: '100%', maxWidth: '100%' }} className="libro-diario-filtros">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto' }}>
                            <label style={{ fontWeight: 'bold', color: '#555' }}>Desde:</label>
                            <input 
                                type="date" 
                                value={desde} 
                                onChange={(e) => setDesde(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', width: '100%' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto' }}>
                            <label style={{ fontWeight: 'bold', color: '#555' }}>Hasta:</label>
                            <input 
                                type="date" 
                                value={hasta} 
                                onChange={(e) => setHasta(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', width: '100%' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%' }} className="libro-diario-acciones">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#0ea5e9', color: '#fff', padding: '10px 15px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: '1 1 auto' }}
                        >
                            <Plus size={18} /> Agregar Movimiento
                        </button>
                        <button 
                            onClick={handlePrint}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#fff', color: '#475569', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold', cursor: 'pointer', flex: '1 1 auto' }}
                        >
                            <Printer size={18} /> Imprimir
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="no-print" style={{ backgroundColor: '#fff1f1', color: '#e03131', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Resumen Total */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #10b981', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Total Ingresos</div>
                        <div style={{ color: '#10b981', fontSize: '1.8rem', fontWeight: 'bold' }}>{formatARS(totales.ingresos)}</div>
                    </div>
                    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ef4444', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Total Egresos</div>
                        <div style={{ color: '#ef4444', fontSize: '1.8rem', fontWeight: 'bold' }}>{formatARS(totales.egresos)}</div>
                    </div>
                    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Ganancia Neta</div>
                        <div style={{ color: totales.neto >= 0 ? '#3b82f6' : '#ef4444', fontSize: '1.8rem', fontWeight: 'bold' }}>{formatARS(totales.neto)}</div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Loader2 className="animate-spin" size={32} style={{ color: '#0ea5e9', margin: '0 auto' }} />
                        <p style={{ color: '#64748b', marginTop: '10px' }}>Cargando movimientos...</p>
                    </div>
                ) : groupedMovimientos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '12px', color: '#64748b', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        No hay movimientos registrados en este período.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        {groupedMovimientos.map(group => (
                            <div key={group.date} style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                {/* Día Header */}
                                <div style={{ backgroundColor: '#f8fafc', padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                        <CalendarIcon size={20} color="#0ea5e9" />
                                        {formatDate(group.date)}
                                    </div>
                                    <div className="libro-diario-subtotales" style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', fontWeight: 'bold', flexWrap: 'wrap' }}>
                                        <span style={{ color: '#10b981' }}>+ {formatARS(group.ingresos)}</span>
                                        <span style={{ color: '#ef4444' }}>- {formatARS(group.egresos)}</span>
                                        <span style={{ color: group.neto >= 0 ? '#3b82f6' : '#ef4444', paddingLeft: '10px', borderLeft: '1px solid #cbd5e1' }}>Neto: {formatARS(group.neto)}</span>
                                    </div>
                                </div>
                                
                                {/* Tabla del Día */}
                                <div className="contenedor-scroll" style={{ borderRadius: 0, boxShadow: 'none' }}>
                                    <table className="data-table" style={{ margin: 0, minWidth: '600px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ backgroundColor: '#fff' }}>Descripción</th>
                                                <th style={{ backgroundColor: '#fff', textAlign: 'center' }}>Origen</th>
                                                <th style={{ backgroundColor: '#fff', textAlign: 'center' }}>Tipo</th>
                                                <th style={{ backgroundColor: '#fff', textAlign: 'right' }}>Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.movimientos.map(mov => (
                                                <tr key={mov.id}>
                                                    <td style={{ fontWeight: '500', color: '#334155' }}>{mov.descripcion}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {mov.origen === 'PAGO_CLIENTE' && <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>PAGO SOCIO</span>}
                                                        {mov.origen === 'LIQUIDACION_SUELDO' && <span style={{ backgroundColor: '#ffedd5', color: '#9a3412', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>SUELDOS</span>}
                                                        {mov.origen === 'MANUAL' && <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>MANUAL</span>}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: mov.tipo === 'INGRESO' ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                            {mov.tipo === 'INGRESO' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                            {mov.tipo}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.05rem', color: mov.tipo === 'INGRESO' ? '#10b981' : '#ef4444' }}>
                                                        {mov.tipo === 'INGRESO' ? '+' : '-'}{formatARS(mov.monto)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Nuevo Movimiento */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agregar Movimiento Manual">
                <form onSubmit={handleCrearMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem' }}>Tipo de Movimiento</label>
                        <select 
                            value={form.tipo} 
                            onChange={(e) => setForm({...form, tipo: e.target.value})}
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', fontFamily: 'inherit' }}
                            required
                        >
                            <option value="INGRESO">INGRESO</option>
                            <option value="EGRESO">EGRESO</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem' }}>Fecha</label>
                        <input 
                            type="date" 
                            value={form.fecha} 
                            onChange={(e) => setForm({...form, fecha: e.target.value})}
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', fontFamily: 'inherit' }}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem' }}>Monto ($)</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '10px', top: '10px', color: '#666' }}><DollarSign size={18} /></div>
                            <input 
                                type="number" 
                                step="0.01"
                                value={form.monto} 
                                onChange={(e) => setForm({...form, monto: e.target.value})}
                                style={{ padding: '10px 10px 10px 35px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', fontFamily: 'inherit' }}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem' }}>Descripción</label>
                        <input 
                            type="text" 
                            value={form.descripcion} 
                            onChange={(e) => setForm({...form, descripcion: e.target.value})}
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', fontFamily: 'inherit' }}
                            placeholder="Ej. Compra de insumos"
                            required
                        />
                    </div>
                    <div className="libro-diario-modal-acciones" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 15px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 'bold', color: '#555' }}>
                            Cancelar
                        </button>
                        <button type="submit" style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#0ea5e9', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                            Guardar Movimiento
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default LibroDiario;
