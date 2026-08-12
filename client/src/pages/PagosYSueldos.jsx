import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Sueldos from './Sueldos';
import HistoricoSueldos from './HistoricoSueldos';
import Pagos from './Pagos';
import '../styles/style.css';

const PagosYSueldos = () => {
    const [activeTab, setActiveTab] = useState('sueldos');

    return (
        <div className="main-content">
            <PageHeader
                title="Pagos y Sueldos"
                subtitle="Gestión de liquidaciones e historial financiero"
                image="/img/welcome-background.png"
            />
            
            <div style={{ padding: '0 5px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #ddd', gap: '20px' }}>
                    <button 
                        onClick={() => setActiveTab('sueldos')}
                        style={{
                            padding: '10px 15px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'sueldos' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                            color: activeTab === 'sueldos' ? 'var(--accent-blue)' : '#666',
                            fontWeight: activeTab === 'sueldos' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Sueldos
                    </button>
                    <button 
                        onClick={() => setActiveTab('historico')}
                        style={{
                            padding: '10px 15px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'historico' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                            color: activeTab === 'historico' ? 'var(--accent-blue)' : '#666',
                            fontWeight: activeTab === 'historico' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Histórico
                    </button>
                    <button 
                        onClick={() => setActiveTab('pagos')}
                        style={{
                            padding: '10px 15px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'pagos' ? '3px solid var(--accent-blue)' : '3px solid transparent',
                            color: activeTab === 'pagos' ? 'var(--accent-blue)' : '#666',
                            fontWeight: activeTab === 'pagos' ? 'bold' : 'normal',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Pagos (Socios)
                    </button>
                </div>
            </div>

            {activeTab === 'sueldos' && <Sueldos isTab={true} />}
            {activeTab === 'historico' && <HistoricoSueldos />}
            {activeTab === 'pagos' && <Pagos isTab={true} />}
        </div>
    );
};

export default PagosYSueldos;
