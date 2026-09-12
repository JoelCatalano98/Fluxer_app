import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertTriangle } from 'lucide-react';
import '../styles/style.css';

const Login = () => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1);
    const [tempToken, setTempToken] = useState(null);
    const [branches, setBranches] = useState([]);
    
    const { login, selectBranchForLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const result = await login(loginInput, password);
        if (result.success) {
            if (result.needsBranchSelection) {
                setTempToken(result.tempToken);
                setBranches(result.branches);
                setStep(2);
                setLoading(false);
            } else {
                navigate('/');
            }
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    const handleBranchSelect = async (branchId) => {
        setLoading(true);
        setError(null);
        
        const result = await selectBranchForLogin(branchId, tempToken);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
            setLoading(false);
            // Si el error implica expiración o token inválido (401 o 403), volvemos al paso 1
            if (result.status === 401 || result.status === 403) {
                setStep(1);
                setTempToken(null);
                setBranches([]);
            }
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#333639', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '30px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: '#333639', margin: 0, fontSize: '2.5rem', fontWeight: '800' }}>Fluxer</h1>
                    <p style={{ color: '#666', marginTop: '5px' }}>Ingresa tus credenciales para continuar</p>
                </div>
                
                {error && (
                    <div style={{ backgroundColor: '#fff1f1', color: '#e03131', padding: '12px', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} />
                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{error}</span>
                    </div>
                )}
                
                {step === 1 ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label htmlFor="loginInput" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Usuario o Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                <input 
                                    type="text" 
                                    autoComplete="username"
                                    id="loginInput"
                                    value={loginInput}
                                    onChange={(e) => setLoginInput(e.target.value)}
                                    placeholder="tuusuario o tu@email.com"
                                    required
                                    style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label htmlFor="password" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Contraseña</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                <input 
                                    type="password" 
                                    autoComplete="current-password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ 
                                backgroundColor: '#00a8e8', color: 'white', border: 'none', padding: '14px', borderRadius: '6px', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px'
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
                        </button>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <p style={{ textAlign: 'center', color: '#444', fontWeight: '500', marginBottom: '10px' }}>
                            Seleccioná la sucursal a la que querés acceder:
                        </p>
                        {branches.map(branch => (
                            <button
                                key={branch.id}
                                onClick={() => handleBranchSelect(branch.id)}
                                disabled={loading}
                                style={{
                                    backgroundColor: '#f8f9fa',
                                    border: '1px solid #e9ecef',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}
                                onMouseOver={(e) => {
                                    if (!loading) {
                                        e.currentTarget.style.backgroundColor = '#e9ecef';
                                        e.currentTarget.style.borderColor = '#dee2e6';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                                    e.currentTarget.style.borderColor = '#e9ecef';
                                }}
                            >
                                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333' }}>{branch.nombre}</span>
                                {branch.direccion && <span style={{ fontSize: '0.85rem', color: '#666' }}>{branch.direccion}</span>}
                            </button>
                        ))}
                        
                        <button
                            onClick={() => {
                                setStep(1);
                                setTempToken(null);
                                setBranches([]);
                                setError(null);
                            }}
                            disabled={loading}
                            style={{
                                backgroundColor: 'transparent',
                                color: '#666',
                                border: 'none',
                                padding: '10px',
                                marginTop: '10px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                textDecoration: 'underline',
                                fontSize: '0.9rem'
                            }}
                        >
                            Volver
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
