import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("lost");
  const [category, setCategory] = useState("Electronics");
  const [date, setDate] = useState("");
  const [claimQuestion, setClaimQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Claim Modal States
  const [selectedItem, setSelectedItem] = useState(null);
  const [claimAnswer, setClaimAnswer] = useState("");
  const [claimStatus, setClaimStatus] = useState("");

  const [backendStatus, setBackendStatus] = useState("Checking Backend...");

  useEffect(() => {
    fetchItems();
    checkBackend();
  }, [filterCategory, searchQuery]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const checkBackend = async () => {
    try {
      await axios.get("http://localhost:5000/api/items");
      setBackendStatus("🔵 Backend Connected Successfully");
    } catch (err) {
      setBackendStatus("⚪ Backend Connection Failed");
    }
  };

  const fetchItems = async () => {
    try {
      let url = "http://localhost:5000/api/items?";
      if (filterCategory !== "All") {
        url += `category=${filterCategory}&`;
      }
      if (searchQuery) {
        url += `search=${searchQuery}&`;
      }
      const res = await axios.get(url);
      setItems(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newItem = { 
        title, 
        description, 
        location,
        type,
        category,
        date,
        claimQuestion 
      };
      const res = await axios.post("http://localhost:5000/api/items", newItem);
      setItems([res.data, ...items]);
      setTitle("");
      setDescription("");
      setLocation("");
      setType("lost");
      setCategory("Electronics");
      setDate("");
      setClaimQuestion("");
      showToast("✨ Item posted successfully!");
    } catch (err) {
      console.log(err);
      showToast("❌ Failed to post item.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/items/${id}`);
      setItems(items.filter((item) => item._id !== id));
      showToast("🗑️ Item deleted successfully.");
    } catch (err) {
      console.log(err);
    }
  };

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    setClaimStatus("✅ Claim request sent to owner for verification!");
    setTimeout(() => {
      setSelectedItem(null);
      setClaimAnswer("");
      setClaimStatus("");
    }, 2500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    }}>
      
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          backgroundColor: '#1e293b',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 1100,
          fontWeight: '600',
          fontSize: '0.95rem',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Main Form Container Card */}
      <div style={{
        background: '#ffffff',
        padding: '35px',
        borderRadius: '20px',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.08), 0 8px 10px -6px rgba(37, 99, 235, 0.04)',
        width: '100%',
        maxWidth: '500px',
        marginBottom: '30px',
        boxSizing: 'border-box',
        textAlign: 'center',
        border: '1px solid #e2e8f0'
      }}>
        <h1 style={{ color: '#2563eb', margin: '0 0 8px 0', fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
          CampusCrate
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 15px 0', fontWeight: '500' }}>
          Lost & Found Portal for Students 🔍
        </p>
        <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '25px', color: '#2563eb' }}>
          {backendStatus}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '5px' }}>
            <label style={{ fontWeight: '600', color: '#1e293b', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="type" 
                value="lost" 
                checked={type === 'lost'} 
                onChange={(e) => setType(e.target.value)} 
                style={{ marginRight: '5px' }}
              /> Lost
            </label>
            <label style={{ fontWeight: '600', color: '#1e293b', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="type" 
                value="found" 
                checked={type === 'found'} 
                onChange={(e) => setType(e.target.value)} 
                style={{ marginRight: '5px' }}
              /> Found
            </label>
          </div>

          <input
            type="text"
            placeholder="Item Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
          />

          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
          >
            <option value="Electronics">Electronics</option>
            <option value="Documents">Documents</option>
            <option value="Accessories">Accessories</option>
            <option value="Others">Others</option>
          </select>

          <input
            type="text"
            placeholder="Location (e.g., Library 2nd Floor)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Claim Question (e.g., What wallpaper is on it?)"
            value={claimQuestion}
            onChange={(e) => setClaimQuestion(e.target.value)}
            required
            style={inputStyle}
          />

          <button type="submit" disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Posting Item..." : "Add Item"}
          </button>
        </form>
      </div>

      {/* Items List & Controls Section */}
      <div style={{
        background: '#ffffff',
        padding: '30px',
        borderRadius: '20px',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.08)',
        width: '100%',
        maxWidth: '500px',
        boxSizing: 'border-box',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ color: '#2563eb', textAlign: 'center', marginBottom: '20px', fontSize: '1.4rem', fontWeight: '700' }}>
          Campus Items Feed
        </h2>

        {/* Search and Filter Controls */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, flex: 1, padding: '10px 12px' }}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ ...inputStyle, width: '130px', padding: '10px 12px' }}
          >
            <option value="All">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Documents">Documents</option>
            <option value="Accessories">Accessories</option>
            <option value="Others">Others</option>
          </select>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '5px' }}>📭</p>
            <p style={{ fontWeight: '500', fontSize: '0.95rem' }}>No items match your criteria.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: '0', margin: '0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item) => (
              <li key={item._id} style={{
                background: '#ffffff',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ textAlign: 'left', wordBreak: 'break-word', paddingRight: '10px', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: '700', 
                      backgroundColor: item.type === 'lost' ? '#fee2e2' : '#dcfce7', 
                      color: item.type === 'lost' ? '#991b1b' : '#166534',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {item.type ? item.type.toUpperCase() : 'LOST'}
                    </span>
                    <strong style={{ color: '#1e293b', fontSize: '1.05rem' }}>{item.title}</strong>
                  </div>
                  
                  <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '0.9rem' }}>{item.description}</p>
                  <p style={{ margin: '0 0 6px 0', color: '#475569', fontSize: '0.85rem' }}>📂 {item.category} | 📅 {item.date}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <small style={{ color: '#1e293b', fontWeight: '600', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', border: '1px solid #bfdbfe', width: 'fit-content' }}>
                      📍 {item.location}
                    </small>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    {item.claimQuestion && (
                      <button 
                        onClick={() => setSelectedItem(item)}
                        style={{
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.8rem'
                        }}
                      >
                        Claim Item
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(item._id)} 
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#ef4444',
                        border: '1px solid #fecaca',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.8rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Claim Modal Popup */}
      {selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            padding: '30px',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#1e293b', marginBottom: '10px' }}>Claim: {selectedItem.title}</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>
              To verify ownership, please answer the owner's question:
            </p>
            <p style={{ fontWeight: '600', color: '#2563eb', backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
              "{selectedItem.claimQuestion}"
            </p>

            {claimStatus ? (
              <p style={{ color: '#166534', fontWeight: '600', fontSize: '0.9rem' }}>{claimStatus}</p>
            ) : (
              <form onSubmit={handleClaimSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Your Answer..."
                  value={claimAnswer}
                  onChange={(e) => setClaimAnswer(e.target.value)}
                  required
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ ...buttonStyle, flex: 1, padding: '10px' }}>
                    Submit Answer
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSelectedItem(null)} 
                    style={{
                      flex: 1,
                      backgroundColor: '#e2e8f0',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  fontSize: '0.95rem',
  outline: 'none',
  backgroundColor: '#ffffff',
  boxSizing: 'border-box'
};

const buttonStyle = {
  width: '100%',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: '2px solid #2563eb',
  padding: '12px',
  borderRadius: '10px',
  fontSize: '1rem',
  fontWeight: '700',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
  marginTop: '5px'
};

export default App;