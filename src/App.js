import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This uses your Vercel Environment Variable
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
        <h1>Service Marketplace</h1>
        {loading ? (
          <p>Loading services...</p>
        ) : (
          <div className="service-list" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {services.map(service => (
              <div key={service._id} className="service-card" style={{
                border: '1px solid white', 
                margin: '15px', 
                padding: '20px', 
                borderRadius: '10px',
                width: '250px'
              }}>
                <h3>{service.title}</h3>
                <p>Price: ₦{service.price.toLocaleString()}</p>
                <button style={{ padding: '10px', cursor: 'pointer' }}>Book Now</button>
              </div>
            ))}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;