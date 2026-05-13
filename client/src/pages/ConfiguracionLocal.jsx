import { useState } from 'react';
import { Palette, Upload, ShoppingBag, CircleCheck, Briefcase, Camera, MessageCircle, RotateCcw } from 'lucide-react';
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
      <section id="content-header" style={{ 
          minHeight: '100px', 
          height: '450px', 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'flex-end', // Empuja el contenido hacia abajo
          padding: '0 40px 40px 40px', // Agregamos 40px al final para que no toque el borde
          overflow: 'hidden' 
}}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Configuración Local</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Reglas de negocio e identidad visual</p>
        </div>
        <img src="/img/welcome-background.png" alt="Fondo" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          zIndex: 1 
        }} />
      </section>

      <div className="contenedor-configuracion" style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'stretch', justifyContent: 'flex-start' }}>

          {/* 1. DATOS DEL LOCAL (BRANDING) */}
          <section className="seccion-configuracion" style={{ flex: '1 1 500px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', minWidth: '650px', display: 'flex', flexDirection: 'column' }}>
            <div className="cabecera-seccion" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
              <Palette size={24} color="#00a8e8" />
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>1. Identidad y Branding</h2>
            </div>

            <div style={{ flex: 1 }}>
              <div className="subida-logo" style={{ display: 'flex', gap: '25px', alignItems: 'center', marginBottom: '30px' }}>
                <div className="vista-previa-logo" style={{ 
                  width: '100px', 
                  height: '100px', 
                  border: '2px dashed #e0e0e0', 
                  borderRadius: '15px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'hidden',
                  backgroundColor: '#fafafa'
                }}>
                  {config.logo ? (
                    <img src={config.logo} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <ShoppingBag size={40} color="#00a8e8" />
                  )}
                </div>
                <div className="info-subida">
                  <label className="btn-help" style={{ 
                    cursor: 'pointer', 
                    background: '#00a8e8', 
                    color: 'white', 
                    border: 'none', 
                    padding: '10px 20px', 
                    borderRadius: '8px', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontWeight: '600'
                  }}>
                    <Upload size={18} /> Subir Logo Personalizado
                    <input type="file" hidden onChange={handleLogoChange} />
                  </label>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#888' }}>Aparecerá en tickets y barra lateral.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444' }}>Nombre del Gimnasio</label>
                  <input type="text" id="gymName" value={config.gymName} onChange={handleInputChange} placeholder="Ej: J.C. Fitness Center" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444' }}>Dirección Física</label>
                  <input type="text" id="address" value={config.address} onChange={handleInputChange} placeholder="Calle, Altura, Ciudad" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444' }}>Teléfono</label>
                  <input type="tel" id="phone" value={config.phone} onChange={handleInputChange} placeholder="+54 9 ..." style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Camera size={16} /> Instagram
                  </label>
                  <input type="text" id="instagram" value={config.instagram} onChange={handleInputChange} placeholder="@usuario" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MessageCircle size={16} /> WhatsApp Link
                  </label>
                  <input type="text" id="whatsapp" value={config.whatsapp} onChange={handleInputChange} placeholder="wa.me/xxxx" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
              </div>
            </div>
          </section>

          {/* 2. PARÁMETROS DE FUNCIONAMIENTO */}
          <section className="seccion-configuracion" style={{ flex: '1 1 500px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', minWidth: '650px', display: 'flex', flexDirection: 'column' }}>
            <div className="cabecera-seccion" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
              <Briefcase size={24} color="#00a8e8" />
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>2. Reglas de Negocio</h2>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444' }}>Horario Operativo (Apertura)</label>
                  <input type="time" id="openTime" value={config.openTime} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444' }}>Horario Operativo (Cierre)</label>
                  <input type="time" id="closeTime" value={config.closeTime} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444' }}>Capacidad Máxima por Hora</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="number" id="maxCapacity" value={config.maxCapacity} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>socios</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#444' }}>Margen de Cancelación</label>
                  <select id="cancelMargin" value={config.cancelMargin} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <option value="2">2 Horas antes</option>
                    <option value="4">4 Horas antes</option>
                    <option value="12">12 Horas antes</option>
                    <option value="24">24 Horas antes</option>
                  </select>
                </div>
              </div>

              <div className="grupo-conmutador" style={{ 
                marginTop: '30px', 
                paddingTop: '20px', 
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div className="info-conmutador">
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>Bloqueo por Capacidad</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#777' }}>Impedir anotaciones si se llega al límite establecido.</p>
                </div>
                <label className="interruptor" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                  <input type="checkbox" id="blockCapacity" checked={config.blockCapacity} onChange={handleInputChange} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span className="deslizador" style={{ 
                    position: 'absolute', 
                    cursor: 'pointer', 
                    top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: config.blockCapacity ? '#00a8e8' : '#ccc', 
                    transition: '.4s', 
                    borderRadius: '34px' 
                  }}>
                    <span style={{ 
                      position: 'absolute', 
                      content: '""', 
                      height: '18px', width: '18px', 
                      left: config.blockCapacity ? '28px' : '4px', 
                      bottom: '4px', 
                      backgroundColor: 'white', 
                      transition: '.4s', 
                      borderRadius: '50%' 
                    }}></span>
                  </span>
                </label>
              </div>
            </div>
          </section>
        </div>

        <div className="acciones-finales-configuracion" style={{ 
          marginTop: '40px', 
          display: 'flex', 
          justifyContent: 'flex-start', 
          gap: '15px',
          paddingBottom: '30px',
          width: 'auto',
          border: 'none',
          background: 'transparent'
        }}>

          <button 
            type="button" 
            onClick={handleDiscard}
            style={{ 
              padding: '12px 25px', 
              border: '1px solid #ddd', 
              background: 'white', 
              borderRadius: '8px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              color: '#666'
            }}
          >
            <RotateCcw size={18} /> Descartar
          </button>
          <button 
            className="btn-help" 
            onClick={handleSave}
            style={{ 
              minWidth: '220px', 
              background: '#00a8e8', 
              color: 'white', 
              border: 'none', 
              padding: '12px 30px', 
              borderRadius: '8px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px',
              boxShadow: '0 4px 12px rgba(0, 168, 232, 0.25)'
            }} 
          >
            <CircleCheck size={20} /> Aplicar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionLocal;
