import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Calcula el lunes de la semana a la que pertenece una fecha dada
const getLunesDeSemana = (fecha = new Date()) => {
  const d = new Date(fecha);
  const day = d.getDay(); // 0=Dom, 1=Lun...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Formatea una fecha a "YYYY-MM-DD"
const toDateStr = (fecha) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const useTurnos = (fechaBaseExterna = null) => {
  const [turnos, setTurnos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // La fecha base de la semana visible, controlada desde el componente padre
  const fechaBase = fechaBaseExterna || getLunesDeSemana();

  // Calcular lunes y sábado de la semana visible
  const lunes = getLunesDeSemana(fechaBase);
  const sabado = new Date(lunes);
  sabado.setDate(lunes.getDate() + 5);

  const fechaInicio = toDateStr(lunes);
  const fechaFin = toDateStr(sabado);

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

  const fetchTurnos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/turnos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
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

  // Re-fetch automático cuando cambia la semana visible
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
        // Refrescar desde el server para sincronizar con la semana visible
        await fetchTurnos();
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
        await fetchHorarios();
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
        await fetchHorarios();
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
        await fetchHorarios();
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
    fechaInicio,
    fechaFin,
    fetchTurnos,
    fetchHorarios,
    crearTurno,
    cancelarTurno,
    crearHorario,
    editarHorario,
    eliminarHorario
  };
};
