import React, { useState, useEffect } from 'react';
import { Network, Plus, Trash2, Edit, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/sucursales.css';

const Sucursales = () => {
    const { user } = useAuth();
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Estado A: Inicializar
    const [initForm, setInitForm] = useState({ nombre: '', direccion: '' });
    const [migrationResult, setMigrationResult] = useState(null);

    // Estado B: CRUD
    const [branches, setBranches] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [branchForm, setBranchForm] = useState({ nombre: '', direccion: '', telefono: '', personaACargo: '' });
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            setLoading(true);
            const [paramRes, branchesRes] = await Promise.all([
                api.get('/api/parametros'),
                api.get('/api/branches').catch(() => ({ data: { success: false } }))
            ]);

            let enabled = false;
            if (paramRes.data.success) {
                const p = paramRes.data.data.find(x => x.clave === 'multiSucursalHabilitado');
                enabled = p?.valor === 'true';
            }

            setIsEnabled(enabled);

            if (enabled && branchesRes.data?.success) {
                setBranches(branchesRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInitialize = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        try {
            const res = await api.post('/api/branches/initialize', initForm);
            if (res.data.success) {
                setMigrationResult(res.data.deltas);
                setIsEnabled(true);
                setBranches([{ ...initForm, activa: true, id: 1 }]); 
                checkStatus();
            } else {
                setErrorMsg(res.data.message || 'Error al inicializar');
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Error al inicializar');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBranch = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        try {
            if (editingBranch) {
                await api.patch(`/api/branches/${editingBranch.id}`, branchForm);
            } else {
                await api.post('/api/branches', branchForm);
            }
            setIsModalOpen(false);
            setEditingBranch(null);
            checkStatus();
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Error al guardar sucursal');
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (branchId) => {
        const activas = branches.filter(b => b.activa).length;
        if (activas <= 1) {
            alert('No puedes desactivar la última sucursal activa. El sistema siempre requiere al menos una sucursal.');
            return;
        }

        if (window.confirm('¿Estás seguro de desactivar esta sucursal?')) {
            try {
                await api.delete(`/api/branches/${branchId}`);
                checkStatus();
            } catch (error) {
                alert(error.response?.data?.message || 'Error al desactivar');
            }
        }
    };

    const openEditModal = (b) => {
        setEditingBranch(b);
        setBranchForm({
            nombre: b.nombre || '',
            direccion: b.direccion || '',
            telefono: b.telefono || '',
            personaACargo: b.personaACargo || ''
        });
        setIsModalOpen(true);
    };

    const openNewModal = () => {
        setEditingBranch(null);
        setBranchForm({ nombre: '', direccion: '', telefono: '', personaACargo: '' });
        setIsModalOpen(true);
    };

    if (loading) return <div style={{padding:'20px', textAlign:'center'}}>⏳ Cargando...</div>;

    if (!user?.esSuperAdmin) {
        return <div style={{padding:'20px', textAlign:'center', color:'red'}}>Acceso denegado. Solo para SuperAdmin.</div>;
    }

    return (
        <div className="main-content">
            <PageHeader 
                icon={Network} 
                title="Gestión de Sucursales" 
                subtitle="Administra las sedes de tu gimnasio"
                image="/img/welcome-background.png"
            />
            
            <div style={{ padding: '20px 30px' }}>
                {!isEnabled ? (
                <div className="sucursales-init-card">
                    <div className="sucursales-init-icon">
                        <Building2 size={32} />
                    </div>
                    <h2 className="sucursales-init-title">Activar Sistema Multi-Sucursal</h2>
                    <p className="sucursales-init-text">
                        Al activar este modo, todos los datos actuales serán migrados a una "Casa Central".
                        A partir de ahí, podrás crear nuevas sucursales y gestionar todo de forma aislada.
                    </p>

                    <form onSubmit={handleInitialize}>
                        <div className="sucursales-form-group">
                            <label>Nombre de la Sede Principal</label>
                            <input
                                required
                                type="text"
                                className="sucursales-input"
                                value={initForm.nombre}
                                onChange={e => setInitForm({...initForm, nombre: e.target.value})}
                                placeholder="Ej: Casa Central"
                                disabled={saving}
                            />
                        </div>
                        <div className="sucursales-form-group">
                            <label>Dirección (Opcional)</label>
                            <input
                                type="text"
                                className="sucursales-input"
                                value={initForm.direccion}
                                onChange={e => setInitForm({...initForm, direccion: e.target.value})}
                                disabled={saving}
                            />
                        </div>

                        {errorMsg && <div style={{color:'red', marginBottom:'15px', fontWeight:'600'}}>{errorMsg}</div>}

                        <button type="submit" disabled={saving} className="btn-primary" style={{ width: '100%' }}>
                            {saving ? <span className="animate-spin">⏳</span> : <Network size={20} />}
                            {saving ? 'Migrando Base de Datos (Por favor, espere)...' : 'Activar Multi-Sucursal'}
                        </button>
                    </form>
                </div>
            ) : (
                <div>
                    {migrationResult && (
                        <div className="migration-success-box">
                            <CheckCircle2 size={24} />
                            <div>
                                <h4 style={{margin:0}}>Migración exitosa</h4>
                                <p style={{margin:'5px 0 0 0', fontSize:'0.9rem'}}>Registros migrados a la nueva sucursal:</p>
                                <ul>
                                    {Object.entries(migrationResult).map(([key, val]) => (
                                        <li key={key}>• {key}: {val}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="sucursales-table-container">
                        <div className="sucursales-actions-header">
                            <h3>Sucursales Activas</h3>
                            <button onClick={openNewModal} className="btn-new-sucursal">
                                <Plus size={18} /> Nueva Sucursal
                            </button>
                        </div>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Dirección</th>
                                        <th>Persona a Cargo</th>
                                        <th>Estado</th>
                                        <th style={{textAlign:'right'}}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branches.map(b => (
                                        <tr key={b.id}>
                                            <td style={{fontWeight:'600'}}>{b.nombre}</td>
                                            <td>{b.direccion || '-'}</td>
                                            <td>{b.personaACargo || '-'}</td>
                                            <td>
                                                <span className={b.activa ? 'badge badge-success' : 'badge badge-danger'}>
                                                    {b.activa ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </td>
                                            <td style={{textAlign:'right'}}>
                                                <button onClick={() => openEditModal(b)} className="action-btn edit" title="Editar">
                                                    <Edit size={18} />
                                                </button>
                                                {b.activa && (
                                                    <button onClick={() => handleDeactivate(b.id)} className="action-btn delete" title="Desactivar" style={{marginLeft:'8px'}}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => !saving && setIsModalOpen(false)}>
                    <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{margin:0}}>{editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="close-modal">&times;</button>
                        </div>
                        <form onSubmit={handleSaveBranch} style={{padding:'10px 0'}}>
                            <div className="sucursales-form-group">
                                <label>Nombre</label>
                                <input required type="text" className="sucursales-input" value={branchForm.nombre} onChange={e => setBranchForm({...branchForm, nombre: e.target.value})} disabled={saving} />
                            </div>
                            <div className="sucursales-form-group">
                                <label>Dirección</label>
                                <input type="text" className="sucursales-input" value={branchForm.direccion} onChange={e => setBranchForm({...branchForm, direccion: e.target.value})} disabled={saving} />
                            </div>
                            <div className="sucursales-form-group">
                                <label>Teléfono</label>
                                <input type="text" className="sucursales-input" value={branchForm.telefono} onChange={e => setBranchForm({...branchForm, telefono: e.target.value})} disabled={saving} />
                            </div>
                            <div className="sucursales-form-group">
                                <label>Persona a Cargo (Opcional)</label>
                                <input type="text" className="sucursales-input" value={branchForm.personaACargo} onChange={e => setBranchForm({...branchForm, personaACargo: e.target.value})} placeholder="Ej: Juan Pérez" disabled={saving} />
                            </div>
                            
                            {errorMsg && <div style={{color:'red', marginBottom:'15px', fontWeight:'600'}}>{errorMsg}</div>}
                            
                            <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
                                <button type="button" onClick={() => setIsModalOpen(false)} disabled={saving} className="btn-secondary">Cancelar</button>
                                <button type="submit" disabled={saving} className="btn-primary" style={{width:'auto'}}>
                                    {saving ? <span className="animate-spin">⏳</span> : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default Sucursales;
