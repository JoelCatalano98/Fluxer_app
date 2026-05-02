import React from 'react';
import { User } from 'lucide-react';

const Navbar = () => {
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#1a1a1a', color: 'white' }}>
      <div className="logo" style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>FLUXER</div>
      <ul style={{ display: 'flex', gap: '20px', listStyle: 'none' }}>
        <li>Inicio</li>
        <li>Socios</li>
        <li>Turnos</li>
      </ul>
      <div>
        <User size={24} />
      </div>
    </nav>
  );
};

export default Navbar;