import { CirclePlus, Banknote, Landmark, Save } from 'lucide-react';
import '../styles/style.css';
import '../styles/utilidades/configuracion_pagos.css';

const Pagos = () => {
  return (
    <div className="main-content">
      <section id="content-header" style={{ minHeight: '100px', height: '150px', justifyContent: 'center' }}>
        <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Medios de Pago</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Configura tus canales de cobro y recargos</p>
        <img src="/img/welcome-background.png" alt="Fondo" style={{ height: '100%' }} />
      </section>

      <div className="contenedor-pagos">
        <div style={{ padding: '0 0 20px 0' }}>
          <button className="btn-primary" style={{ width: 'auto', height: 'auto', padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CirclePlus size={18} /> Nuevo Medio
          </button>
        </div>

        <div className="cuadricula-pagos" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          <article className="tarjeta-pago activo" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div className="cabecera-tarjeta-pago" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div className="info-metodo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Cambiado CashStack por Banknote */}
                <Banknote size={24} color="#00a8e8" />
                <h3 style={{ margin: 0 }}>Efectivo</h3>
              </div>
            </div>
            <div className="cuerpo-tarjeta-pago">
              <div className="caja-instrucciones">
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Recargo/Descuento (%)</label>
                <input type="number" defaultValue="-5" style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
            </div>
            <div className="pie-tarjeta-pago" style={{ marginTop: '15px', textAlign: 'right' }}>
              <button className="btn-help" style={{ background: '#00a8e8', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Save size={14} /> Guardar
              </button>
            </div>
          </article>

          <article className="tarjeta-pago activo" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div className="cabecera-tarjeta-pago" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div className="info-metodo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Cambiado Bank por Landmark */}
                <Landmark size={24} color="#00a8e8" />
                <h3 style={{ margin: 0 }}>Transferencia</h3>
              </div>
            </div>
            <div className="cuerpo-tarjeta-pago">
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>CBU / Alias</label>
              <textarea defaultValue="Alias: fluxer.gym.ok" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} rows="2"></textarea>
            </div>
            <div className="pie-tarjeta-pago" style={{ marginTop: '15px', textAlign: 'right' }}>
              <button className="btn-help" style={{ background: '#00a8e8', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Save size={14} /> Guardar
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default Pagos;