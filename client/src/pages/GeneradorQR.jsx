// TODO: Este QR es una simulación / prototipo visual. Falta la 
// integración real con el backend: crear una orden vía API de 
// MercadoPago usando el Access Token del lado del SERVIDOR (nunca en 
// el frontend), tomar el campo qr_data de la respuesta real de la API, 
// y manejar la notificación IPN/webhook para confirmar el pago. 
// NO USAR EN PRODUCCIÓN sin esa integración.

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { QrCode, X, CreditCard, Smartphone, ArrowLeft } from 'lucide-react';
import '../styles/utilidades/generador-qr.css';

export default function GeneradorQR() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoQR, setTipoQR] = useState(null);
  const [monto, setMonto] = useState('');

  const cerrarModal = () => {
    setModalAbierto(false);
    setTipoQR(null);
    setMonto('');
  };

  const handleMontoChange = (e) => {
    const value = e.target.value;
    if (value === '' || Number(value) >= 0) {
      setMonto(value);
    }
  };

  return (
    <div className="qr-contenedor-global">
      <button 
        className="qr-boton-abrir"
        onClick={() => setModalAbierto(true)}
      >
        <QrCode size={20} />
        Generar QR
      </button>

      {modalAbierto && (
        <div className="qr-overlay" onClick={cerrarModal}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <button className="qr-boton-cerrar" onClick={cerrarModal}>
              <X size={24} />
            </button>

            {tipoQR === null && (
              <>
                <h2 className="qr-titulo-modal">Seleccionar tipo de QR</h2>
                <div className="qr-opciones-contenedor">
                  <div 
                    className="qr-tarjeta-opcion"
                    onClick={() => setTipoQR('cobro')}
                  >
                    <CreditCard size={32} className="qr-tarjeta-icono" />
                    <h3 className="qr-tarjeta-titulo">Cobrar Plan</h3>
                    <p className="qr-tarjeta-desc">
                      Generar QR de demostración con un monto (prototipo, no cobra de verdad).
                    </p>
                  </div>
                  <div 
                    className="qr-tarjeta-opcion"
                    onClick={() => setTipoQR('descarga')}
                  >
                    <Smartphone size={32} className="qr-tarjeta-icono" />
                    <h3 className="qr-tarjeta-titulo">Descargar App</h3>
                    <p className="qr-tarjeta-desc">
                      Compartir Fluxer con Socios y Profesionales.
                    </p>
                  </div>
                </div>
              </>
            )}

            {tipoQR === 'cobro' && (
              <div className="qr-vista-container">
                <h2 className="qr-titulo-modal">QR de Cobro</h2>
                <div className="qr-input-group">
                  <label className="qr-label">Monto a cobrar (ARS)</label>
                  <input
                    type="number"
                    className="qr-input"
                    placeholder="Ej: 15000"
                    min="0"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                  />
                </div>

                <div className="qr-container">
                  {Number(monto) > 0 ? (
                    <>
                      <QRCode 
                        value={`FLUXER-DEMO|monto:${monto}|SIMULADO - No es un QR de pago real`}
                        size={200}
                        fgColor="#2d2d2d"
                      />
                      <p className="qr-ayuda-texto">
                        Este es un QR de demostración, no procesa pagos reales.
                      </p>
                    </>
                  ) : (
                    <div className="qr-placeholder">
                      <p>Ingresá un monto para generar el QR</p>
                    </div>
                  )}
                </div>

                <button 
                  className="qr-boton-volver"
                  onClick={() => { setTipoQR(null); setMonto(''); }}
                >
                  <ArrowLeft size={16} /> Volver atrás
                </button>
              </div>
            )}

            {tipoQR === 'descarga' && (
              <div className="qr-vista-container">
                <h2 className="qr-titulo-modal">Descargar Fluxer</h2>
                
                <div className="qr-container">
                  <QRCode 
                    value="https://tu-gimnasio.com/descargas"
                    size={200}
                    fgColor="#2d2d2d"
                  />
                  <p className="qr-ayuda-texto">
                    Escaneá para descargar la app
                  </p>
                </div>

                <button 
                  className="qr-boton-volver"
                  onClick={() => setTipoQR(null)}
                >
                  <ArrowLeft size={16} /> Volver atrás
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
