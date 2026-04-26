import { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

// Connect to your Render backend
const socket = io(process.env.REACT_APP_API_URL || "https://service-app-backend-121o.onrender.com");

function App() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    // 1. Fetch Services
    axios.get(`${process.env.REACT_APP_API_URL}/api/services`)
      .then((response) => {
        setServices(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching services:", error);
        setLoading(false);
      });

    // 2. Socket Listeners
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.off("receive_message");
  }, []);

  const sendMessage = () => {
    if (inputMessage !== "") {
      const messageData = {
        roomId: "general", // You can make this dynamic later
        message: inputMessage,
        time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
      };

      socket.emit("send_message", messageData);
      setMessages((prev) => [...prev, messageData]);
      setInputMessage("");
    }
  };

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
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '30px',
                width: '300px',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                transition: 'transform 0.3s ease'
              }}>
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
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  border: 'none'
                }}>
                  Book Now
                </button>
              </div>
            ))}
          </div>
        )}

        {/* --- SIMPLE CHAT UI --- */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '300px',
          height: '400px',
          background: '#1c1e22',
          border: '1px solid #61dafb',
          borderRadius: '15px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1000
        }}>
          <div style={{ background: '#61dafb', color: '#000', padding: '10px', fontWeight: 'bold' }}>
            Live Support Chat
          </div>
          <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                alignSelf: 'flex-start', 
                background: '#333', 
                padding: '8px 12px', 
                borderRadius: '10px',
                fontSize: '0.9rem'
              }}>
                {msg.message} <small style={{ opacity: 0.5 }}>{msg.time}</small>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px', display: 'flex', gap: '5px' }}>
            <input 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type message..." 
              style={{ flex: 1, padding: '8px', borderRadius: '5px', border: 'none' }}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} style={{ background: '#61dafb', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>
              Send
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;