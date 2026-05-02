import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import { Users } from 'lucide-react';

function App() {
  const [socios, setSocios] = useState([]);

  // Metemos la lógica directamente en el useEffect para que sea impecable
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/socios');
        setSocios(res.data);
      } catch (error) {
        console.error("Error conectando con el servidor:", error);
      }
    };

    cargarDatos();
  }, []); // El array vacío asegura que solo se ejecute al montar el componente

  return (
    <div>
      <Navbar />
      <main style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users color="#2563eb" /> Lista de Socios en MongoDB
        </h2>
        
        <table border="1" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              <th style={{ padding: '10px' }}>Nombre</th>
              <th style={{ padding: '10px' }}>Apellido</th>
              <th style={{ padding: '10px' }}>DNI</th>
            </tr>
          </thead>
          <tbody>
            {socios.length > 0 ? (
              socios.map((socio) => (
                <tr key={socio._id}>
                  <td style={{ padding: '10px' }}>{socio.nombre}</td>
                  <td style={{ padding: '10px' }}>{socio.apellido}</td>
                  <td style={{ padding: '10px' }}>{socio.dni}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ padding: '10px', textAlign: 'center' }}>
                  Cargando socios o no hay datos disponibles...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default App;