import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

// Using your Render Backend URL
const socket = io(process.env.REACT_APP_API_URL || "https://service-app-backend-121o.onrender.com");

function App() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null); // Stores the service being discussed
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 1. Fetch Services from MongoDB
    axios.get(`${process.env.REACT_APP_API_URL}/api/services`)
      .then((response) => {
        setServices(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching services:", error);
        setLoading(false);
      });

    // 2. Listen for incoming messages
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.off("receive_message");
  }, []);

  const openChat = (service) => {
    setActiveChat(service);
    setMessages([]); // Clear chat for new service room
    socket.emit("join_room", service._id); // Join room based on service ID
  };

  const sendMessage = () => {
    if (inputMessage.trim() !== "" && activeChat) {
      const messageData = {
        roomId: activeChat._id,
        message: inputMessage,
        sender: "Customer",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
          <div className="loader"><p>Loading your services...</p></div>
        ) : (
          <div className="service-list" style={{ 
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', maxWidth: '1200px', margin: '0 auto' 
          }}>
            {services.map(service => (
              <div key={service._id} className="service-card" style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '30px',
                width: '300px',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
              }}>
                <h3 style={{ color: '#61dafb', margin: '0 0 15px 0' }}>{service.title}</h3>
                <p style={{ fontSize: '1.2rem', marginBottom: '25px' }}>
                  Price: <strong>₦{service.price?.toLocaleString()}</strong>
                </p>
                
                {/* NEW CHAT BUTTON */}
                <button 
                  onClick={() => openChat(service)}
                  style={{ 
                    width: '100%', padding: '12px', cursor: 'pointer',
                    backgroundColor: '#61dafb', color: '#282c34',
                    borderRadius: '8px', fontWeight: 'bold', border: 'none'
                  }}
                >
                  Chat Now
                </button>
              </div>
            ))}
          </div>
        )}

        {/* --- DYNAMIC CHAT BOX --- */}
        {activeChat && (
          <div style={{
            position: 'fixed', bottom: '20px', right: '20px', width: '320px',
            height: '450px', background: '#1c1e22', border: '2px solid #61dafb',
            borderRadius: '15px', display: 'flex', flexDirection: 'column', zIndex: 1000,
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ background: '#61dafb', color: '#000', padding: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>Chat: {activeChat.title}</span>
              <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
            </div>

            <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>No messages yet. Ask about the {activeChat.title}!</p>}
              {messages.map((msg, idx) => (
                <div key={idx} style={{ 
                  alignSelf: msg.sender === "Customer" ? 'flex-end' : 'flex-start', 
                  background: msg.sender === "Customer" ? '#61dafb' : '#333', 
                  color: msg.sender === "Customer" ? '#000' : '#fff',
                  padding: '8px 12px', borderRadius: '12px', maxWidth: '80%'
                }}>
                  <div style={{ fontSize: '0.9rem' }}>{msg.message}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.6, textAlign: 'right' }}>{msg.time}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: '15px', borderTop: '1px solid #333', display: 'flex', gap: '8px' }}>
              <input 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your question..." 
                style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }}
              />
              <button onClick={sendMessage} style={{ background: '#61dafb', border: 'none', borderRadius: '5px', padding: '0 15px', fontWeight: 'bold', cursor: 'pointer' }}>
                Send
              </button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;