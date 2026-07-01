import { useState } from 'react';
import { Settings, Plus, Eye, CalendarCheck, UserPlus } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import '../styles/style.css';
import '../styles/Servicios/horarios_cronograma.css';

const Turnos = () => {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAnotarModalOpen, setIsAnotarModalOpen] = useState(false);

  // Estado para las filas de horarios (La franja horaria es la clave)
  const [filasTurnos, setFilasTurnos] = useState([
    { hora: '07:00 - 08:00', lunes: '8 pers.', martes: '-', miercoles: '12 pers.', jueves: '-', viernes: '-', sabado: '-' },
    { hora: '08:00 - 09:00', lunes: '3 pers.', martes: '-', miercoles: '10 pers.', jueves: '-', viernes: '-', sabado: '-' },
    { hora: '09:00 - 10:00', lunes: '6 pers.', martes: '-', miercoles: '15 pers.', jueves: '-', viernes: '-', sabado: '-' },
    { hora: '10:00 - 11:00', lunes: '1 pers.', martes: '-', miercoles: '16 pers.', jueves: '-', viernes: '-', sabado: '-' },
    { hora: '11:00 - 12:00', lunes: '9 pers.', martes: '-', miercoles: '12 pers.', jueves: '-', viernes: '-', sabado: '-' },
  ]);

  const [nuevoHorario, setNuevoHorario] = useState({ inicio: '', fin: '' });

  const handleAddHorario = (e) => {
    e.preventDefault();
    if (!nuevoHorario.inicio || !nuevoHorario.fin) return;
    
    const nuevaFranja = `${nuevoHorario.inicio} - ${nuevoHorario.fin}`;
    
    // Evitar duplicados
    if (filasTurnos.find(f => f.hora === nuevaFranja)) {
      alert("Esta franja horaria ya existe");
      return;
    }

    const nuevaFila = {
      hora: nuevaFranja,
      lunes: '-', martes: '-', miercoles: '-', jueves: '-', viernes: '-', sabado: '-'
    };

    // Ordenar las filas por hora de inicio después de agregar
    const nuevasFilas = [...filasTurnos, nuevaFila].sort((a, b) => 
      a.hora.localeCompare(b.hora)
    );

    setFilasTurnos(nuevasFilas);
    setNuevoHorario({ inicio: '', fin: '' });
    setIsConfigModalOpen(false);
    alert("¡Nuevo horario agregado con éxito!");
  };

  return (
    <div className="main-content">
      {/* Encabezado */}
      <PageHeader
        title="Cronograma Semanal"
        image="/img/welcome-background.png"
      >
        <div className="header-actions">
          <button 
            className="btn-config-horarios" 
            onClick={() => setIsConfigModalOpen(true)}
          >
            <Settings size={16} /> <span>Crear Nuevo Horario</span>
          </button>
          <button 
            className="btn-anotar-cliente" 
            onClick={() => setIsAnotarModalOpen(true)}
          >
            <Plus size={16} /> <span>Anotar Cliente</span>
          </button>
        </div>
      </PageHeader>

      {/* Tabla Dinámica */}
      <div className="table-section">
        <div className="contenedor-scroll">
          <table className="data-table tabla-turnos">
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
              {filasTurnos.map((fila, index) => (
                <tr key={index}>
                  <td className="etiqueta-hora columna-fija">{fila.hora}</td>
                  {[ 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].map(dia => (
                    <td key={dia}>
                      {fila[dia] !== '-' ? (
                        <div className={`caja-turno ${fila[dia].includes('1') && !fila[dia].includes('pers.') ? 'activo' : ''}`}>
                          <span>{fila[dia]}</span>
                          <button className="btn-view-turno"><Eye size={14} /></button>
                        </div>
                      ) : (
                        <div className="turno-vacio">-</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Nuevo Horario (Fila) */}
      <Modal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        title={<span><CalendarCheck size={20} className="modal-title-icon" /> Agregar Franja Horaria</span>}
      >
        <form className="turnos-form" onSubmit={handleAddHorario}>
          <div className="form-section">
            <p style={{ marginBottom: '15px', color: '#666' }}>Define una nueva franja horaria para el cronograma semanal.</p>
            <div className="form-row">
              <div className="grupo-entrada">
                <label>Hora Inicio</label>
                <input 
                  type="time" 
                  value={nuevoHorario.inicio} 
                  onChange={(e) => setNuevoHorario({...nuevoHorario, inicio: e.target.value})}
                  required 
                />
              </div>
              <div className="grupo-entrada">
                <label>Hora Fin</label>
                <input 
                  type="time" 
                  value={nuevoHorario.fin} 
                  onChange={(e) => setNuevoHorario({...nuevoHorario, fin: e.target.value})}
                  required 
                />
              </div>
            </div>
          </div>
          <div className="pie-formulario">
            <button type="button" className="btn-cancel" onClick={() => setIsConfigModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              <Plus size={18} /> <span>Agregar al Cronograma</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Anotar Cliente (Sigue igual por ahora) */}
      <Modal 
        isOpen={isAnotarModalOpen} 
        onClose={() => setIsAnotarModalOpen(false)} 
        title={<span><UserPlus size={20} className="modal-title-icon" /> Anotar Cliente</span>}
      >
        <form className="turnos-form" onSubmit={(e) => { e.preventDefault(); alert('¡Cliente anotado!'); setIsAnotarModalOpen(false); }}>
          <div className="grupo-entrada">
            <label htmlFor="buscar_cliente">Buscar Cliente</label>
            <input type="text" id="buscar_cliente" placeholder="Nombre o DNI..." required />
          </div>
          <div className="form-row">
            <div className="grupo-entrada">
              <label htmlFor="dia_turno">Día</label>
              <select id="dia_turno">
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
              </select>
            </div>
            <div className="grupo-entrada">
              <label htmlFor="hora_turno">Horario</label>
              <select id="hora_turno">
                {filasTurnos.map((f, i) => (
                  <option key={i} value={f.hora}>{f.hora}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pie-formulario">
            <button type="button" className="btn-cancel" onClick={() => setIsAnotarModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save btn-confirm">
              <Plus size={18} /> <span>Confirmar</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Turnos;
