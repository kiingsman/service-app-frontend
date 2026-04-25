import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calling the new specific endpoint you just created
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
          <div className="service-list">
            {services.map(service => (
              <div key={service.id} className="service-card" style={{border: '1px solid white', margin: '10px', padding: '10px'}}>
                <h3>{service.name}</h3>
                <p>Status: {service.price}</p>
              </div>
            ))}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;