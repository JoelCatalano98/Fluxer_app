import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useTurnos = (fechaInicio = null, fechaFin = null) => {
  const [turnos, setTurnos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHorarios = useCallback(async () => {
    try {
      const res = await api.get('/api/turnos/horarios');
      if (res.data.success) {
        setHorarios(res.data.data);
      } else {
        throw new Error(res.data.message || 'Error al obtener configuración de horarios');
      }
    } catch (err) {
      console.error('Error fetchHorarios:', err);
      setError('Error al cargar la configuración de horarios.');
    }
  }, []);

  const fetchTurnos = useCallback(async (start = fechaInicio, end = fechaFin) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/turnos';
      if (start && end) {
        url += `?fechaInicio=${start}&fechaFin=${end}`;
      }

      const res = await api.get(url);
      if (res.data.success) {
        setTurnos(res.data.data);
      } else {
        throw new Error(res.data.message || 'Error al obtener turnos');
      }
    } catch (err) {
      console.error('Error fetchTurnos:', err);
      setError('Error al cargar la lista de turnos.');
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    const init = async () => {
      await fetchHorarios();
      await fetchTurnos();
    };
    init();
  }, [fetchHorarios, fetchTurnos]);

  const crearTurno = async (turnoData) => {
    try {
      setError(null);
      const res = await api.post('/api/turnos', turnoData);
      if (res.data.success) {
        if (Array.isArray(res.data.data)) {
          setTurnos(prev => [...res.data.data, ...prev]);
        } else {
          setTurnos(prev => [res.data.data, ...prev]);
        }
        return res.data.data;
      } else {
        throw new Error(res.data.message || 'Error al crear turno');
      }
    } catch (err) {
      console.error('Error crearTurno:', err);
      const errMsg = err.response?.data?.message || err.message || 'Error al crear turno';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const cancelarTurno = async (id) => {
    try {
      setError(null);
      const res = await api.delete(`/api/turnos/${id}`);
      if (res.data.success) {
        setTurnos(prev => prev.filter(t => t.id !== id));
        return true;
      } else {
        throw new Error(res.data.message || 'Error al cancelar turno');
      }
    } catch (err) {
      console.error('Error cancelarTurno:', err);
      const errMsg = err.response?.data?.message || err.message || 'Error al cancelar turno';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const crearHorario = async (horarioData) => {
    try {
      setError(null);
      const res = await api.post('/api/turnos/horarios', horarioData);
      if (res.data.success) {
        setHorarios(prev => {
          const updated = [...prev, res.data.data];
          // Ordenar por dia_semana y luego por hora_inicio
          return updated.sort((a, b) => {
            if (a.dia_semana !== b.dia_semana) {
              return a.dia_semana - b.dia_semana;
            }
            return a.hora_inicio.localeCompare(b.hora_inicio);
          });
        });
        return res.data.data;
      } else {
        throw new Error(res.data.message || 'Error al configurar horario');
      }
    } catch (err) {
      console.error('Error crearHorario:', err);
      const errMsg = err.response?.data?.message || err.message || 'Error al configurar horario';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const editarHorario = async (id, horarioData) => {
    try {
      setError(null);
      const res = await api.put(`/api/turnos/horarios/${id}`, horarioData);
      if (res.data.success) {
        setHorarios(prev => {
          const updated = prev.map(h => h.id === id ? res.data.data : h);
          return updated.sort((a, b) => {
            if (a.dia_semana !== b.dia_semana) {
              return a.dia_semana - b.dia_semana;
            }
            return a.hora_inicio.localeCompare(b.hora_inicio);
          });
        });
        return res.data.data;
      } else {
        throw new Error(res.data.message || 'Error al actualizar horario');
      }
    } catch (err) {
      console.error('Error editarHorario:', err);
      const errMsg = err.response?.data?.message || err.message || 'Error al actualizar horario';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const eliminarHorario = async (id) => {
    try {
      setError(null);
      const res = await api.delete(`/api/turnos/horarios/${id}`);
      if (res.data.success) {
        setHorarios(prev => prev.filter(h => h.id !== id));
        return true;
      } else {
        throw new Error(res.data.message || 'Error al eliminar horario');
      }
    } catch (err) {
      console.error('Error eliminarHorario:', err);
      const errMsg = err.response?.data?.message || err.message || 'Error al eliminar horario';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  return {
    turnos,
    horarios,
    loading,
    error,
    fetchTurnos,
    fetchHorarios,
    crearTurno,
    cancelarTurno,
    crearHorario,
    editarHorario,
    eliminarHorario
  };
};
