import { useState } from 'react';
import { Palette, Upload, ShoppingBag, CircleCheck } from 'lucide-react';import '../styles/style.css';
import '../styles/Servicios/configuracion_local.css';

const ConfiguracionLocal = () => {
  const [gymName, setGymName] = useState('J.C. Fitness Center');

  const handleSave = () => {
    alert(`¡Configuración de "${gymName}" guardada con éxito!`);
  };

  return (
    <div className="main-content">
      <section id="content-header" style={{ minHeight: '100px', height: '150px', justifyContent: 'center' }}>
        <h1 id="main-title" style={{ color: 'white', textAlign: 'left', margin: 0 }}>Configuración Local</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0' }}>Reglas de negocio e identidad visual</p>
        <img src="/img/welcome-background.png" alt="Fondo" style={{ height: '100%' }} />
      </section>

      <div className="contenedor-configuracion">
        <section className="seccion-configuracion">
          <div className="cabecera-seccion" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Palette size={24} color="#00a8e8" />
            <h2 style={{ margin: 0 }}>1. Identidad y Branding</h2>
          </div>

          <div className="subida-logo" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
            <div className="vista-previa-logo" style={{ width: '80px', height: '80px', border: '1px dashed #ddd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Cambiado: Shop por ShoppingBag */}
              <ShoppingBag size={40} color="#00a8e8" />
            </div>
            <div className="info-subida">
              <label className="btn-help" style={{ cursor: 'pointer', background: '#00a8e8', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} /> Subir Logo Personalizado
                <input type="file" hidden />
              </label>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#666' }}>Aparecerá en tickets y barra lateral.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Nombre del Gimnasio</label>
              <input type="text" value={gymName} onChange={(e) => setGymName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Dirección Física</label>
              <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Teléfono</label>
              <input type="tel" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
            </div>
          </div>
        </section>

        <div className="acciones-finales-configuracion" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button style={{ padding: '10px 20px', border: '1px solid #ddd', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Descartar</button>
          <button className="btn-help" style={{ minWidth: '250px', background: '#00a8e8', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleSave}>
            {/* Cambiado: CloudCheck por CheckCircle */}
            <CircleCheck size={20} /> Aplicar y Guardar Todo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionLocal;