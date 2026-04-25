import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetches data using your Vercel Environment Variable
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
      <header className="App-header" style={{ padding: '40px 20px' }}>
        <h1 style={{ marginBottom: '50px', fontSize: '2.5rem', fontWeight: 'bold' }}>
          Service Marketplace
        </h1>
        
        {loading ? (
          <div className="loader">
            <p>Loading your services...</p>
          </div>
        ) : (
          <div className="service-list" style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center',
            gap: '30px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {services.map(service => (
              <div key={service._id} className="service-card" style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '30px',
                width: '300px',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Matches the .title key from your backend */}
                <h3 style={{ color: '#61dafb', margin: '0 0 15px 0', fontSize: '1.6rem' }}>
                  {service.title}
                </h3>
                
                <p style={{ fontSize: '1.2rem', opacity: '0.9', marginBottom: '25px' }}>
                  Price: <span style={{ fontWeight: 'bold', color: '#fff' }}>
                    ₦{typeof service.price === 'number' ? service.price.toLocaleString() : service.price}
                  </span>
                </p>
                
                <button style={{ 
                  width: '100%',
                  padding: '12px', 
                  cursor: 'pointer',
                  backgroundColor: '#61dafb',
                  color: '#282c34',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'background 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4fa8c7'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#61dafb'}
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