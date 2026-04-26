import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || "https://service-app-backend-121o.onrender.com";
const socket = io(API_URL);

function App() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allJobs, setAllJobs] = useState([]); // For Provider View
  const [isProvider, setIsProvider] = useState(false); // Toggle between User and Admin
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Booking Form State
  const [bookingDetails, setBookingDetails] = useState({ date: '', address: '', notes: '' });

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    axios.get(`${API_URL}/api/services`).then(res => {
      setServices(res.data);
      setLoading(false);
    });

    if (user) {
      fetchData();
    }

    socket.on("receive_message", (data) => setMessages(prev => [...prev, data]));
    return () => socket.off("receive_message");
  }, [user]);

  const fetchData = async () => {
    // Get User's own history
    const myRes = await axios.get(`${API_URL}/api/bookings/my/${user.email}`);
    setBookings(myRes.data);

    // Get All Jobs (Provider View)
    const allRes = await axios.get(`${API_URL}/api/bookings/provider`);
    setAllJobs(allRes.data);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await axios.post(`${API_URL}${endpoint}`, { email, password });
      if (isRegistering) { alert("Success! Please Login."); setIsRegistering(false); }
      else { localStorage.setItem('user', JSON.stringify(res.data)); setUser(res.data); }
    } catch (err) { alert("Auth Failed"); }
  };

  const handlePay = async (service) => {
    if (!bookingDetails.address || !bookingDetails.date) {
      alert("Please enter service date and address first!");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/payments/initialize`, { 
        email: user.email, 
        amount: service.price,
        serviceTitle: service.title,
        ...bookingDetails
      });
      if (res.data.authorization_url) window.location.href = res.data.authorization_url;
    } catch (err) { alert("Payment error"); }
  };

  const updateStatus = async (id, newStatus) => {
    await axios.put(`${API_URL}/api/bookings/${id}/status`, { status: newStatus });
    fetchData(); // Refresh list
  };

  const sendMessage = () => {
    if (inputMessage.trim() !== "" && activeChat) {
      const msg = { roomId: activeChat._id, message: inputMessage, sender: user.email };
      socket.emit("send_message", msg);
      setMessages(prev => [...prev, msg]);
      setInputMessage("");
    }
  };

  if (!user) {
    return (
      <div className="App-header">
        <div style={{ background: '#222', padding: '30px', borderRadius: '15px' }}>
          <h2>{isRegistering ? "Register" : "Login"}</h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required />
            <button type="submit">{isRegistering ? "Register" : "Login"}</button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ cursor: 'pointer', color: '#61dafb' }}>
            {isRegistering ? "Switch to Login" : "New? Register"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header" style={{ padding: '20px' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', maxWidth: '1200px' }}>
          <h1>@cloud_guy_nigeria {isProvider ? 'ADMIN' : 'Marketplace'}</h1>
          <div>
            <button onClick={() => setIsProvider(!isProvider)} style={{ marginRight: '10px', background: '#61dafb' }}>
              Switch to {isProvider ? 'Customer View' : 'Provider View'}
            </button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
          </div>
        </div>

        {isProvider ? (
          /* PROVIDER VIEW (ADMIN) */
          <div style={{ width: '100%', maxWidth: '1000px', marginTop: '30px' }}>
            <h2>Incoming Job Requests</h2>
            {allJobs.map(job => (
              <div key={job._id} style={{ background: '#333', margin: '10px 0', padding: '15px', borderRadius: '10px', textAlign: 'left' }}>
                <h3>{job.serviceTitle} - <span style={{ color: '#61dafb' }}>{job.status}</span></h3>
                <p><strong>Customer:</strong> {job.userEmail}</p>
                <p><strong>Location:</strong> {job.address}</p>
                <p><strong>Scheduled:</strong> {job.date}</p>
                <p><strong>Notes:</strong> {job.notes}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => updateStatus(job._id, 'ACCEPTED')} style={{ background: '#4CAF50' }}>Accept Job</button>
                  <button onClick={() => updateStatus(job._id, 'COMPLETED')} style={{ background: '#2196F3' }}>Mark Completed</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* CUSTOMER VIEW */
          <>
            <div style={{ background: '#333', padding: '20px', borderRadius: '15px', marginTop: '20px', width: '100%', maxWidth: '600px' }}>
              <h3>Step 1: Set Booking Info</h3>
              <input type="date" onChange={e => setBookingDetails({...bookingDetails, date: e.target.value})} style={{ margin: '5px' }} />
              <input type="text" placeholder="Service Address (Kano)" onChange={e => setBookingDetails({...bookingDetails, address: e.target.value})} style={{ margin: '5px', width: '80%' }} />
              <textarea placeholder="Urgent notes for Cloud Guy..." onChange={e => setBookingDetails({...bookingDetails, notes: e.target.value})} style={{ margin: '5px', width: '80%' }} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '30px' }}>
              {services.map(s => (
                <div key={s._id} style={{ background: '#222', padding: '20px', borderRadius: '15px', width: '250px' }}>
                  <h3>{s.title}</h3>
                  <p>₦{s.price.toLocaleString()}</p>
                  <button onClick={() => { setActiveChat(s); socket.emit("join_room", s._id); }}>Chat</button>
                  <button onClick={() => handlePay(s)} style={{ background: '#4CAF50', marginLeft: '5px' }}>Pay Now</button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '50px', textAlign: 'left', width: '100%', maxWidth: '800px' }}>
              <h2>My Booking History</h2>
              {bookings.map(b => (
                <div key={b._id} style={{ borderBottom: '1px solid #444', padding: '10px' }}>
                  {b.serviceTitle} - <strong>{b.status}</strong> (Ref: {b.reference})
                </div>
              ))}
            </div>
          </>
        )}

        {activeChat && (
          <div className="chat-box" style={{ position: 'fixed', bottom: '10px', right: '10px', background: '#111', border: '1px solid #61dafb', width: '300px', height: '400px' }}>
            <div style={{ background: '#61dafb', color: '#000', padding: '5px' }}>Chat: {activeChat.title}</div>
            <div style={{ height: '320px', overflowY: 'auto' }}>
              {messages.filter(m => m.roomId === activeChat._id).map((m, i) => <div key={i}>{m.sender}: {m.message}</div>)}
              <div ref={chatEndRef} />
            </div>
            <input value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} />
          </div>
        )}
      </header>
    </div>
  );
}

export default App;