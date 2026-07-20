import { useState, useEffect } from 'react';
import { SquarePlus, Trash2, Pencil, Loader2, Dumbbell, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import api from '../services/api';
import '../styles/style.css';

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState(null);

  // Estado de Formulario
  const [formValues, setFormValues] = useState({
    nombre: '',
    planId: '',
    profesionalId: ''
  });

  const [submitting, setSubmitting] = useState(false);

  // Cargar categorías y planes
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resCategorias, resPlanes, resProfesionales] = await Promise.all([
        api.get('/api/categorias'),
        api.get('/api/planes'),
        api.get('/api/profesionales')
      ]);

      if (resCategorias.data.success) {
        setCategorias(resCategorias.data.data);
      }
      if (resPlanes.data.success) {
        setPlanes(resPlanes.data.data);
      }
      if (resProfesionales.data.success) {
        setProfesionales(resProfesionales.data.data);
      }
    } catch (err) {
      console.error('Error al cargar datos de categorías/planes:', err);
      setError('Error al conectar con el servidor. No se pudieron obtener los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const openCreateModal = () => {
    setSelectedCategoria(null);
    setFormValues({
      nombre: '',
      planId: '',
      profesionalId: ''
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (categoria) => {
    setSelectedCategoria(categoria);
    setFormValues({
      nombre: categoria.nombre,
      planId: categoria.planId ? String(categoria.planId) : '',
      profesionalId: categoria.profesionalId ? String(categoria.profesionalId) : ''
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        nombre: formValues.nombre,
        planId: formValues.planId ? parseInt(formValues.planId) : null,
        profesionalId: formValues.profesionalId ? parseInt(formValues.profesionalId) : null
      };

      if (selectedCategoria) {
        // Editar
        const res = await api.put(`/api/categorias/${selectedCategoria.id}`, payload);
        if (res.data.success) {
          alert('¡Categoría actualizada con éxito!');
        }
      } else {
        // Crear
        const res = await api.post('/api/categorias', payload);
        if (res.data.success) {
          alert('¡Categoría creada con éxito!');
        }
      }

      setIsFormModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error al guardar categoría:', err);
      alert('Ocurrió un error al guardar la categoría.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoria) => {
    const confirm = window.confirm(`¿Estás seguro de que deseas dar de baja la categoría "${categoria.nombre}"?`);
    if (!confirm) return;

    try {
      const res = await api.delete(`/api/categorias/${categoria.id}`);
      if (res.data.success) {
        alert('¡Categoría eliminada con éxito!');
        loadData();
      }
    } catch (err) {
      console.error('Error al dar de baja categoría:', err);
      alert('Error al intentar dar de baja la categoría.');
    }
  };

  return (
    <div className="main-content">
      {/* Encabezado */}
      <PageHeader
        title="Gestión de Disciplinas"
        subtitle="Mapea las disciplinas de tu gimnasio y vinculalas con los planes y profesionales"
        image="/img/welcome-background.png"
      />

      {/* Alerta de Error */}
      {error && (
        <div style={{ backgroundColor: '#fff1f1', color: '#e03131', padding: '15px', borderRadius: '8px', margin: '20px 30px 0 30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Botón de Acción */}
      <div style={{ padding: '20px 30px 10px 30px', display: 'flex', justifyContent: 'flex-start' }}>
        <button 
          className="btn-primary" 
          onClick={openCreateModal}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 20px', 
            borderRadius: '8px', 
            fontWeight: '600'
          }}
        >
          <SquarePlus size={18} /> Nueva Disciplina
        </button>
      </div>

      {/* Tabla de Datos */}
      <div className="table-section" style={{ padding: '0 5px 0px 0px' }}>
        <div className="contenedor-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Nombre de la Disciplina</th>
                <th>Plan Asociado</th>
                <th>Profesional</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--accent-blue)' }} />
                    <p style={{ marginTop: '10px', color: '#666' }}>Cargando disciplinas...</p>
                  </td>
                </tr>
              ) : categorias.length > 0 ? (
                categorias.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.id}</td>
                    <td style={{ fontWeight: '600', color: 'var(--primary-dark)' }}>{cat.nombre}</td>
                    <td>
                      {cat.plan ? (
                        <span style={{ 
                          backgroundColor: '#e1f0ff', 
                          color: 'var(--accent-blue)', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontWeight: '600',
                          fontSize: '0.85rem'
                        }}>
                          {cat.plan.nombre}
                        </span>
                      ) : (
                        <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.85rem' }}>
                          Sin Plan asignado
                        </span>
                      )}
                    </td>
                    <td>
                      {cat.profesional ? (
                        <span style={{ 
                          backgroundColor: '#e6fcf5', 
                          color: '#0ca678', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontWeight: '600',
                          fontSize: '0.85rem'
                        }}>
                          {cat.profesional.nombre} {cat.profesional.apellido}
                        </span>
                      ) : (
                        <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.85rem' }}>
                          Sin Profesional
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                          onClick={() => openEditModal(cat)}
                          title="Editar"
                          style={{
                            border: 'none',
                            background: '#f0f4f8',
                            color: '#00a8e8',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          title="Dar de baja"
                          style={{
                            border: 'none',
                            background: '#fff1f1',
                            color: '#e03131',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                    No hay disciplinas registradas en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Formulario (Crear/Editar) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={
          <span>
            <Dumbbell size={20} className="modal-title-icon" />{' '}
            {selectedCategoria ? 'Editar Disciplina' : 'Nueva Disciplina'}
          </span>
        }
      >
        <form className="turnos-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <p style={{ marginBottom: '20px', color: '#666' }}>
              {selectedCategoria 
                ? 'Modifica los datos de la disciplina seleccionada.' 
                : 'Completa los siguientes campos para registrar una nueva disciplina.'}
            </p>

            <div className="grupo-entrada" style={{ marginBottom: '20px' }}>
              <label htmlFor="nombre" style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Nombre de la Disciplina *</label>
              <input
                type="text"
                id="nombre"
                value={formValues.nombre}
                onChange={handleInputChange}
                placeholder="Ej: CrossFit, Spinning, Funcional"
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="grupo-entrada" style={{ marginBottom: '20px' }}>
              <label htmlFor="planId" style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Asignar Plan</label>
              <select
                id="planId"
                value={formValues.planId}
                onChange={handleInputChange}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="">-- Sin Plan (Selecciona uno para vincular) --</option>
                {planes.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre} ({plan.frecuencia})
                  </option>
                ))}
              </select>
            </div>

            <div className="grupo-entrada" style={{ marginBottom: '20px' }}>
              <label htmlFor="profesionalId" style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Profesional Asignado</label>
              <select
                id="profesionalId"
                value={formValues.profesionalId}
                onChange={handleInputChange}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="">-- Sin Profesional (Selecciona uno) --</option>
                {profesionales.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nombre} {prof.apellido}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="acciones-formulario" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsFormModalOpen(false)}
              disabled={submitting}
              style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-save-config"
              disabled={submitting}
              style={{ 
                padding: '10px 25px', 
                borderRadius: '8px', 
                border: 'none', 
                background: 'var(--accent-blue)', 
                color: 'white', 
                fontWeight: '600', 
                cursor: 'pointer'
              }}
            >
              {submitting ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categorias;