import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Cargar usuario desde local storage al inicio
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (loginInput, password) => {
        try {
            const response = await api.post('/api/auth/login', { loginInput, password });
            if (response.data.success) {
                // Si el backend indica que requiere selección de sucursal (flujo multi-sucursal)
                if (response.data.needsBranchSelection) {
                    return {
                        success: true,
                        needsBranchSelection: true,
                        tempToken: response.data.tempToken,
                        branches: response.data.branches
                    };
                }

                // Flujo normal (1 sucursal o feature desactivada)
                const { token, usuario } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(usuario));
                setUser(usuario);
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Error al conectar con el servidor'
            };
        }
    };

    const selectBranchForLogin = async (branchId, tempToken) => {
        try {
            const response = await api.post(
                '/api/auth/select-branch',
                { branchId },
                {
                    headers: {
                        Authorization: `Bearer ${tempToken}`
                    }
                }
            );

            if (response.data.success) {
                const { token, usuario } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(usuario));
                setUser(usuario);
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                status: error.response?.status,
                message: error.response?.data?.message || 'Error al conectar con el servidor'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const hasPermission = (permiso) => {
        if (!user) return false;
        if (user.esSuperAdmin || user.esAdmin) return true;
        return user[permiso] === true;
    };

    if (loading) {
        return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>Cargando...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, selectBranchForLogin, logout, hasPermission, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
