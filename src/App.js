import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

// Initialize socket outside the component [cite: 2026-04-26]
const API_URL = process.env.REACT_APP_API_URL || "https://service-app-backend-121o.onrender.com";
const socket = io(API_URL);

function App() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]); // Track user's bookings [cite: 2026-04-26]
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef(null);

  // Auto-scroll chat [cite: 2026-04-26]
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // 1. Fetch Services
    axios.get(`${API_URL}/api/services`)
      .then(res => {
        setServices(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching services:", err);
        setLoading(false);
      });

    // 2. Fetch User Bookings if logged in [cite: 2026-04-26]
    if (user) {
      axios.get(`${API_URL}/api/bookings/${user.email}`)
        .then(res => setBookings(res.data))
        .catch(err => console.error("Error fetching bookings:", err));
    }

    // 3. Socket listener [cite: 2026-04-26]
    socket.on("receive_message", (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => socket.off("receive_message");
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const fullUrl = `${API_URL}${endpoint}`;
    
    try {
      const res = await axios.post(fullUrl, { email, password });
      if (isRegistering) {
        alert("Registration successful! Now please Login.");
        setIsRegistering(false);
      } else {
        localStorage.setItem('user', JSON.stringify(res.data));
        setUser(res.data);
      }
    } catch (err) {
      alert(`Authentication failed: ${err.response?.data?.message || "Error"}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.reload();
  };

  // ARCHITECTURE STEP: Initialize Payment with Service Title [cite: 2026-04-26]
  const handlePay = async (service) => {
    try {
      const res = await axios.post(`${API_URL}/api/payments/initialize`, 
        { 
          email: user.email, 
          amount: service.price,
          serviceTitle: service.title // Sends Title to create Booking [cite: 2026-04-26]
        },
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      }
    } catch (err) {
      console.error("Payment init error:", err);
      alert("Payment failed to initialize. Check backend logs.");
    }
  };

  const sendMessage = () => {
    if (inputMessage.trim() !== "" && activeChat) {
      const msg = { 
        roomId: activeChat._id, 
        message: inputMessage, 
        sender: user.email, 
        time: new Date().toLocaleTimeString() 
      };
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
            <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '8px' }} />
            <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '8px' }} />
            <button type="submit" style={{ padding: '12px', background: '#61dafb', fontWeight: 'bold', cursor: 'pointer' }}>
              {isRegistering ? "Register" : "Login"}
            </button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ cursor: 'pointer', marginTop: '20px', color: '#61dafb' }}>
            {isRegistering ? "Already have an account? Login" : "New here? Create an account"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header" style={{ padding: '20px' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', maxWidth: '1200px' }}>
          <h1>@cloud_guy_nigeria Marketplace</h1>
          <div>
            <span>{user.email} </span>
            <button onClick={handleLogout} style={{ background: '#ff4b2b', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        {loading ? <p>Loading Services...</p> : (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
            {services.map(service => (
              <div key={service._id} style={{ background: 'rgba(255,255,255,0.08)', padding: '20px', borderRadius: '15px', width: '250px' }}>
                <h3>{service.title}</h3>
                <p style={{ fontSize: '1.2rem' }}>₦{service.price?.toLocaleString()}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button onClick={() => { setActiveChat(service); socket.emit("join_room", service._id); }} style={{ flex: 1, padding: '10px', cursor: 'pointer' }}>Chat</button>
                  <button onClick={() => handlePay(service)} style={{ flex: 1, padding: '10px', background: '#4CAF50', color: 'white', cursor: 'pointer' }}>Pay Now</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- BOOKING HISTORY SECTION [cite: 2026-04-26] --- */}
        <div style={{ marginTop: '50px', width: '100%', maxWidth: '800px', textAlign: 'left' }}>
          <h2 style={{ borderBottom: '1px solid #61dafb', paddingBottom: '10px' }}>My Bookings</h2>
          {bookings.length === 0 ? <p>No bookings found.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ background: '#333' }}>
                  <th style={{ padding: '10px' }}>Service</th>
                  <th style={{ padding: '10px' }}>Amount</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id} style={{ borderBottom: '1px solid #444' }}>
                    <td style={{ padding: '10px' }}>{b.serviceTitle}</td>
                    <td style={{ padding: '10px' }}>₦{b.amount?.toLocaleString()}</td>
                    <td style={{ padding: '10px', color: b.status === 'PAID' ? '#4CAF50' : '#ff9800', fontWeight: 'bold' }}>{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {activeChat && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '300px', height: '400px', background: '#1c1e22', border: '2px solid #61dafb', borderRadius: '15px', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
            <div style={{ background: '#61dafb', color: '#000', padding: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>{activeChat.title} Chat</span>
              <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
            </div>
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', background: '#131417' }}>
              {messages.filter(m => m.roomId === activeChat._id).map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === user.email ? 'flex-end' : 'flex-start', background: msg.sender === user.email ? '#61dafb' : '#333', color: msg.sender === user.email ? '#000' : '#fff', padding: '8px', borderRadius: '10px', fontSize: '0.8rem' }}>
                  {msg.message}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '10px', display: 'flex', gap: '5px' }}>
              <input value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Type..." style={{ flex: 1, padding: '8px', borderRadius: '5px' }} />
              <button onClick={sendMessage} style={{ background: '#61dafb', padding: '8px' }}>Send</button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;