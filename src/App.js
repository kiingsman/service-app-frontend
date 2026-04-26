import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || "https://service-app-backend-121o.onrender.com";
const socket = io(API_URL);

function App() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allJobs, setAllJobs] = useState([]); 
  const [isProvider, setIsProvider] = useState(false); 
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bookingDetails, setBookingDetails] = useState({ date: '', address: '', notes: '' });
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef(null);

  // Memoize fetchData so it can be safely used in useEffect
  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const myRes = await axios.get(`${API_URL}/api/bookings/my/${user.email}`);
      setBookings(myRes.data);
      const allRes = await axios.get(`${API_URL}/api/bookings/provider`);
      setAllJobs(allRes.data);
    } catch (err) { 
      console.error("Fetch error", err); 
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    axios.get(`${API_URL}/api/services`).then(res => {
      setServices(res.data);
    });

    if (user) {
      fetchData();
    }

    socket.on("receive_message", (data) => setMessages(prev => [...prev, data]));
    return () => socket.off("receive_message");
  }, [user, fetchData]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const res = await axios.post(`${API_URL}${endpoint}`, { email, password });
      if (isRegistering) { 
        setIsRegistering(false); 
        alert("Registered!"); 
      } else { 
        localStorage.setItem('user', JSON.stringify(res.data)); 
        setUser(res.data); 
      }
    } catch (err) { 
      alert("Auth Failed"); 
    }
  };

  const handlePay = async (service) => {
    if (!bookingDetails.address || !bookingDetails.date) return alert("Fill Address & Date!");
    try {
      const res = await axios.post(`${API_URL}/api/payments/initialize`, { 
        email: user.email, 
        amount: service.price, 
        serviceTitle: service.title, 
        ...bookingDetails
      });
      if (res.data.authorization_url) window.location.href = res.data.authorization_url;
    } catch (err) { 
      alert("Payment init failed"); 
    }
  };

  const updateStatus = async (id, newStatus) => {
    await axios.put(`${API_URL}/api/bookings/${id}/status`, { status: newStatus });
    fetchData(); 
  };

  const sendMessage = () => {
    if (inputMessage.trim() !== "" && activeChat) {
      const msg = { roomId: activeChat._id, message: inputMessage, sender: user.email };
      socket.emit("send_message", msg);
      setMessages(prev => [...prev, msg]);
      setInputMessage("");
    }
  };

  const totalRevenue = allJobs
    .filter(j => j.status === 'PAID' || j.status === 'COMPLETED')
    .reduce((sum, j) => sum + j.amount, 0);

  if (!user) return (
    <div className="App-header">
      <div className="auth-card" style={{ background: '#1a1a1a', padding: '40px', borderRadius: '15px', border: '1px solid #333' }}>
        <h2>{isRegistering ? "Join @cloud_guy_nigeria" : "Provider Login"}</h2>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" style={{ background: '#61dafb', color: '#000' }}>{isRegistering ? "Register" : "Login"}</button>
        </form>
        <p onClick={() => setIsRegistering(!isRegistering)} style={{ cursor: 'pointer', color: '#61dafb', marginTop: '15px' }}>
          {isRegistering ? "Back to Login" : "Need an account? Register"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="App">
      <nav style={{ background: '#111', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <h2 style={{ color: '#61dafb', margin: 0 }}>@cloud_guy_nigeria {isProvider ? 'PRO' : 'MARKET'}</h2>
        <div>
          <button onClick={() => setIsProvider(!isProvider)} style={{ marginRight: '15px', background: isProvider ? '#ff9800' : '#4CAF50', color: '#fff' }}>
            {isProvider ? '🏠 Switch to Client View' : '⚙️ Provider Dashboard'}
          </button>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ background: 'transparent', border: '1px solid #ff4b2b', color: '#ff4b2b' }}>Logout</button>
        </div>
      </nav>

      <main style={{ padding: '40px' }}>
        {isProvider ? (
          <div className="provider-dashboard">
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <div className="stat-card" style={{ background: '#222', padding: '20px', borderRadius: '10px', flex: 1, borderLeft: '5px solid #4CAF50' }}>
                <p>Total Revenue</p>
                <h3>₦{totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="stat-card" style={{ background: '#222', padding: '20px', borderRadius: '10px', flex: 1, borderLeft: '5px solid #2196F3' }}>
                <p>Active Jobs</p>
                <h3>{allJobs.filter(j => j.status === 'PAID' || j.status === 'ACCEPTED').length}</h3>
              </div>
            </div>

            <h2 style={{ textAlign: 'left' }}>Work Orders</h2>
            {allJobs.map(job => (
              <div key={job._id} style={{ background: '#1a1a1a', marginBottom: '15px', padding: '20px', borderRadius: '12px', textAlign: 'left', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h3>{job.serviceTitle}</h3>
                  <span style={{ padding: '5px 12px', borderRadius: '20px', background: job.status === 'PAID' ? '#4CAF50' : '#333', fontSize: '0.8rem' }}>{job.status}</span>
                </div>
                <p style={{ color: '#aaa' }}>📍 {job.address} | 📅 {job.date}</p>
                <p><strong>Note:</strong> {job.notes || "No special instructions"}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  {job.status === 'PAID' && <button onClick={() => updateStatus(job._id, 'ACCEPTED')} style={{ background: '#4CAF50' }}>Accept Job</button>}
                  {job.status === 'ACCEPTED' && <button onClick={() => updateStatus(job._id, 'COMPLETED')} style={{ background: '#2196F3' }}>Mark Completed</button>}
                  <button onClick={() => { setActiveChat({_id: job._id, title: job.userEmail}); socket.emit("join_room", job._id); }} style={{ background: '#555' }}>Chat Client</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="client-view">
             <div style={{ background: '#222', padding: '25px', borderRadius: '15px', marginBottom: '40px', border: '1px solid #61dafb' }}>
              <h3 style={{ marginTop: 0 }}>Request a Service</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                <input type="date" value={bookingDetails.date} onChange={e => setBookingDetails({...bookingDetails, date: e.target.value})} style={{ flex: 1 }} />
                <input type="text" placeholder="Your Address in Kano" value={bookingDetails.address} onChange={e => setBookingDetails({...bookingDetails, address: e.target.value})} style={{ flex: 2 }} />
                <input type="text" placeholder="Urgent notes (e.g., Solar panel leak)" value={bookingDetails.notes} onChange={e => setBookingDetails({...bookingDetails, notes: e.target.value})} style={{ flex: 2 }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px' }}>
              {services.map(s => (
                <div key={s._id} className="service-card" style={{ background: '#1a1a1a', padding: '25px', borderRadius: '20px', width: '280px', border: '1px solid #333' }}>
                  <h3>{s.title}</h3>
                  <p style={{ fontSize: '1.4rem', color: '#61dafb' }}>₦{s.price.toLocaleString()}</p>
                  <button onClick={() => handlePay(s)} style={{ width: '100%', padding: '12px', background: '#4CAF50', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}>Book Now</button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '50px', textAlign: 'left' }}>
              <h2>My Booking History</h2>
              {bookings.length > 0 ? bookings.map(b => (
                <div key={b._id} style={{ background: '#222', margin: '10px 0', padding: '15px', borderRadius: '10px' }}>
                  <strong>{b.serviceTitle}</strong> - <span style={{ color: '#61dafb' }}>{b.status}</span>
                  <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#888' }}>Ref: {b.reference}</p>
                </div>
              )) : <p>No bookings yet.</p>}
            </div>
          </div>
        )}
      </main>

      {activeChat && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '320px', background: '#111', border: '1px solid #61dafb', borderRadius: '15px', overflow: 'hidden' }}>
          <div style={{ background: '#61dafb', color: '#000', padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <strong>Chat</strong>
            <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ height: '300px', overflowY: 'auto', padding: '15px' }}>
            {messages.filter(m => m.roomId === activeChat._id).map((m, i) => (
              <div key={i} style={{ textAlign: m.sender === user.email ? 'right' : 'left', margin: '5px 0' }}>
                <span style={{ background: m.sender === user.email ? '#61dafb' : '#333', color: m.sender === user.email ? '#000' : '#fff', padding: '5px 10px', borderRadius: '10px', fontSize: '0.9rem' }}>{m.message}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '10px', display: 'flex', gap: '5px' }}>
            <input value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Type..." style={{ flex: 1 }} />
            <button onClick={sendMessage} style={{ background: '#61dafb', padding: '8px 15px' }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;