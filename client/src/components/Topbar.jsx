import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleHelp, LogOut, Menu, Send } from 'lucide-react';
import Modal from './Modal';

const Topbar = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Aquí iría la lógica de limpiar tokens, etc.
    navigate('/login');
  };

  return (
    <>
      <nav className="topbar">
        <button id="menu-toggle" className="hamburger-btn">
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
        <form className="help-form" onSubmit={(e) => { e.preventDefault(); alert('¡Gracias! Tu consulta ha sido enviada.'); setIsHelpOpen(false); }}>
          <div className="form-group">
            <label htmlFor="help_name">Nombre Completo</label>
            <input type="text" id="help_name" placeholder="Ej: Juan Pérez" required />
          </div>
          <div className="form-group">
            <label htmlFor="help_email">Correo Electrónico</label>
            <input type="email" id="help_email" placeholder="usuario@ejemplo.com" required />
          </div>
          <div className="form-group">
            <label htmlFor="help_reason">Motivo de contacto</label>
            <select id="help_reason" required>
              <option value="">Seleccionar motivo...</option>
              <option value="tecnico">Problema Técnico</option>
              <option value="facturacion">Facturación / Pagos</option>
              <option value="sugerencia">Sugerencia / Mejora</option>
              <option value="otro">Otro motivo</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="help_comment">Comentario / Descripción</label>
            <textarea id="help_comment" rows="4" placeholder="Contanos en qué podemos ayudarte..." required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}></textarea>
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
