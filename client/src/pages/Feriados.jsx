import { Plus, Lock, Trash2 } from 'lucide-react'; 
import '../styles/style.css';
import '../styles/utilidades/calendario_feriados.css';

const Feriados = () => {
  return (
    <div className="main-content">
      <section id="content-header" style={{ minHeight: '100px', height: '150px', justifyContent: 'center' }}>
        <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Calendario Operativo</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Días no laborables y cierres temporales</p>
        <img src="/img/welcome-background.png" alt="Fondo" style={{ height: '100%' }} />
      </section>

      <div className="contenedor-feriados">
        <div className="acciones-feriados" style={{ marginBottom: '20px' }}>
          <button className="btn-primary" style={{ width: 'auto', height: 'auto', padding: '12px 25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> Agregar Feriado o Cierre
          </button>
        </div>

        <div className="lista-feriados">
          <article className="item-feriado nacional">
            <div className="info-feriado" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div className="caja-fecha-feriado" style={{ textAlign: 'center', background: '#f8f9fa', padding: '10px', borderRadius: '8px', minWidth: '60px' }}>
                <span className="dia" style={{ display: 'block', fontSize: '1.5rem', fontWeight: 700 }}>01</span>
                <span className="month" style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase' }}>Mayo</span>
              </div>
              <div className="detalles-feriado">
                <h3 style={{ margin: 0 }}>Día del Trabajador</h3>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>Feriado Nacional - Inamovible</p>
              </div>
            </div>
            <div className="estado-feriado" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e03131', fontWeight: 600 }}>
              <Lock size={16} /> CRONOGRAMA BLOQUEADO
              {/* Cambiado Trash por Trash2 */}
              <button className="btn-remove" style={{ border: 'none', background: 'none', color: '#ff4b4b', cursor: 'pointer' }}><Trash2 size={18} /></button>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default Feriados;