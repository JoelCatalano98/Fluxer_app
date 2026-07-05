import { useState, useEffect } from 'react';
import { Palette, Upload, ShoppingBag, CircleCheck, Briefcase, RotateCcw, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import '../styles/style.css';
import '../styles/Servicios/configuracion_local.css';

const Configuracion = () => {
  const [config, setConfig] = useState({
    nombreGimnasio: '',
    logoBase64: null,
    bloquearCapacidad: false,
    capacidadMaxima: 10
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Cargar configuración al iniciar
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/configuracion');
        if (res.data.success) {
          setConfig({
            nombreGimnasio: res.data.data.nombreGimnasio || '',
            logoBase64: res.data.data.logoBase64 || null,
            bloquearCapacidad: res.data.data.bloquearCapacidad || false,
            capacidadMaxima: res.data.data.capacidadMaxima || 10
          });
        }
      } catch (err) {
        console.error('Error al cargar configuración:', err);
        setMessage({ text: 'Error al cargar la configuración.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida.');
        return;
      }

      // Validar tamaño (máx 2MB recomendado para evitar sobrecarga en DB)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen seleccionada supera el límite recomendado de 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig(prev => ({ ...prev, logoBase64: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setConfig(prev => ({ ...prev, logoBase64: null }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });

      const res = await api.put('/api/configuracion', config);

      if (res.data.success) {
        setMessage({ text: '¡Configuración guardada con éxito!', type: 'success' });
        // Recargar el navbar/sidebar para actualizar el logo dinámico
        window.dispatchEvent(new Event('configUpdated'));
      }
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      setMessage({ text: 'Error al guardar la configuración.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('¿Estás seguro de que deseas descartar los cambios y restaurar la configuración guardada?')) {
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent-blue)', margin: '0 auto' }} />
          <p style={{ marginTop: '15px', color: '#666' }}>Cargando configuración general...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Encabezado Estandarizado */}
      <PageHeader
        title="Configuración General"
        subtitle="Reglas de negocio e identidad visual de la marca"
        image="/img/welcome-background.png"
      />

      {/* Alertas */}
      {message.text && (
        <div style={{
          backgroundColor: message.type === 'success' ? '#ebfbee' : '#fff1f1',
          color: message.type === 'success' ? '#2f9e44' : '#e03131',
          padding: '15px',
          borderRadius: '8px',
          margin: '20px 30px 0 30px',
          fontWeight: '500',
          border: `1px solid ${message.type === 'success' ? '#b2f2bb' : '#ffc9c9'}`
        }}>
          {message.text}
        </div>
      )}

      <form className="contenedor-configuracion" onSubmit={handleSave}>
        <div className="grid-configuracion">

          {/* 1. DATOS DEL LOCAL (BRANDING) */}
          <section className="seccion-configuracion">
            <div className="cabecera-seccion">
              <Palette size={24} className="icon-blue" />
              <h2>1. Identidad y Branding</h2>
            </div>

            <div className="cuerpo-seccion">
              <div className="subida-logo">
                <div className="vista-previa-logo" style={{ cursor: config.logoBase64 ? 'pointer' : 'default' }} title={config.logoBase64 ? 'Hacé clic para quitar logo' : ''} onClick={config.logoBase64 ? handleRemoveLogo : undefined}>
                  {config.logoBase64 ? (
                    <img src={config.logoBase64} alt="Logo Gimnasio" />
                  ) : (
                    <ShoppingBag size={40} className="icon-blue" />
                  )}
                </div>
                <div className="info-subida">
                  <label className="btn-upload">
                    <Upload size={18} /> Subir Logo Personalizado
                    <input type="file" accept="image/*" hidden onChange={handleLogoChange} />
                  </label>
                  {config.logoBase64 && (
                    <button type="button" onClick={handleRemoveLogo} style={{
                      display: 'block',
                      background: 'none',
                      border: 'none',
                      color: '#e03131',
                      fontSize: '0.85rem',
                      marginTop: '8px',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}>
                      Quitar logo
                    </button>
                  )}
                  <p className="p-ayuda">Aparecerá en la barra lateral y reportes.</p>
                </div>
              </div>

              <div className="formulario-config" style={{ gridTemplateColumns: '1fr' }}>
                <div className="grupo-entrada full-width">
                  <label htmlFor="nombreGimnasio">Nombre del Gimnasio</label>
                  <input
                    type="text"
                    id="nombreGimnasio"
                    value={config.nombreGimnasio}
                    onChange={handleInputChange}
                    placeholder="Ej: Fluxer Fitness Center"
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. PARÁMETROS DE FUNCIONAMIENTO */}
          <section className="seccion-configuracion">
            <div className="cabecera-seccion">
              <Briefcase size={24} className="icon-blue" />
              <h2>2. Reglas de Negocio Globales</h2>
            </div>

            <div className="cuerpo-seccion">
              <div className="formulario-config" style={{ gridTemplateColumns: '1fr' }}>
                <div className="grupo-entrada">
                  <label htmlFor="capacidadMaxima">Capacidad Máxima por Horario</label>
                  <div className="input-con-unidad">
                    <input
                      type="number"
                      id="capacidadMaxima"
                      value={config.capacidadMaxima}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                    <span>personas</span>
                  </div>
                </div>
              </div>

              <div className="grupo-conmutador">
                <div className="info-conmutador">
                  <h4>Bloquear Capacidad por Horario</h4>
                  <p>Impedir agendamientos si la cantidad de personas anotadas es igual o mayor al límite.</p>
                </div>
                <label className="interruptor">
                  <input
                    type="checkbox"
                    id="bloquearCapacidad"
                    checked={config.bloquearCapacidad}
                    onChange={handleInputChange}
                  />
                  <span className="deslizador">
                    <span className="perilla"></span>
                  </span>
                </label>
              </div>
            </div>
          </section>
        </div>

        <div className="acciones-finales-config">
          <button type="button" className="btn-discard" onClick={handleDiscard} disabled={saving}>
            <RotateCcw size={18} /> Descartar Cambios
          </button>
          <button type="submit" className="btn-save-config" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Guardando...
              </>
            ) : (
              <>
                <CircleCheck size={20} /> Guardar Configuración
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Configuracion;
