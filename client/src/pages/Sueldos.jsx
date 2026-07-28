import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/style.css';

const Sueldos = () => {
    const [liquidacion, setLiquidacion] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLiquidacion = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/sueldos/liquidacion');
            if (res.data.success) {
                setLiquidacion(res.data.data);
            } else {
                setError('Error al obtener liquidación');
            }
        } catch (err) {
            setError('Error de servidor al cargar liquidación');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiquidacion();
    }, []);

    const handleTarifaChange = async (id, nuevaTarifa) => {
        const val = parseFloat(nuevaTarifa);
        if (isNaN(val)) return;

        try {
            await api.put(`/api/profesionales/${id}/tarifa`, { tarifaPorClase: val });
            // Recalcular fila entera o refetch
            fetchLiquidacion();
        } catch (err) {
            console.error('Error al actualizar tarifa', err);
            alert('Error al actualizar tarifa');
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Cargando liquidación...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px', backgroundColor: '#fff', minHeight: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>Liquidación de Sueldos</h2>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-400" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #9ca3af' }}>
                    <thead style={{ backgroundColor: '#f3f4f6' }}>
                        <tr>
                            <th className="p-2 border border-gray-300" style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'left' }}>Profesional</th>
                            <th className="p-2 border border-gray-300" style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'left' }}>DNI</th>
                            <th className="p-2 border border-gray-300" style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>Tarifa ($)</th>
                            <th className="p-2 border border-gray-300" style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>Clases Sem.</th>
                            <th className="p-2 border border-gray-300" style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>Proyección Mensual</th>
                            <th className="p-2 border border-gray-300" style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>Total a Pagar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {liquidacion.map((item, index) => (
                            <tr key={item.id} className="even:bg-gray-50" style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                <td className="p-2 border border-gray-300" style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                                    {item.nombre} {item.apellido}
                                </td>
                                <td className="p-2 border border-gray-300" style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                                    {item.dni}
                                </td>
                                <td className="p-2 border border-gray-300 font-mono text-right" style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', textAlign: 'right' }}>
                                    <input 
                                        type="number" 
                                        defaultValue={item.tarifaPorClase} 
                                        onBlur={(e) => handleTarifaChange(item.id, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.target.blur();
                                            }
                                        }}
                                        className="border-none bg-transparent w-full text-right focus:ring-1 focus:ring-blue-500"
                                        style={{ border: 'none', backgroundColor: 'transparent', width: '100%', textAlign: 'right', outline: 'none' }}
                                    />
                                </td>
                                <td className="p-2 border border-gray-300 font-mono text-right" style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', textAlign: 'right' }}>
                                    {item.cantidadHorarios}
                                </td>
                                <td className="p-2 border border-gray-300 font-mono text-right" style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', textAlign: 'right' }}>
                                    {item.clasesMensuales}
                                </td>
                                <td className="p-2 border border-gray-300 font-mono text-right font-bold" style={{ padding: '8px', border: '1px solid #d1d5db', fontFamily: 'monospace', textAlign: 'right', fontWeight: 'bold' }}>
                                    ${item.totalAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                        {liquidacion.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-2 border border-gray-300 text-center" style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                                    No hay profesionales activos
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Sueldos;
