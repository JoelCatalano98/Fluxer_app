import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleHelp, LogOut, Menu, Send } from 'lucide-react';
import Modal from './Modal';
import { useForm } from '../hooks/useForm';

const Topbar = ({ onToggleSidebar }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const navigate = useNavigate();

  const [formValues, handleInputChange, resetForm] = useForm({
    name: '',
    email: '',
    reason: '',
    message: ''
  });

  const handleLogout = () => {
    // Aquí iría la lógica de limpiar tokens, etc.
    navigate('/login');
  };

  const handleHelpSubmit = (e) => {
    e.preventDefault();
    console.log('Datos del formulario de contacto:', formValues);
    alert('¡Gracias! Tu consulta ha sido enviada.');
    resetForm();
    setIsHelpOpen(false);
  };

  return (
    <>
      <nav className="topbar">
        <button id="menu-toggle" className="hamburger-btn" onClick={onToggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="search-bar">
          <input type="text" placeholder="Buscar en Fluxer..." />
        </div>
        <div className="user-actions">
          <button className="btn-help" onClick={() => setIsHelpOpen(true)}>
            <CircleHelp size={18} /> <span>Ayuda</span>
          </button>
          <button className="btn-logout" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
            <LogOut size={18} /> <span>Salir</span>
          </button>
        </div>
      </nav>

      <Modal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        title="Contáctate con Soporte"
      >
        <form className="help-form" onSubmit={handleHelpSubmit}>
          <div className="form-group">
            <label htmlFor="help_name">Nombre Completo</label>
            <input 
              type="text" 
              id="help_name" 
              name="name"
              placeholder="Ej: Juan Pérez" 
              value={formValues.name}
              onChange={handleInputChange}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="help_email">Correo Electrónico</label>
            <input 
              type="email" 
              id="help_email" 
              name="email"
              placeholder="usuario@ejemplo.com" 
              value={formValues.email}
              onChange={handleInputChange}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="help_reason">Motivo de contacto</label>
            <select 
              id="help_reason" 
              name="reason"
              value={formValues.reason}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccionar motivo...</option>
              <option value="tecnico">Problema Técnico</option>
              <option value="facturacion">Facturación / Pagos</option>
              <option value="sugerencia">Sugerencia / Mejora</option>
              <option value="otro">Otro motivo</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="help_comment">Comentario / Descripción</label>
            <textarea 
              id="help_comment" 
              name="message"
              rows="4" 
              placeholder="Contanos en qué podemos ayudarte..." 
              value={formValues.message}
              onChange={handleInputChange}
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            ></textarea>
          </div>
          <button type="submit" className="btn-submit-help" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Send size={18} /> Enviar Mensaje a Soporte
          </button>
        </form>
      </Modal>
    </>
  );
};

export default Topbar;
