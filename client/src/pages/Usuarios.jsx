import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, UserPlus, Save, X, Loader2, AlertTriangle, CheckSquare, Square, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import '../styles/style.css';

const Usuarios = () => {
    const { hasPermission } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        usuario: '',
        email: '',
        password: '',
        esSuperAdmin: false,
        esAdmin: false,
        permisoFinanzas: false,
        permisoTurnos: false,
        permisoClientes: false,
        permisoPlanes: false,
        permisoFeriados: false
    });

    const fetchUsuarios = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/auth/usuarios');
            if (res.data.success) {
                setUsuarios(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching usuarios:', err);
            setError('Error al cargar empleados');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsuarios();
    }, [fetchUsuarios]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAdminToggle = (e) => {
        const isAdmin = e.target.checked;
        if (isAdmin) {
            setFormData(prev => ({
                ...prev,
                esAdmin: true,
                permisoFinanzas: true,
                permisoTurnos: true,
                permisoClientes: true,
                permisoPlanes: true,
                permisoFeriados: true
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                esAdmin: false,
                permisoFinanzas: false,
                permisoTurnos: false,
                permisoClientes: false,
                permisoPlanes: false,
                permisoFeriados: false
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (usuarioEditando) {
                const res = await api.put(`/api/auth/usuarios/${usuarioEditando.id}`, formData);
                if (res.data.success) {
                    setUsuarios(usuarios.map(u => u.id === usuarioEditando.id ? res.data.data : u));
                    setShowForm(false);
                    setUsuarioEditando(null);
                    setFormData({
                        nombre: '', usuario: '', email: '', password: '', esSuperAdmin: false, esAdmin: false,
                        permisoFinanzas: false, permisoTurnos: false, permisoClientes: false,
                        permisoPlanes: false, permisoFeriados: false
                    });
                    alert('Empleado actualizado exitosamente');
                }
            } else {
                const res = await api.post('/api/auth/registrar', formData);
                if (res.data.success) {
                    setUsuarios([...usuarios, res.data.data]);
                    setShowForm(false);
                    setFormData({
                        nombre: '', usuario: '', email: '', password: '', esSuperAdmin: false, esAdmin: false,
                        permisoFinanzas: false, permisoTurnos: false, permisoClientes: false,
                        permisoPlanes: false, permisoFeriados: false
                    });
                    alert('Empleado registrado exitosamente');
                }
            }
        } catch (err) {
            console.error('Error registrar/editar:', err);
            alert(err.response?.data?.message || 'Error al procesar empleado');
        }
    };

    const handleEditar = (u) => {
        setUsuarioEditando(u);
        setFormData({
            nombre: u.nombre || '',
            usuario: u.usuario || '',
            email: u.email || '',
            password: '', // Dejar vacío por seguridad
            esSuperAdmin: u.esSuperAdmin || false,
            esAdmin: u.esAdmin || false,
            permisoFinanzas: u.permisoFinanzas || false,
            permisoTurnos: u.permisoTurnos || false,
            permisoClientes: u.permisoClientes || false,
            permisoPlanes: u.permisoPlanes || false,
            permisoFeriados: u.permisoFeriados || false
        });
        setShowForm(true);
    };

    const handleEliminar = async (id) => {
        if (window.confirm("¿Seguro que deseas eliminar este empleado?")) {
            try {
                const res = await api.delete(`/api/auth/usuarios/${id}`);
                if (res.data.success) {
                    setUsuarios(usuarios.filter(u => u.id !== id));
                }
            } catch (err) {
                console.error("Error eliminar:", err);
                alert(err.response?.data?.message || 'Error al eliminar empleado');
            }
        }
    };

    if (!hasPermission('esAdmin')) {
        return <div style={{padding:'20px', color:'red'}}>No tienes permisos para ver esta pantalla.</div>;
    }

    return (
        <div className="main-content">
            <PageHeader
                title="Gestión de Empleados"
                subtitle="Administra accesos y permisos"
                image="/img/welcome-background.png"
            />
            
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ color: '#333639', margin: 0, fontSize: '2rem' }}>Personal Autorizado</h1>
                        <p style={{ color: '#666', margin: '5px 0 0 0' }}>Crea accesos con permisos granulares.</p>
                    </div>
                    <button 
                        className="btn-primary" 
                        onClick={() => {
                            setUsuarioEditando(null);
                            setFormData({
                                nombre: '', usuario: '', email: '', password: '', esSuperAdmin: false, esAdmin: false,
                                permisoFinanzas: false, permisoTurnos: false, permisoClientes: false,
                                permisoPlanes: false, permisoFeriados: false
                            });
                            setShowForm(true);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#333639', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        <UserPlus size={20} /> Agregar Usuario
                    </button>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#fff1f1', color: '#e03131', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="contenedor-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Rol Principal</th>
                                <th>Permisos Extra</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                                        <Loader2 className="animate-spin" style={{ margin: '0 auto', color: '#333639' }} />
                                    </td>
                                </tr>
                            ) : usuarios.map(u => (
                                <tr key={u.id}>
                                    <td><strong>{u.nombre}</strong></td>
                                    <td>@{u.usuario}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        {u.esSuperAdmin ? (
                                            <span style={{ backgroundColor: '#e60049', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>SUPER ADMIN</span>
                                        ) : u.esAdmin ? (
                                            <span style={{ backgroundColor: '#333639', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>ADMIN</span>
                                        ) : (
                                            <span style={{ backgroundColor: '#eee', color: '#666', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>STAFF</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            {u.permisoFinanzas && <span style={{ backgroundColor: '#e6f9ee', color: '#2b8a3e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>Finanzas</span>}
                                            {u.permisoTurnos && <span style={{ backgroundColor: '#e1f0ff', color: '#00a8e8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>Turnos</span>}
                                            {u.permisoClientes && <span style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>Clientes</span>}
                                            {u.permisoPlanes && <span style={{ backgroundColor: '#e2e3e5', color: '#383d41', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>Planes</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => handleEditar(u)}
                                                style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#00a8e8' }}
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            {!u.esSuperAdmin && (
                                                <button 
                                                    onClick={() => handleEliminar(u.id)}
                                                    style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#e60049' }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo Usuario">
                    <form onSubmit={handleSubmit} style={{ padding: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre Completo</label>
                                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre de Usuario (Login)</label>
                                <input type="text" name="usuario" value={formData.usuario} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Contraseña</label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleInputChange} 
                                    required={!usuarioEditando} 
                                    placeholder={usuarioEditando ? "Dejar en blanco para no cambiarla" : ""}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
                                />
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
                                <input 
                                    type="checkbox" 
                                    id="esAdmin" 
                                    name="esAdmin"
                                    checked={formData.esAdmin}
                                    onChange={handleAdminToggle}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="esAdmin" style={{ fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', color: '#333639' }}>Administrador Total</label>
                            </div>

                            <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#666' }}>Permisos Específicos:</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {[
                                    { id: 'permisoFinanzas', label: 'Ver Finanzas y Pagos' },
                                    { id: 'permisoTurnos', label: 'Manejar Turnos' },
                                    { id: 'permisoClientes', label: 'Gestionar Clientes' },
                                    { id: 'permisoPlanes', label: 'Gestionar Planes' },
                                    { id: 'permisoFeriados', label: 'Gestionar Feriados' }
                                ].map(p => (
                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input 
                                            type="checkbox" 
                                            id={p.id} 
                                            name={p.id}
                                            checked={formData[p.id]}
                                            onChange={handleInputChange}
                                            disabled={formData.esAdmin}
                                            style={{ width: '16px', height: '16px', cursor: formData.esAdmin ? 'not-allowed' : 'pointer' }}
                                        />
                                        <label htmlFor={p.id} style={{ cursor: formData.esAdmin ? 'not-allowed' : 'pointer', color: formData.esAdmin ? '#999' : '#333' }}>
                                            {p.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button type="submit" style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#333639', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                                Guardar
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default Usuarios;
