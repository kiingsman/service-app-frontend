import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    // Fetch from the Backend using the Environment Variable
    axios.get(`${process.env.REACT_APP_API_URL}/`)
      .then((response) => {
        setMessage(response.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setMessage("Error: Could not connect to backend.");
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Service App Frontend</h1>
        <p>Backend Status: <strong>{message}</strong></p>
      </header>
    </div>
  );
}

export default App;