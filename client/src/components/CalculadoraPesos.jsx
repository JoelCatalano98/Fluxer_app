import React, { useState } from 'react';
import { Calculator, X } from 'lucide-react';

export default function CalculadoraPesos({ onClose }) {
  const [pesoBase, setPesoBase] = useState('');
  const [porcentaje, setPorcentaje] = useState('');

  const calcular = () => {
    const pBase = parseFloat(pesoBase);
    const pPorc = parseFloat(porcentaje);
    if (!isNaN(pBase) && !isNaN(pPorc)) {
      return ((pBase * pPorc) / 100).toFixed(2).replace(/\.00$/, '');
    }
    return '0';
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', width: '95%', maxWidth: '350px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={20} color="#374151" /> Calculadora %
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Peso Base (1RM) en kg</label>
            <input 
              type="number" 
              value={pesoBase} 
              onChange={(e) => setPesoBase(e.target.value)}
              placeholder="Ej: 100" 
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem', color: '#111827', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Porcentaje (%)</label>
            <input 
              type="number" 
              value={porcentaje} 
              onChange={(e) => setPorcentaje(e.target.value)}
              placeholder="Ej: 70" 
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem', color: '#111827', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginTop: '8px', backgroundColor: '#f9fafb', border: '1px solid #f3f4f6', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>Resultado</span>
            <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#111827' }}>{calcular()} kg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
