import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulación de login
    console.log('Login con:', email, password);
    navigate('/');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header" style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#00a8e8', letterSpacing: '2px', margin: 0 }}>FLUXER</h2>
          <p style={{ color: '#666', marginTop: '5px' }}>Gestión Inteligente de Gimnasios</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="input-group" style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#444' }}>Correo Electrónico</label>
            <input 
              type="email" 
              id="email" 
              placeholder="tu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: '25px', textAlign: 'left' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#444' }}>Contraseña</label>
            <input 
              type="password" 
              id="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="btn-login">
            Iniciar Sesión
          </button>
        </form>
        
        <div className="login-footer">
          <a href="#">¿Olvidaste tu contraseña?</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
