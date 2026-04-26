import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const socket = io(process.env.REACT_APP_API_URL || "https://service-app-backend-121o.onrender.com");

function App() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Fetch Services
    axios.get(`${process.env.REACT_APP_API_URL}/api/services`)
      .then(res => { setServices(res.data); setLoading(false); })
      .catch(() => setLoading(false));

    socket.on("receive_message", (data) => setMessages(prev => [...prev, data]));
    return () => socket.off("receive_message");
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}${endpoint}`, { email, password });
      if (isRegistering) {
        alert("Registration successful! Please login.");
        setIsRegistering(false);
      } else {
        localStorage.setItem('user', JSON.stringify(res.data));
        setUser(res.data);
      }
    } catch (err) { alert("Authentication failed!"); }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.reload();
  };

  const handlePay = async (service) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/initialize`, 
        { email: user.email, amount: service.price },
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
      if (res.data.authorization_url) window.location.href = res.data.authorization_url;
    } catch (err) { alert("Payment failed to initialize."); }
  };

  const sendMessage = () => {
    if (inputMessage.trim() !== "" && activeChat) {
      const msg = { roomId: activeChat._id, message: inputMessage, sender: user.email, time: new Date().toLocaleTimeString() };
      socket.emit("send_message", msg);
      setMessages(prev => [...prev, msg]);
      setInputMessage("");
    }
  };

  if (!user) {
    return (
      <div className="App-header" style={{ padding: '50px' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '40px', borderRadius: '20px', width: '350px', margin: '0 auto' }}>
          <h2>{isRegistering ? "Create Account" : "Welcome Back"}</h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: 'none' }} />
            <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: 'none' }} />
            <button type="submit" style={{ padding: '12px', background: '#61dafb', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {isRegistering ? "Register" : "Login"}
            </button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ cursor: 'pointer', fontSize: '0.9rem', marginTop: '15px', color: '#61dafb' }}>
            {isRegistering ? "Already have an account? Login" : "New here? Create an account"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header" style={{ padding: '20px' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', marginBottom: '30px' }}>
          <h1 style={{ margin: 0 }}>Marketplace</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Logged in as: <strong>{user.email}</strong></span>
            <button onClick={handleLogout} style={{ background: '#ff4b2b', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
          </div>
        </div>

        {loading ? <p>Loading services...</p> : (
          <div className="service-list" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
            {services.map(service => (
              <div key={service._id} className="service-card" style={{ background: 'rgba(255,255,255,0.08)', padding: '25px', borderRadius: '15px', width: '280px', textAlign: 'left' }}>
                <h3 style={{ color: '#61dafb' }}>{service.title}</h3>
                <p style={{ fontSize: '1.2rem' }}>₦{service.price?.toLocaleString()}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button onClick={() => { setActiveChat(service); socket.emit("join_room", service._id); }} style={{ flex: 1, padding: '10px', background: '#61dafb', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Chat</button>
                  <button onClick={() => handlePay(service)} style={{ flex: 1, padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Pay Now</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeChat && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '320px', height: '400px', background: '#1c1e22', border: '2px solid #61dafb', borderRadius: '15px', display: 'flex', flexDirection: 'column', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ background: '#61dafb', color: '#000', padding: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>Chat: {activeChat.title}</span>
              <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === user.email ? 'flex-end' : 'flex-start', background: msg.sender === user.email ? '#61dafb' : '#444', color: msg.sender === user.email ? '#000' : '#fff', padding: '8px', borderRadius: '8px', maxWidth: '80%', fontSize: '0.9rem' }}>
                  {msg.message}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '10px', display: 'flex', gap: '5px', borderTop: '1px solid #333' }}>
              <input value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Ask a question..." style={{ flex: 1, padding: '8px', borderRadius: '5px', border: 'none', background: '#222', color: '#fff' }} />
              <button onClick={sendMessage} style={{ background: '#61dafb', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;