import { SquarePlus, Save, Zap, CirclePlus, X } from 'lucide-react';import '../styles/style.css';
import '../styles/utilidades/categorias_etiquetas.css';

const Categorias = () => {
  return (
    <div className="main-content">
      <section id="content-header" style={{ minHeight: '100px', height: '150px', justifyContent: 'center' }}>
        <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Categorías y Etiquetas</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Organiza y clasifica tus servicios y planes</p>
        <img src="/img/welcome-background.png" alt="Fondo" style={{ height: '100%' }} />
      </section>

      <div className="contenedor-categorias">
        <div className="diseno-categorias">
          <div className="panel-configuracion">
            <div className="configuracion-tarjeta">
              <h3><SquarePlus size={20} style={{ marginRight: '8px' }} /> Nueva Categoría</h3>
              <p className="texto-atenuado">Define un área para agrupar servicios.</p>

              <form className="form-horizontal-categorias">
                <div className="grupo-campo">
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Nombre de la Categoría</label>
                  <input type="text" placeholder="Ej: Psicología, CrossFit..." style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                </div>

                <button type="submit" className="btn-help" style={{ width: '100%', padding: '12px', border: 'none', background: '#00a8e8', color: 'white', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Save size={18} /> Crear Categoría
                </button>
              </form>
            </div>
          </div>

          <section className="lista-categorias">
            <div className="tarjeta-categoria">
              <div className="cabecera-categoria" style={{ borderLeft: '5px solid #00a8e8' }}>
                <div className="info-cabecera" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Cambiado de Lightning a Zap */}
                  <Zap size={20} />
                  <h3 style={{ margin: 0 }}>CrossFit</h3>
                </div>
                <button className="boton-agregar-plan">
                  <CirclePlus size={14} style={{ marginRight: '5px' }} /> Asignar Plan
                </button>
              </div>
              <div className="cuerpo-categoria">
                <ul className="planes-asignados">
                  <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                    <div className="info-plan">
                      <strong>Plan Full</strong><br />
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>3 veces por semana - $22.000</span>
                    </div>
                    <button className="boton-quitar" style={{ border: 'none', background: 'none', color: '#e03131', cursor: 'pointer' }}><X size={16} /></button>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Categorias;