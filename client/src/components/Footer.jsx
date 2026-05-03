import { Cpu, Circle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-left">
        <span><Cpu size={14} style={{ marginRight: '5px' }} /> Fluxer v2.0 (MERN)</span>
        <span className="status-online"><Circle size={8} fill="#28a745" style={{ marginRight: '5px' }} /> Sistema Activo</span>
      </div>
      <div className="footer-right">
        <span>&copy; 2026 - Fluxer.com</span>
      </div>
    </footer>
  );
};

export default Footer;
