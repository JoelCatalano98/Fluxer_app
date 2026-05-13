import { useState } from 'react';
import { Settings, Plus, Eye, X, Save, CalendarCheck, UserPlus } from 'lucide-react';
import Modal from '../components/Modal';
import '../styles/style.css';
import '../styles/Servicios/horarios_cronograma.css';

const Turnos = () => {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAnotarModalOpen, setIsAnotarModalOpen] = useState(false);

  return (
    <div className="main-content">
      <section id="content-header" style={{ 
          minHeight: '100px', 
          height: '450px', 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'flex-end', // Empuja el contenido hacia abajo
          padding: '0 40px 40px 40px', // Agregamos 40px al final para que no toque el borde
          overflow: 'hidden' 
}}>
        <div style={{ position: 'relative', zIndex: 2, padding: '40px' }}>
          <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Cronograma Semanal</h1>
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button 
              className="btn-help" 
              onClick={() => setIsConfigModalOpen(true)}
              style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid white', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
            >
              <Settings size={16} /> Configurar Horarios
            </button>
            <button 
              className="btn-help" 
              onClick={() => setIsAnotarModalOpen(true)}
              style={{ background: '#00a8e8', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
            >
              <Plus size={16} /> Anotar Cliente
            </button>
          </div>
        </div>
        <img 
          src="/img/welcome-background.png" 
          alt="Fondo" 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            zIndex: 1 
          }} 
        />
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
            <tr>
              <td className="etiqueta-hora columna-fija">08:00 - 09:00</td>
              <td><div className="caja-turno"><span>3 pers.</span><button className="btn-view" style={{ border: 'none', background: 'none', color: '#00a8e8' }}><Eye size={14} /></button></div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="caja-turno activo">10 pers.</div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="turno-vacio">-</div></td>
            </tr>
            <tr>
              <td className="etiqueta-hora columna-fija">09:00 - 10:00</td>
              <td><div className="caja-turno"><span>6 pers.</span><button className="btn-view" style={{ border: 'none', background: 'none', color: '#00a8e8' }}><Eye size={14} /></button></div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="caja-turno activo">15 pers.</div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="turno-vacio">-</div></td>
            </tr>
            <tr>
              <td className="etiqueta-hora columna-fija">10:00 - 11:00</td>
              <td><div className="caja-turno"><span>1 pers.</span><button className="btn-view" style={{ border: 'none', background: 'none', color: '#00a8e8' }}><Eye size={14} /></button></div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="caja-turno activo">16 pers.</div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="turno-vacio">-</div></td>
            </tr>
            <tr>
              <td className="etiqueta-hora columna-fija">11:00 - 12:00</td>
              <td><div className="caja-turno"><span>9 pers.</span><button className="btn-view" style={{ border: 'none', background: 'none', color: '#00a8e8' }}><Eye size={14} /></button></div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="caja-turno activo">12 pers.</div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="turno-vacio">-</div></td>
              <td><div className="turno-vacio">-</div></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modal: Configurar Horarios */}
      <Modal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        title={<span><CalendarCheck size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Horarios Operativos</span>}
      >
        <form className="modal-body" onSubmit={(e) => { e.preventDefault(); alert('¡Horarios configurados!'); setIsConfigModalOpen(false); }}>
          <div className="grupo-campo" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>Días de Trabajo</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
                <label key={dia} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', background: '#f8f9fa', padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <input type="checkbox" defaultChecked={dia !== 'Dom'} /> {dia}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="grupo-campo">
              <label htmlFor="hora_inicio" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Apertura</label>
              <input type="time" id="hora_inicio" defaultValue="07:00" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
            </div>
            <div className="grupo-campo">
              <label htmlFor="hora_fin" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Cierre</label>
              <input type="time" id="hora_fin" defaultValue="21:00" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
            </div>
          </div>
          <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsConfigModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#00a8e8', color: 'white', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Anotar Cliente */}
      <Modal 
        isOpen={isAnotarModalOpen} 
        onClose={() => setIsAnotarModalOpen(false)} 
        title={<span><UserPlus size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Anotar Cliente</span>}
      >
        <form className="modal-body" onSubmit={(e) => { e.preventDefault(); alert('¡Cliente anotado!'); setIsAnotarModalOpen(false); }}>
          <div className="grupo-campo" style={{ marginBottom: '15px' }}>
            <label htmlFor="buscar_cliente" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Buscar Cliente</label>
            <input type="text" id="buscar_cliente" placeholder="Nombre o DNI..." required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="grupo-campo">
              <label htmlFor="dia_turno" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Día</label>
              <select id="dia_turno" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}>
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
              </select>
            </div>
            <div className="grupo-campo">
              <label htmlFor="hora_turno" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Horario</label>
              <select id="hora_turno" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}>
                <option>07:00 - 08:00</option>
                <option>08:00 - 09:00</option>
                <option>09:00 - 10:00</option>
                <option>10:00 - 11:00</option>
                <option>11:00 - 12:00</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsAnotarModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#40c057', color: 'white', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Confirmar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Turnos;
