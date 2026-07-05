import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit3, Clock, AlertTriangle, Save } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import api from '../services/api';
import '../styles/style.css';

const Calendario = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notes, setNotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  
  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [contenido, setContenido] = useState('');
  const [horaAlarma, setHoraAlarma] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/api/calendario');
      setNotes(res.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day) => {
    const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateStr(formattedDate);
    setIsEditing(false);
    setEditingNoteId(null);
    setContenido('');
    setHoraAlarma('');
    setShowAddForm(false);
    setIsModalOpen(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!contenido.trim()) return;

    try {
      if (isEditing && editingNoteId) {
        await api.put(`/api/calendario/${editingNoteId}`, {
          contenido,
          horaAlarma: horaAlarma || null
        });
        alert('Nota actualizada con éxito');
      } else {
        await api.post('/api/calendario', {
          fecha: selectedDateStr,
          contenido,
          horaAlarma: horaAlarma || null
        });
        alert('Nota guardada con éxito');
      }
      fetchNotes();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Hubo un error al guardar la nota');
    }
  };

  const handleEditClick = (note) => {
    setIsEditing(true);
    setEditingNoteId(note.id);
    setContenido(note.contenido);
    setHoraAlarma(note.horaAlarma || '');
    setShowAddForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta nota?')) return;
    try {
      await api.delete(`/api/calendario/${id}`);
      alert('Nota eliminada con éxito');
      fetchNotes();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Hubo un error al eliminar la nota');
    }
  };

  // Filter notes for selected day
  const dayNotes = notes.filter(n => n.fecha === selectedDateStr);

  const renderCells = () => {
    const cells = [];
    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }

    // Days in month
    for (let d = 1; d <= daysInMonth; d++) {
      const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayNotesList = notes.filter(n => n.fecha === formattedDate);
      const hasNotes = dayNotesList.length > 0;
      const hasAlarm = dayNotesList.some(n => n.horaAlarma);
      
      const isToday = 
        d === new Date().getDate() && 
        currentDate.getMonth() === new Date().getMonth() && 
        currentDate.getFullYear() === new Date().getFullYear();

      cells.push(
        <div key={d} className={`calendar-cell ${isToday ? 'today' : ''}`} onClick={() => handleDayClick(d)}>
          <span className="cell-number">{d}</span>
          {hasNotes && (
            <div className="cell-indicators">
              <div className={`note-dot ${hasAlarm ? 'alarm' : ''}`}></div>
              {dayNotesList.length > 1 && <span className="note-count">+{dayNotesList.length - 1}</span>}
            </div>
          )}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="main-content">
      <PageHeader
        title="Agenda de Notas"
        subtitle="Agrega, edita y gestiona notas y recordatorios en el calendario"
        image="/img/welcome-background.png"
      />

      <div className="calendario-container">
        <div className="calendario-header">
          <h2 className="month-title">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="navigation-buttons">
            <button className="nav-btn" onClick={prevMonth}>
              <ChevronLeft size={20} />
            </button>
            <button className="nav-btn" onClick={nextMonth}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="calendario-grid">
          {daysOfWeek.map(day => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}
          {renderCells()}
        </div>
      </div>

      {/* Modal interactivo de notas */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Notas para el día ${selectedDateStr}`}
      >
        <div className="notes-modal-content">
          {dayNotes.length > 0 && !showAddForm && (
            <div className="existing-notes">
              <div className="notes-list">
                {dayNotes.map(note => (
                  <div key={note.id} className="note-item">
                    <p className="note-text">{note.contenido}</p>
                    <div className="note-meta">
                      {note.horaAlarma && (
                        <span className="alarm-badge">
                          <Clock size={14} style={{ marginRight: '4px' }} />
                          {note.horaAlarma}
                        </span>
                      )}
                      <div className="note-actions">
                        <button className="edit-btn" onClick={() => handleEditClick(note)}>
                          <Edit3 size={16} />
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteClick(note.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-add-more" onClick={() => {
                setIsEditing(false);
                setContenido('');
                setHoraAlarma('');
                setShowAddForm(true);
              }}>
                <Plus size={16} style={{ marginRight: '6px' }} /> Agregar Nota
              </button>
            </div>
          )}

          {(dayNotes.length === 0 || showAddForm) && (
            <form onSubmit={handleSaveNote} className="note-form">
              <div className="form-group">
                <label htmlFor="contenido" className="form-label">Contenido de la nota</label>
                <textarea
                  id="contenido"
                  rows="4"
                  className="form-textarea"
                  placeholder="Escribe el recordatorio o nota aquí..."
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="horaAlarma" className="form-label">
                  Hora de Alarma (Opcional)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} style={{ color: '#888' }} />
                  <input
                    type="time"
                    id="horaAlarma"
                    className="form-input-time"
                    value={horaAlarma}
                    onChange={(e) => setHoraAlarma(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                {dayNotes.length > 0 && (
                  <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>
                    Atrás
                  </button>
                )}
                <button type="submit" className="btn-submit">
                  <Save size={18} style={{ marginRight: '6px' }} />
                  {isEditing ? 'Guardar Cambios' : 'Guardar Nota'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .calendario-container {
          background-color: #1a1a1f;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #2e2e36;
          margin-top: 20px;
        }

        .calendario-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .month-title {
          font-size: 1.5rem;
          color: #ffffff;
          font-weight: 700;
          margin: 0;
          text-transform: capitalize;
        }

        .navigation-buttons {
          display: flex;
          gap: 12px;
        }

        .nav-btn {
          background-color: #25252b;
          border: 1px solid #33333b;
          color: #ffffff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s, border-color 0.2s;
        }

        .nav-btn:hover {
          background-color: #2e2e36;
          border-color: #3e3e46;
        }

        .calendario-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .weekday-header {
          text-align: center;
          font-weight: 700;
          padding: 12px;
          font-size: 0.9rem;
          color: #888896;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .calendar-cell {
          height: 110px;
          background-color: #202026;
          border: 1px solid #2a2a33;
          border-radius: 8px;
          padding: 12px;
          position: relative;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: background-color 0.2s, border-color 0.2s;
        }

        .calendar-cell:hover:not(.empty) {
          background-color: #282830;
          border-color: #00a8e8;
        }

        .calendar-cell.empty {
          background-color: transparent;
          border: none;
          cursor: default;
        }

        .calendar-cell.today {
          background-color: #202b3c;
          border: 2px solid #00a8e8;
        }

        .cell-number {
          font-weight: 700;
          font-size: 1.1rem;
          color: #ffffff;
        }

        .cell-indicators {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .note-dot {
          width: 8px;
          height: 8px;
          background-color: #00a8e8;
          border-radius: 50%;
        }

        .note-dot.alarm {
          background-color: #f7a01b;
          box-shadow: 0 0 8px rgba(247, 160, 27, 0.6);
        }

        .note-count {
          font-size: 0.75rem;
          background-color: #2e2e36;
          color: #bbb;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }

        /* Modal styling helper */
        .notes-modal-content {
          padding: 8px;
          color: #ffffff;
        }

        .notes-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 6px;
        }

        .note-item {
          background-color: #1e1e24;
          border: 1px solid #2e2e36;
          border-radius: 8px;
          padding: 14px;
        }

        .note-text {
          margin: 0 0 12px 0;
          font-size: 0.95rem;
          line-height: 1.4;
          white-space: pre-wrap;
          color: #e3e3e6;
        }

        .note-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alarm-badge {
          display: inline-flex;
          align-items: center;
          background-color: rgba(247, 160, 27, 0.15);
          color: #f7a01b;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(247, 160, 27, 0.3);
        }

        .note-actions {
          display: flex;
          gap: 8px;
        }

        .edit-btn, .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .edit-btn {
          color: #00a8e8;
        }

        .edit-btn:hover {
          background-color: rgba(0, 168, 232, 0.1);
        }

        .delete-btn {
          color: #ff4b4b;
        }

        .delete-btn:hover {
          background-color: rgba(255, 75, 75, 0.1);
        }

        .btn-add-more {
          background-color: #25252b;
          border: 1px solid #33333b;
          color: #ffffff;
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .btn-add-more:hover {
          background-color: #2e2e36;
        }

        /* Note Form styling */
        .note-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #aaa;
        }

        .form-textarea {
          background-color: #141417;
          border: 1px solid #2e2e36;
          color: #ffffff;
          border-radius: 8px;
          padding: 12px;
          font-size: 0.95rem;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-textarea:focus {
          border-color: #00a8e8;
        }

        .form-input-time {
          background-color: #141417;
          border: 1px solid #2e2e36;
          color: #ffffff;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-input-time:focus {
          border-color: #00a8e8;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }

        .btn-submit {
          background-color: #00a8e8;
          color: #ffffff;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background-color 0.2s;
        }

        .btn-submit:hover {
          background-color: #008cc2;
        }

        @media screen and (max-width: 768px) {
          .calendar-cell {
            height: 80px;
            padding: 8px;
          }
          
          .cell-number {
            font-size: 0.95rem;
          }
        }
      `}} />
    </div>
  );
};

export default Calendario;
