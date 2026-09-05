import { useState, useEffect } from 'react';
import { CirclePlus, CheckCircle, XCircle, AlertCircle, FileText, Undo2, CalendarCheck, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ComprobanteGenerador from '../components/ComprobanteGenerador';
import { FileText as FileTextIcon } from 'lucide-react'; // Rename to avoid conflict with FileText used elsewhere if any
import api from '../services/api';
import '../styles/style.css';
import '../styles/utilidades/configuracion_pagos.css';
import '../styles/utilidades/pagos.css';

const Pagos = ({ isTab = false }) => {
  const [pagos, setPagos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usarSaldo, setUsarSaldo] = useState(false);
  const [comprobanteModal, setComprobanteModal] = useState({ open: false, tipo: '', datos: null });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pagoToAnular, setPagoToAnular] = useState(null);
  const [searchTermCliente, setSearchTermCliente] = useState('');
  const [isPendientesModalOpen, setIsPendientesModalOpen] = useState(false);

  const clientesFiltrados = clientes.filter(c => {
    const searchStr = searchTermCliente.toLowerCase();
    return c.nombre.toLowerCase().includes(searchStr) || 
           c.apellido.toLowerCase().includes(searchStr) || 
           (c.dni_cuit && c.dni_cuit.includes(searchStr));
  });

  const [nuevoPago, setNuevoPago] = useState({
    clienteId: '',
    monto: '',
    metodoPago: 'EFECTIVO',
    concepto: 'Cuota Mensual Pase Libre',
    notas: ''
  });

  // Cliente seleccionado actualmente en el formulario
  const clienteSeleccionado = clientes.find(c => c.id === parseInt(nuevoPago.clienteId)) || null;
  const saldoDisponible = clienteSeleccionado ? parseFloat(clienteSeleccionado.saldo) || 0 : 0;
  const precioPlan = clienteSeleccionado?.plan?.precio ? parseFloat(clienteSeleccionado.plan.precio) : 0;
  const montoIngresado = parseFloat(nuevoPago.monto) || 0;

  // Cálculo dinámico de saldo a usar y efectivo final
  const saldoAplicado = usarSaldo ? Math.min(saldoDisponible, montoIngresado > 0 ? montoIngresado : precioPlan) : 0;
  const totalAPagarEfectivo = montoIngresado > 0 ? Math.max(0, montoIngresado - saldoAplicado) : Math.max(0, precioPlan - saldoAplicado);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resPagos, resClientes] = await Promise.all([
          api.get('/api/pagos'),
          api.get('/api/clientes?limit=1000')
        ]);
        if (resPagos.data?.success) {
          setPagos(resPagos.data.data);
        }
        if (resClientes.data?.success) {
          // Aseguramos capturar el array de clientes correctamente según la respuesta paginada o lista simple
          setClientes(resClientes.data.data.clientes || resClientes.data.data);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEstadoPago = async (id, nuevoEstado) => {
    try {
      if (nuevoEstado === 'ANULADO') {
        setPagoToAnular(id);
        return;
      }
      await executeEstadoPago(id, nuevoEstado);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Este pago ya ha sido procesado o no se puede modificar.");
    }
  };

  const executeEstadoPago = async (id, nuevoEstado) => {
    try {
      await api.patch(`/api/pagos/${id}/estado`, { estado: nuevoEstado });
      const resPagos = await api.get('/api/pagos');
      if (resPagos.data?.success) {
        setPagos(resPagos.data.data);
      }
      window.dispatchEvent(new Event('pagosUpdated'));
      if (nuevoEstado === 'ANULADO') {
        setSuccessMessage('Pago anulado correctamente. El cliente fue marcado como MOROSO.');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Este pago ya ha sido procesado o no se puede modificar.");
    } finally {
      if (nuevoEstado === 'ANULADO') {
        setPagoToAnular(null);
      }
    }
  };

  const confirmAnular = () => {
    if (pagoToAnular) {
      executeEstadoPago(pagoToAnular, 'ANULADO');
    }
  };

  const handleNewPagoChange = (e) => {
    const { id, value } = e.target;
    setNuevoPago(prev => ({ ...prev, [id]: value }));
    // Si cambia el cliente, resetear checkbox de saldo
    if (id === 'clienteId') {
      setUsarSaldo(false);
    }
  };

  const handleCreatePago = async (e) => {
    e.preventDefault();
    try {
      // Determinar el monto que realmente se abona en efectivo/medio de pago
      const montoTotal = montoIngresado > 0 ? montoIngresado : precioPlan;
      const montoEfectivoFinal = usarSaldo ? Math.max(0, montoTotal - saldoAplicado) : montoTotal;

      const payload = {
        clienteId: nuevoPago.clienteId,
        montoAbonado: montoEfectivoFinal,
        saldoUsado: saldoAplicado,
        metodoPago: nuevoPago.metodoPago,
        concepto: nuevoPago.concepto,
        notas: nuevoPago.notas,
        estado: 'APROBADO'
      };

      const res = await api.post('/api/pagos', payload);
      setIsModalOpen(false);
      setUsarSaldo(false);
      setNuevoPago({ clienteId: '', monto: '', metodoPago: 'EFECTIVO', concepto: 'Cuota Mensual Pase Libre', notas: '' });
      setSearchTermCliente('');
      
      // Refetch pagos y clientes (para actualizar saldos)
      const [resPagos, resClientes] = await Promise.all([
        api.get('/api/pagos'),
        api.get('/api/clientes?limit=1000')
      ]);
      if (resPagos.data?.success) setPagos(resPagos.data.data);
      if (resClientes.data?.success) setClientes(resClientes.data.data.clientes || resClientes.data.data);

      const msgSaldo = saldoAplicado > 0 ? ` (Se aplicaron $${saldoAplicado} de saldo a favor)` : '';
      setSuccessMessage(`Pago registrado con éxito${msgSaldo}`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Error al registrar el pago.");
    }
  };

  const pagosPendientes = pagos.filter(p => p.estado === 'PENDIENTE');
  const historialPagos = pagos.filter(p => p.estado !== 'PENDIENTE');

  if (loading) {
    return (
      <div className="main-content">
        <PageHeader title="Cargando..." subtitle="Por favor espera" image="/img/welcome-background.png" />
      </div>
    );
  }

  const content = (
    <>
      <div style={{ padding: '5px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Sección: Bandeja de Aprobaciones */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#333', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} color={pagosPendientes.length > 0 ? "#ff9800" : "#9ca3af"} /> Pagos Pendientes
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn-nuevo-pago" 
                  onClick={() => setIsPendientesModalOpen(true)} 
                  style={{ margin: 0, backgroundColor: '#f59e0b', color: '#fff' }}
                >
                  Ver Pendientes ({pagosPendientes.length})
                </button>
                <button className="btn-nuevo-pago" onClick={() => setIsModalOpen(true)} style={{ margin: 0 }}>
                  <CirclePlus size={18} /> Nuevo Pago Manual
                </button>
              </div>
            </div>
        </div>

        {/* Sección: Historial */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#333', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#3b82f6" /> Historial de Pagos
          </h2>
          
          <div className="contenedor-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="columna-fija" style={{ textAlign: 'left' }}>Cliente</th>
                  <th style={{ textAlign: 'center' }}>Fecha</th>
                  <th style={{ textAlign: 'left' }}>Concepto</th>
                  <th style={{ textAlign: 'center' }}>Método</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historialPagos.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>Aún no hay pagos registrados en el historial.</td>
                  </tr>
                ) : (
                  historialPagos.map(pago => (
                    <tr key={pago.id}>
                      <td className="columna-fija">
                        <strong>{pago.cliente?.nombre} {pago.cliente?.apellido}</strong>
                      </td>
                      <td style={{ textAlign: 'center', color: '#444' }}>{new Date(pago.fecha).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'left', color: '#444' }}>{pago.concepto}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                            backgroundColor: pago.metodoPago === 'EFECTIVO' ? '#dcfce7' : '#e0e7ff', 
                            color: pago.metodoPago === 'EFECTIVO' ? '#166534' : '#3730a3',
                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold'
                        }}>
                            {pago.metodoPago}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>${pago.monto}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '0.85rem', 
                          fontWeight: '600',
                          backgroundColor: pago.estado === 'APROBADO' ? '#d1fae5' : pago.estado === 'ANULADO' ? '#fef3c7' : '#fee2e2',
                          color: pago.estado === 'APROBADO' ? '#047857' : pago.estado === 'ANULADO' ? '#92400e' : '#b91c1c',
                          textDecoration: pago.estado === 'ANULADO' ? 'line-through' : 'none'
                        }}>
                          {pago.estado}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {pago.estado === 'APROBADO' && (
                          <button
                            onClick={() => handleEstadoPago(pago.id, 'ANULADO')}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d',
                              padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                              fontWeight: '600', fontSize: '0.8rem', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fde68a'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fef3c7'; }}
                          >
                            <Undo2 size={14} /> Anular
                          </button>
                        )}
                        {pago.estado === 'APROBADO' && (
                          <button
                            onClick={() => setComprobanteModal({
                              open: true,
                              tipo: 'socio',
                              datos: {
                                nombre: `${pago.cliente?.nombre || ''} ${pago.cliente?.apellido || ''}`.trim(),
                                documento: pago.cliente?.dni_cuit || '',
                                monto: pago.monto,
                                concepto: pago.concepto,
                                fecha: pago.fecha,
                                medioPago: pago.metodoPago
                              }
                            })}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #7dd3fc',
                              padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                              fontWeight: '600', fontSize: '0.8rem', transition: 'all 0.2s',
                              marginLeft: '5px'
                            }}
                          >
                            <FileText size={14} /> Comprobante
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Pagos Pendientes */}
      <Modal 
        isOpen={isPendientesModalOpen} 
        onClose={() => setIsPendientesModalOpen(false)} 
        title={`Pagos Pendientes (${pagosPendientes.length})`}
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
          {pagosPendientes.length === 0 ? (
            <p style={{ color: '#777', textAlign: 'center', padding: '20px 0' }}>No hay pagos pendientes de revisión.</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {pagosPendientes.map(pago => (
                <div key={pago.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <p style={{ margin: '0 0 5px 0', color: '#1f2937', fontSize: '1.05rem' }}>
                      <strong>{pago.cliente?.nombre} {pago.cliente?.apellido}</strong> informó un pago de <strong>${pago.monto}</strong> por <strong>{pago.metodoPago}</strong>.
                    </p>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Concepto: {pago.concepto} | Fecha: {new Date(pago.fecha).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleEstadoPago(pago.id, 'APROBADO')}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      <CheckCircle size={18} /> Aprobar
                    </button>
                    <button 
                      onClick={() => handleEstadoPago(pago.id, 'RECHAZADO')}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      <XCircle size={18} /> Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Nuevo Pago Manual */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registrar Pago Manual"
      >
        <form onSubmit={handleCreatePago} className="form-nuevo-pago">
          <div className="grid-formulario-pagos">
            <div className="grupo-campo grid-full-width">
              <label htmlFor="clienteId">Cliente</label>
              <input 
                type="text" 
                placeholder="Buscar por nombre, apellido o DNI..." 
                value={searchTermCliente}
                onChange={(e) => setSearchTermCliente(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px' }}
              />
              <select 
                id="clienteId" 
                value={nuevoPago.clienteId} 
                onChange={handleNewPagoChange} 
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              >
                <option value="">Seleccione un cliente...</option>
                {clientesFiltrados.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.apellido} ({c.dni_cuit})</option>
                ))}
              </select>
            </div>

            {/* Bloque de Saldo a Favor */}
            {clienteSeleccionado && saldoDisponible > 0 && (
              <div className="grid-full-width" style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '10px',
                padding: '14px 16px',
                margin: '4px 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ margin: '0 0 2px 0', fontWeight: '600', color: '#065f46', fontSize: '0.95rem' }}>
                      💰 Saldo a favor disponible: <span style={{ fontSize: '1.1rem' }}>${saldoDisponible.toFixed(2)}</span>
                    </p>
                    {precioPlan > 0 && (
                      <p style={{ margin: 0, color: '#047857', fontSize: '0.8rem', opacity: 0.85 }}>
                        Plan actual: ${precioPlan.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={usarSaldo}
                      onChange={(e) => setUsarSaldo(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: '600', color: '#065f46', fontSize: '0.9rem' }}>Aplicar saldo a favor</span>
                  </label>
                </div>

                {usarSaldo && (
                  <div style={{
                    marginTop: '12px',
                    backgroundColor: '#d1fae5',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#065f46' }}>
                      <span>Monto del plan/pago:</span>
                      <strong>${(montoIngresado > 0 ? montoIngresado : precioPlan).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#047857' }}>
                      <span>Saldo aplicado:</span>
                      <strong>- ${saldoAplicado.toFixed(2)}</strong>
                    </div>
                    <div style={{ borderTop: '1px dashed #a7f3d0', paddingTop: '6px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#064e3b', fontWeight: '700' }}>
                      <span>Total a pagar en efectivo:</span>
                      <span>${totalAPagarEfectivo.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grupo-campo">
              <label htmlFor="monto">Monto ($){usarSaldo && saldoAplicado > 0 ? ' — antes de descuento' : ''}</label>
              <input 
                type="number" 
                id="monto" 
                value={nuevoPago.monto} 
                onChange={handleNewPagoChange} 
                placeholder={precioPlan > 0 ? `Plan: $${precioPlan}` : 'Ej: 15000'}
                required={!usarSaldo || totalAPagarEfectivo > 0}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            </div>
            <div className="grupo-campo">
              <label htmlFor="metodoPago">Medio de Pago</label>
              <select 
                id="metodoPago" 
                value={nuevoPago.metodoPago} 
                onChange={handleNewPagoChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia / CBU</option>
                <option value="MERCADO_PAGO">Mercado Pago</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div className="grupo-campo grid-full-width">
              <label htmlFor="concepto">Concepto</label>
              <input 
                type="text" 
                id="concepto" 
                value={nuevoPago.concepto} 
                onChange={handleNewPagoChange} 
                placeholder="Ej: Pase Libre Mensual" 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            </div>
            <div className="grupo-campo grid-full-width">
              <label htmlFor="notas">Notas (Opcional)</label>
              <textarea 
                id="notas" 
                value={nuevoPago.notas} 
                onChange={handleNewPagoChange} 
                placeholder="Comentarios internos o mes cobrado..." 
                rows="2"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', resize: 'vertical' }}
              ></textarea>
            </div>
          </div>
          <div className="acciones-formulario-pagos" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn-modal-cancelar" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-modal-confirmar">Aprobar y Registrar</button>
          </div>
        </form>
      </Modal>

      <ComprobanteGenerador
        isOpen={comprobanteModal.open}
        onClose={() => setComprobanteModal({ open: false, tipo: '', datos: null })}
        tipo={comprobanteModal.tipo}
        datosIniciales={comprobanteModal.datos}
      />

      {/* Modal: Confirmar Anulación */}
      <Modal 
        isOpen={!!pagoToAnular} 
        onClose={() => setPagoToAnular(null)} 
        title={<span><AlertTriangle size={20} className="modal-title-icon" style={{ color: '#e03131' }}/> Confirmar Anulación</span>}
        contentClassName="modal-small"
      >
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ marginBottom: '20px', fontSize: '1.05rem', color: '#444' }}>
            ¿Estás seguro de <strong>ANULAR</strong> este pago? El cliente pasará a estado MOROSO y el saldo se revertirá.
          </p>
          <div className="pie-formulario" style={{ justifyContent: 'center', gap: '15px' }}>
            <button type="button" className="btn-cancel" onClick={() => setPagoToAnular(null)}>
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn-accion-delete"
              onClick={confirmAnular}
              style={{ border: 'none', background: '#e03131', color: '#fff', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              Sí, Anular
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Éxito */}
      <Modal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage('')}
        title={<span><CalendarCheck size={20} className="modal-title-icon" style={{ color: '#2b8a3e' }}/> Éxito</span>}
        contentClassName="modal-small"
      >
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ marginBottom: '20px', fontSize: '1.05rem', color: '#444' }}>
            {successMessage}
          </p>
          <button 
            type="button" 
            className="btn-save"
            onClick={() => setSuccessMessage('')}
            style={{ margin: '0 auto', display: 'block' }}
          >
            Aceptar
          </button>
        </div>
      </Modal>

      {/* Modal: Error */}
      <Modal
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage('')}
        title={<span><AlertTriangle size={20} className="modal-title-icon" style={{ color: '#e03131' }}/> Error</span>}
        contentClassName="modal-small"
      >
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ marginBottom: '20px', fontSize: '1.05rem', color: '#444' }}>
            {errorMessage}
          </p>
          <button 
            type="button" 
            className="btn-cancel"
            onClick={() => setErrorMessage('')}
            style={{ margin: '0 auto', display: 'block' }}
          >
            Aceptar
          </button>
        </div>
      </Modal>
    </>
  );

  if (isTab) {
    return <div style={{ padding: '10px 5px' }}>{content}</div>;
  }

  return (
    <div className="main-content">
      <PageHeader
        title="Gestión de Pagos"
        subtitle="Bandeja de aprobaciones e historial de transacciones"
        image="/img/welcome-background.png"
      />
      {content}
    </div>
  );
};

export default Pagos;
