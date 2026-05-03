import { Settings, Plus, Eye } from 'lucide-react';
import '../styles/style.css';
import '../styles/Servicios/horarios_cronograma.css';

const Turnos = () => {
  return (
    <div className="main-content">
      <section id="content-header" style={{ minHeight: '100px', height: '150px', justifyContent: 'center' }}>
        <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Cronograma Semanal</h1>
        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
          <button className="btn-help" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid white', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} /> Configurar Horarios
          </button>
          <button className="btn-help" style={{ background: '#00a8e8', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Anotar Cliente
          </button>
        </div>
        <img src="/img/welcome-background.png" alt="Fondo" style={{ height: '100%' }} />
      </section>

      <div className="contenedor-scroll" style={{ padding: '30px' }}>
        <table className="tabla-cronograma">
          <thead>
            <tr>
              <th className="columna-fija">Hora</th>
              <th>Lunes</th>
              <th>Martes</th>
              <th>Miércoles</th>
              <th>Jueves</th>
              <th>Viernes</th>
              <th>Sábado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="etiqueta-hora columna-fija">07:00 - 08:00</td>
              <td><div className="caja-turno"><span>8 pers.</span><button className="btn-view" style={{ border: 'none', background: 'none', color: '#00a8e8' }}><Eye size={14} /></button></div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="caja-turno activo">12 pers.</div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="turno-vacio">-</div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Turnos;
