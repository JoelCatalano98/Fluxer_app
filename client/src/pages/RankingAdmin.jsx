import React, { useState, useEffect } from 'react';
import { Trophy, Medal, ChevronRight, Save, Loader2, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import '../styles/style.css';

const EJERCICIOS = ["Press Plano", "Sentadilla", "Peso Muerto", "Dominadas"];

const RankingAdmin = () => {
  const [selectedEjercicio, setSelectedEjercicio] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [adminNombre, setAdminNombre] = useState('Profesor');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [pesoMaximo, setPesoMaximo] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/api/configuracion');
      if (res.data.success && res.data.data.adminNombre) {
        setAdminNombre(res.data.data.adminNombre);
      }
    } catch (error) {
      console.error('Error al cargar config:', error);
    }
  };

  const loadRanking = async (ejercicio) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/ranking?ejercicio=${encodeURIComponent(ejercicio)}`);
      if (res.data.success) {
        setRanking(res.data.data);
      }
    } catch (error) {
      console.error('Error al cargar ranking', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEjercicio = (ej) => {
    setSelectedEjercicio(ej);
    setPesoMaximo('');
    loadRanking(ej);
  };

  const handleSavePeso = async (e) => {
    e.preventDefault();
    if (!pesoMaximo) {
        alert("Define el peso");
        return;
    }
    setSaving(true);
    try {
      const res = await api.post('/api/ranking', {
        clienteId: 'profesor',
        ejercicio: selectedEjercicio,
        pesoMaximo: parseFloat(pesoMaximo)
      });
      if (res.data.success) {
        setPesoMaximo('');
        loadRanking(selectedEjercicio);
        alert('Récord guardado con éxito');
      }
    } catch (error) {
      console.error('Error al guardar peso', error);
      alert('Error al guardar récord');
    } finally {
      setSaving(false);
    }
  };

  const renderMedal = (index) => {
    if (index === 0) return <Medal size={20} color="#eab308" />;
    if (index === 1) return <Medal size={20} color="#9ca3af" />;
    if (index === 2) return <Medal size={20} color="#b45309" />;
    return <span style={{ width: '20px', textAlign: 'center', fontWeight: 'bold', color: '#9ca3af' }}>{index + 1}</span>;
  };

  if (selectedEjercicio) {
    return (
      <div className="main-content">
        <PageHeader
          title={`Ranking: ${selectedEjercicio}`}
          subtitle="Top 20 mejores récords del gimnasio"
        />

        <div style={{ padding: '0 20px', marginBottom: '40px' }}>
          <button 
            onClick={() => setSelectedEjercicio(null)}
            style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '20px', fontWeight: '500', gap: '5px' }}
          >
            <ArrowLeft size={16} /> Volver a Ejercicios
          </button>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #eee' }}>
            <h3 style={{ margin: '0 0 15px', color: '#333', fontSize: '1.1rem' }}>¡Define tu récord, {adminNombre}!</h3>
            <form onSubmit={handleSavePeso} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '0.9rem', fontWeight: 'bold' }}>Peso (1RM) en kg</label>
                <input 
                  type="number" 
                  value={pesoMaximo}
                  onChange={e => setPesoMaximo(e.target.value)}
                  placeholder="Ej: 120"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
              </div>
              <button 
                type="submit"
                disabled={saving}
                style={{ padding: '10px 20px', backgroundColor: '#00a8e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px', justifyContent: 'center' }}
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                {saving ? 'Guardando...' : 'Guardar mi Récord'}
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', backgroundColor: '#f9fafb' }}>
              <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>Top 20 Global</h3>
            </div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 className="animate-spin" size={30} color="#00a8e8" />
              </div>
            ) : ranking.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                No hay récords registrados para este ejercicio.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {ranking.map((rec, index) => (
                  <li key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                        {renderMedal(index)}
                      </div>
                      <span style={{ fontWeight: '600', color: '#333' }}>
                        {rec.cliente.nombre} {rec.cliente.apellido}
                      </span>
                    </div>
                    <span style={{ fontWeight: '900', color: '#111827', fontSize: '1.1rem' }}>{rec.pesoMaximo} kg</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <PageHeader
        title="Ranking y Récords"
        subtitle="Administra los récords 1RM de tus alumnos"
      />

      <div style={{ padding: '0 20px' }}>
        <p style={{ color: '#666', marginBottom: '20px' }}>Selecciona un ejercicio para gestionar o visualizar su podio.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>
          {EJERCICIOS.map(ej => (
            <div
              key={ej}
              onClick={() => handleSelectEjercicio(ej)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #eee' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#00a8e8'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#eee'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Trophy size={24} color="#00a8e8" />
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>{ej}</span>
              </div>
              <ChevronRight size={20} color="#999" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RankingAdmin;
