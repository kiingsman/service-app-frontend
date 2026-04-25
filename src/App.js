import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This uses your Vercel Environment Variable REACT_APP_API_URL
    axios.get(`${process.env.REACT_APP_API_URL}/api/services`)
      .then((response) => {
        setServices(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching services:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1 style={{ marginBottom: '40px' }}>Service Marketplace</h1>
        
        {loading ? (
          <div className="loader">
            <p>Fetching your services...</p>
          </div>
        ) : (
          <div className="service-list" style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center',
            gap: '20px',
            padding: '20px'
          }}>
            {services.map(service => (
              <div key={service._id} className="service-card" style={{
                border: '2px solid rgba(255, 255, 255, 0.2)', 
                padding: '25px', 
                borderRadius: '15px',
                width: '280px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(5px)'
              }}>
                {/* Updated to use .title to match your backend */}
                <h3 style={{ color: '#61dafb', fontSize: '1.5rem' }}>{service.title}</h3>
                
                <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>
                  Price: <span style={{ fontWeight: 'bold' }}>₦{service.price.toLocaleString()}</span>
                </p>
                
                <button style={{ 
                  padding: '12px 24px', 
                  cursor: 'pointer',
                  backgroundColor: '#61dafb',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  color: '#282c34',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;