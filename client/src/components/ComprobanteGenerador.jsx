import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';

const ComprobanteGenerador = ({ isOpen, onClose, tipo, datosIniciales }) => {
    // tipo: 'socio' | 'profesional'
    // datosIniciales: { nombre, documento, monto, concepto, fecha, medioPago }

    const [form, setForm] = useState({
        nombreRazonSocial: '',
        documento: '',
        direccion: '',
        condicionIva: 'Consumidor Final',
        incluyeIva: false,
        concepto: '',
        monto: '',
        fecha: '',
        medioPago: ''
    });

    const [vistaPrevia, setVistaPrevia] = useState(false);

    useEffect(() => {
        if (isOpen && datosIniciales) {
            setForm({
                nombreRazonSocial: datosIniciales.nombre || '',
                documento: datosIniciales.documento || '',
                direccion: '',
                condicionIva: 'Consumidor Final',
                incluyeIva: false,
                concepto: datosIniciales.concepto || '',
                monto: datosIniciales.monto || '',
                fecha: datosIniciales.fecha ? new Date(datosIniciales.fecha).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR'),
                medioPago: datosIniciales.medioPago || ''
            });
            setVistaPrevia(false);
        }
    }, [isOpen, datosIniciales]);

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    const formatARS = (amount) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
    };

    if (vistaPrevia) {
        return (
            <div className="modal-overlay comprobante-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                <div className="comprobante-imprimir" style={{ backgroundColor: '#fff', width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '8px', padding: '0', position: 'relative' }}>
                    
                    {/* Botonera de acciones (se oculta al imprimir vía CSS en index.css) */}
                    <div className="no-print comprobante-actions-preview" style={{ padding: '15px 20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', gap: '10px', position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                        <button onClick={() => setVistaPrevia(false)} style={{ padding: '8px 15px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Volver a Editar</button>
                        <button onClick={handlePrint} style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                            <Printer size={18} /> Imprimir
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', marginLeft: '10px' }}><X size={24} /></button>
                    </div>

                    {/* Contenido del comprobante */}
                    <div className="comprobante-content">
                        <div className="comprobante-header">
                            <div>
                                <h1 className="comprobante-title" style={{ margin: 0, color: '#3b82f6', letterSpacing: '-1px' }}>FLUXER</h1>
                                <p style={{ margin: '5px 0 0 0', color: '#666' }}>Sistema de Gestión de Centros de Entrenamiento</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h2 className="comprobante-subtitle" style={{ margin: 0, color: '#333' }}>RECIBO {tipo === 'profesional' ? 'DE PAGO' : 'DE COBRO'}</h2>
                                <p className="comprobante-fecha" style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>Fecha: {form.fecha}</p>
                            </div>
                        </div>

                        <div className="comprobante-grid-2-preview">
                            <div>
                                <p style={{ margin: '0 0 8px 0' }}><strong style={{ color: '#4b5563' }}>Nombre / Razón Social:</strong> <br/> <span className="comprobante-nombre">{form.nombreRazonSocial}</span></p>
                                <p style={{ margin: '0 0 8px 0' }}><strong style={{ color: '#4b5563' }}>DNI / CUIT:</strong> <br/> {form.documento || '-'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 8px 0' }}><strong style={{ color: '#4b5563' }}>Dirección:</strong> <br/> {form.direccion || '-'}</p>
                                <p style={{ margin: '0 0 8px 0' }}><strong style={{ color: '#4b5563' }}>Condición frente al IVA:</strong> <br/> {form.condicionIva}</p>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Concepto</th>
                                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>Medio de Pago</th>
                                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #e5e7eb' }}>Importe</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{form.concepto}</td>
                                    <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{form.medioPago}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>{formatARS(form.monto)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="2" style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Total a {tipo === 'profesional' ? 'Pagar' : 'Cobrar'}:</td>
                                    <td className="comprobante-total" style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}>{formatARS(form.monto)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {form.incluyeIva && (
                            <p style={{ textAlign: 'right', color: '#666', fontSize: '0.9rem', fontStyle: 'italic' }}>* El importe total incluye IVA discriminado.</p>
                        )}

                        <div style={{ marginTop: '50px', padding: '20px', backgroundColor: '#fffbe8', border: '1px solid #fde047', borderRadius: '8px', textAlign: 'center' }}>
                            <p className="comprobante-importante" style={{ margin: 0, color: '#854d0e', fontWeight: 'bold' }}>
                                IMPORTANTE: Este comprobante es un recibo de {tipo === 'profesional' ? 'pago' : 'cobro'} interno y no constituye factura ni documento con validez fiscal.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Generar Comprobante</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'grid', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre / Razón Social</label>
                        <input type="text" value={form.nombreRazonSocial} onChange={e => setForm({...form, nombreRazonSocial: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div className="comprobante-grid-2">
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>DNI / CUIT</label>
                            <input type="text" value={form.documento} onChange={e => setForm({...form, documento: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Condición frente al IVA</label>
                            <select value={form.condicionIva} onChange={e => setForm({...form, condicionIva: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                                <option>Consumidor Final</option>
                                <option>Monotributista</option>
                                <option>Responsable Inscripto</option>
                                <option>Exento</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Dirección</label>
                        <input type="text" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={form.incluyeIva} onChange={e => setForm({...form, incluyeIva: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                            El monto incluye IVA discriminado
                        </label>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '5px 0' }} />
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Concepto</label>
                        <input type="text" value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div className="comprobante-grid-3">
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Monto ($)</label>
                            <input type="number" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fecha</label>
                            <input type="text" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Medio de Pago</label>
                            <input type="text" value={form.medioPago} onChange={e => setForm({...form, medioPago: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        </div>
                    </div>
                </div>

                <div className="comprobante-actions">
                    <button onClick={onClose} style={{ padding: '8px 15px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={() => setVistaPrevia(true)} style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Generar Vista Previa</button>
                </div>
            </div>
        </div>
    );
};

export default ComprobanteGenerador;
