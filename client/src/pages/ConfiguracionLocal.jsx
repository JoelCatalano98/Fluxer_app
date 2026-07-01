import { useState } from 'react';
import { Palette, Upload, ShoppingBag, CircleCheck, Briefcase, Camera, MessageCircle, RotateCcw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import '../styles/style.css';
import '../styles/Servicios/configuracion_local.css';

const ConfiguracionLocal = () => {
  const [config, setConfig] = useState({
    gymName: 'J.C. Fitness Center',
    address: '',
    phone: '',
    instagram: '',
    whatsapp: '',
    openTime: '07:00',
    closeTime: '22:00',
    maxCapacity: 20,
    cancelMargin: '4',
    blockCapacity: true,
    logo: null
  });

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig(prev => ({ ...prev, logo: event.target.result }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    alert(`¡Configuración de "${config.gymName}" guardada con éxito!`);
    console.log('Configuración guardada:', config);
  };

  const handleDiscard = () => {
    if (window.confirm('¿Estás seguro de que deseas descartar los cambios?')) {
      window.location.reload();
    }
  };

  return (
    <div className="main-content">
      {/* Encabezado Estandarizado */}
      <PageHeader
        className="dashboard-header config-header"
        title="Configuración Local"
        subtitle="Reglas de negocio e identidad visual"
        image="/img/welcome-background.png"
      />

      <div className="contenedor-configuracion">
        <div className="grid-configuracion">

          {/* 1. DATOS DEL LOCAL (BRANDING) */}
          <section className="seccion-configuracion">
            <div className="cabecera-seccion">
              <Palette size={24} className="icon-blue" />
              <h2>1. Identidad y Branding</h2>
            </div>

            <div className="cuerpo-seccion">
              <div className="subida-logo">
                <div className="vista-previa-logo">
                  {config.logo ? (
                    <img src={config.logo} alt="Logo Preview" />
                  ) : (
                    <ShoppingBag size={40} className="icon-blue" />
                  )}
                </div>
                <div className="info-subida">
                  <label className="btn-upload">
                    <Upload size={18} /> Subir Logo Personalizado
                    <input type="file" hidden onChange={handleLogoChange} />
                  </label>
                  <p className="p-ayuda">Aparecerá en tickets y barra lateral.</p>
                </div>
              </div>

              <div className="formulario-config">
                <div className="grupo-entrada full-width">
                  <label htmlFor="gymName">Nombre del Gimnasio</label>
                  <input type="text" id="gymName" value={config.gymName} onChange={handleInputChange} placeholder="Ej: J.C. Fitness Center" />
                </div>
                <div className="grupo-entrada">
                  <label htmlFor="address">Dirección Física</label>
                  <input type="text" id="address" value={config.address} onChange={handleInputChange} placeholder="Calle, Altura, Ciudad" />
                </div>
                <div className="grupo-entrada">
                  <label htmlFor="phone">Teléfono</label>
                  <input type="tel" id="phone" value={config.phone} onChange={handleInputChange} placeholder="+54 9 ..." />
                </div>
                <div className="grupo-entrada">
                  <label htmlFor="instagram" className="label-con-icono">
                    <Camera size={16} /> Instagram
                  </label>
                  <input type="text" id="instagram" value={config.instagram} onChange={handleInputChange} placeholder="@usuario" />
                </div>
                <div className="grupo-entrada">
                  <label htmlFor="whatsapp" className="label-con-icono">
                    <MessageCircle size={16} /> WhatsApp Link
                  </label>
                  <input type="text" id="whatsapp" value={config.whatsapp} onChange={handleInputChange} placeholder="wa.me/xxxx" />
                </div>
              </div>
            </div>
          </section>

          {/* 2. PARÁMETROS DE FUNCIONAMIENTO */}
          <section className="seccion-configuracion">
            <div className="cabecera-seccion">
              <Briefcase size={24} className="icon-blue" />
              <h2>2. Reglas de Negocio</h2>
            </div>

            <div className="cuerpo-seccion">
              <div className="formulario-config">
                <div className="grupo-entrada">
                  <label htmlFor="openTime">Horario Operativo (Apertura)</label>
                  <input type="time" id="openTime" value={config.openTime} onChange={handleInputChange} />
                </div>
                <div className="grupo-entrada">
                  <label htmlFor="closeTime">Horario Operativo (Cierre)</label>
                  <input type="time" id="closeTime" value={config.closeTime} onChange={handleInputChange} />
                </div>
                <div className="grupo-entrada">
                  <label htmlFor="maxCapacity">Capacidad Máxima por Hora</label>
                  <div className="input-con-unidad">
                    <input type="number" id="maxCapacity" value={config.maxCapacity} onChange={handleInputChange} />
                    <span>socios</span>
                  </div>
                </div>
                <div className="grupo-entrada">
                  <label htmlFor="cancelMargin">Margen de Cancelación</label>
                  <select id="cancelMargin" value={config.cancelMargin} onChange={handleInputChange}>
                    <option value="2">2 Horas antes</option>
                    <option value="4">4 Horas antes</option>
                    <option value="12">12 Horas antes</option>
                    <option value="24">24 Horas antes</option>
                  </select>
                </div>
              </div>

              <div className="grupo-conmutador">
                <div className="info-conmutador">
                  <h4>Bloqueo por Capacidad</h4>
                  <p>Impedir anotaciones si se llega al límite establecido.</p>
                </div>
                <label className="interruptor">
                  <input type="checkbox" id="blockCapacity" checked={config.blockCapacity} onChange={handleInputChange} />
                  <span className="deslizador">
                    <span className="perilla"></span>
                  </span>
                </label>
              </div>
            </div>
          </section>
        </div>

        <div className="acciones-finales-config">
          <button type="button" className="btn-discard" onClick={handleDiscard}>
            <RotateCcw size={18} /> Descartar
          </button>
          <button type="button" className="btn-save-config" onClick={handleSave}>
            <CircleCheck size={20} /> Aplicar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionLocal;
