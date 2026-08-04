import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import { auth, provider, signInWithPopup } from "./firebase"; // Firebase configuration import
import { QRCodeSVG } from "qrcode.react"; // QR Code import added

const API_URL = "http://localhost:5000";
const socket = io(API_URL);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("lost");
  const [category, setCategory] = useState("Electronics");
  const [date, setDate] = useState("");
  const [claimQuestion, setClaimQuestion] = useState("");
  
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setThemeMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [feedTypeTab, setFeedTypeTab] = useState("all");

  const [selectedItem, setSelectedItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [claimAnswer, setClaimAnswer] = useState("");
  const [claimStatus, setClaimStatus] = useState("");

  const [backendStatus, setBackendStatus] = useState("Checking Backend...");

  const [isAdminView, setIsAdminView] = useState(false);
  const [adminClaims, setAdminClaims] = useState([]);
  const [reportedItems, setReportedItems] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);

  const [chatItem, setChatItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");

  const [viewMode, setViewMode] = useState("feed");

  useEffect(() => {
    if (isLoggedIn) {
      fetchItems();
      checkBackend();
      if (isAdminView) {
        fetchAdminData();
      }
    }
  }, [filterCategory, searchQuery, feedTypeTab, isLoggedIn, isAdminView]);

  useEffect(() => {
    if (chatItem) {
      fetchMessages(chatItem._id);
      socket.emit("join_room", chatItem._id);

      socket.on("receive_message", (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
      });
    }

    return () => {
      if (chatItem) {
        socket.off("receive_message");
      }
    };
  }, [chatItem]);

  const showToast = (msg) => {
    setThemeMessage(msg);
    setTimeout(() => {
      setThemeMessage("");
    }, 3000);
  };

  const checkBackend = async () => {
    try {
      await axios.get(`${API_URL}/items`);
      setBackendStatus("🔵 Backend Connected Successfully");
    } catch (err) {
      setBackendStatus("⚪ Backend Connection Failed");
    }
  };

  const fetchItems = async () => {
    try {
      let url = `${API_URL}/items?`;
      if (filterCategory !== "All") {
        url += `category=${filterCategory}&`;
      }
      if (searchQuery) {
        url += `search=${searchQuery}&`;
      }
      if (feedTypeTab !== "all") {
        url += `type=${feedTypeTab}&`;
      }
      const res = await axios.get(url);
      setItems(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const claimsRes = await axios.get(`${API_URL}/admin/claims`);
      setAdminClaims(claimsRes.data);
      const reportsRes = await axios.get(`${API_URL}/admin/reports`);
      setReportedItems(reportsRes.data);
      const usersRes = await axios.get(`${API_URL}/admin/users`);
      setAdminUsers(usersRes.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchMessages = async (itemId) => {
    try {
      const res = await axios.get(`${API_URL}/messages/${itemId}`);
      setMessages(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    try {
      const messageData = {
        itemId: chatItem._id,
        sender: currentUserEmail || authEmail || "guest@campus.edu",
        text: newMessageText
      };

      await axios.post(`${API_URL}/messages`, messageData);
      socket.emit("send_message", messageData);
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessageText("");
    } catch (err) {
      showToast("❌ Failed to send message.");
    }
  };

  const handleAdminClaimAction = async (claimId, status) => {
    try {
      await axios.patch(`${API_URL}/admin/claims/${claimId}`, { status });
      showToast(`✨ Claim ${status}!`);
      fetchAdminData();
    } catch (err) {
      showToast("❌ Failed to update claim.");
    }
  };

  const handleBlockUser = async (userId, currentBlockedStatus) => {
    try {
      await axios.patch(`${API_URL}/admin/users/${userId}/block`, { blocked: !currentBlockedStatus });
      showToast(`⚠️ User status updated successfully.`);
      fetchAdminData();
    } catch (err) {
      showToast("❌ Failed to update user status.");
    }
  };

  const handleReportItem = async (id) => {
    try {
      await axios.patch(`${API_URL}/items/${id}/report`);
      showToast("🚨 Item reported to admin.");
      fetchItems();
    } catch (err) {
      showToast("❌ Failed to report item.");
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        await axios.post(`${API_URL}/auth/register`, {
          name: authName,
          email: authEmail,
          password: authPassword
        });
        showToast("✨ Registered successfully! Please login.");
        setIsRegistering(false);
      } else {
        const res = await axios.post(`${API_URL}/auth/login`, {
          email: authEmail,
          password: authPassword
        });
        
        if (res.data.user && res.data.user.blocked) {
          showToast("❌ Your account has been blocked by admin.");
          setLoading(false);
          return;
        }

        setCurrentUserEmail(authEmail);
        showToast("🚀 Logged in successfully!");
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.log(err);
      showToast("❌ Authentication failed or Account Blocked.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const gEmail = user.email;
      const gName = user.displayName || gEmail.split('@')[0];

      const res = await axios.post(`${API_URL}/auth/google`, { name: gName, email: gEmail });
      if (res.data.user && res.data.user.blocked) {
        showToast("❌ Your account has been blocked by admin.");
        return;
      }
      
      setCurrentUserEmail(gEmail);
      setIsLoggedIn(true);
      showToast(`🚀 Welcome, ${gName}!`);
    } catch (err) {
      console.error(err);
      showToast("❌ Google login failed.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let photoUrl = "";

    if (imageFile) {
      const data = new FormData();
      data.append("file", imageFile);
      data.append("upload_preset", "campuscrate_preset");

      try {
        const cloudinaryRes = await fetch(
          "https://api.cloudinary.com/v1_1/ws2kvkn5/image/upload",
          {
            method: "POST",
            body: data,
          }
        );
        const fileData = await cloudinaryRes.json();
        if (fileData.secure_url) {
          photoUrl = fileData.secure_url;
        } else {
          showToast("❌ Image upload failed.");
          setLoading(false);
          return;
        }
      } catch (err) {
        showToast("❌ Image upload failed.");
        setLoading(false);
        return;
      }
    }

    try {
      const newItem = { 
        title, 
        description,
        location,
        type,
        category,
        date,
        claimQuestion,
        photoUrl,
        status: "active"
      };
      const res = await axios.post(`${API_URL}/items`, newItem);
      setItems([res.data, ...items]);
      setTitle("");
      setDescription("");
      setLocation("");
      setType("lost");
      setCategory("Electronics");
      setDate("");
      setClaimQuestion("");
      setImageFile(null);
      showToast("✨ Item posted successfully!");
      setViewMode("feed");
    } catch (err) {
      showToast("❌ Failed to post item.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/items/${id}`);
      setItems(items.filter((item) => item._id !== id));
      if (detailItem && detailItem._id === id) setDetailItem(null);
      if (chatItem && chatItem._id === id) setChatItem(null);
      showToast("🗑️ Item deleted successfully.");
      if (isAdminView) fetchAdminData();
    } catch (err) {
      console.log(err);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await axios.patch(`${API_URL}/items/${id}/status`, { status: newStatus });
      showToast(`✅ Item marked as ${newStatus}!`);
      fetchItems();
      if (detailItem && detailItem._id === id) {
        setDetailItem(res.data);
      }
    } catch (err) {
      showToast("❌ Failed to update status.");
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/claims`, {
        itemId: selectedItem._id,
        userEmail: currentUserEmail || authEmail || "guest@campus.edu",
        proofText: claimAnswer
      });
      
      setClaimStatus("✅ " + response.data.message);
      setTimeout(() => {
        setSelectedItem(null);
        setClaimAnswer("");
        setClaimStatus("");
      }, 2500);
    } catch (err) {
      console.log(err);
      setClaimStatus("❌ Failed to submit claim.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
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
            fontSize: '0.95rem'
          }}>
            {toastMessage}
          </div>
        )}

        <div style={{
          background: '#ffffff',
          padding: '35px',
          borderRadius: '20px',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.08)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <h1 style={{ color: '#2563eb', margin: '0 0 8px 0', fontSize: '2.2rem', fontWeight: '800' }}>
            CampusCrate
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 25px 0', fontWeight: '500' }}>
            {isRegistering ? "Create your account" : "Login to your account"}
          </p>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {isRegistering && (
              <input
                type="text"
                placeholder="Full Name"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                required
                style={inputStyle}
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
              style={inputStyle}
            />
            <button type="submit" disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Please wait..." : (isRegistering ? "Register" : "Login")}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '10px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🌐</span> Continue with Google
          </button>

          <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#64748b' }}>
            {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
            <span 
              onClick={() => setIsRegistering(!isRegistering)} 
              style={{ color: '#2563eb', fontWeight: '600', cursor: 'pointer' }}
            >
              {isRegistering ? "Login here" : "Register here"}
            </span>
          </p>
        </div>
      </div>
    );
  }

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
          fontSize: '0.95rem'
        }}>
          {toastMessage}
        </div>
      )}

      <div style={{
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => { setIsAdminView(false); setViewMode("feed"); }}
            style={{
              backgroundColor: !isAdminView && viewMode === "feed" ? '#2563eb' : '#ffffff',
              color: !isAdminView && viewMode === "feed" ? '#ffffff' : '#334155',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Feed
          </button>
          <button 
            onClick={() => { setIsAdminView(false); setViewMode("add"); }}
            style={{
              backgroundColor: !isAdminView && viewMode === "add" ? '#2563eb' : '#ffffff',
              color: !isAdminView && viewMode === "add" ? '#ffffff' : '#334155',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            + Post Item
          </button>
          <button 
            onClick={() => { setIsAdminView(true); }}
            style={{
              backgroundColor: isAdminView ? '#2563eb' : '#eff6ff',
              color: isAdminView ? '#ffffff' : '#2563eb',
              border: '1px solid #bfdbfe',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Admin Dashboard
          </button>
        </div>
        <button 
          onClick={() => setIsLoggedIn(false)}
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{
        background: '#ffffff',
        padding: '30px',
        borderRadius: '20px',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.08)',
        width: '100%',
        maxWidth: '500px',
        marginBottom: '20px',
        boxSizing: 'border-box',
        textAlign: 'center',
        border: '1px solid #e2e8f0'
      }}>
        <h1 style={{ color: '#2563eb', margin: '0 0 4px 0', fontSize: '2rem', fontWeight: '800' }}>
          CampusCrate
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 10px 0', fontWeight: '500' }}>
          Lost & Found Portal for Students 🔍
        </p>
        <p style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0, color: '#2563eb' }}>
          {backendStatus}
        </p>
      </div>

      {isAdminView ? (
        <div style={{
          background: '#ffffff',
          padding: '30px',
          borderRadius: '20px',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.08)',
          width: '100%',
          maxWidth: '500px',
          boxSizing: 'border-box',
          border: '1px solid #e2e8f0',
          textAlign: 'left'
        }}>
          <h2 style={{ color: '#1e293b', fontSize: '1.4rem', marginBottom: '20px' }}>Admin Dashboard</h2>
          
          <h3 style={{ fontSize: '1.1rem', color: '#2563eb', marginBottom: '10px' }}>Pending Claims Review</h3>
          {adminClaims.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>No pending claims.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
              {adminClaims.map((claim) => (
                <div key={claim._id} style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px', background: '#f8fafc' }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '0.9rem' }}>Item: {claim.itemId ? claim.itemId.title : 'Removed'}</p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#475569' }}>Claimant: {claim.userEmail}</p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#2563eb' }}>Proof: "{claim.proofText}"</p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem' }}>Status: <strong>{claim.status}</strong></p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleAdminClaimAction(claim._id, "Approved")}
                      style={{ backgroundColor: '#dcfce7', color: '#166534', border: 'none', padding: '4px 10px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleAdminClaimAction(claim._id, "Rejected")}
                      style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '4px 10px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: '1.1rem', color: '#2563eb', marginBottom: '10px' }}>Manage Users (Block / Unblock)</h3>
          {adminUsers.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>No users found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
              {adminUsers.map((u) => (
                <div key={u._id} style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 2px 0', fontWeight: '600', fontSize: '0.85rem' }}>{u.name || 'User'} ({u.email})</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: u.blocked ? '#dc2626' : '#166534' }}>
                      Status: <strong>{u.blocked ? 'Blocked' : 'Active'}</strong>
                    </p>
                  </div>
                  <button 
                    onClick={() => handleBlockUser(u._id, u.blocked)}
                    style={{ backgroundColor: u.blocked ? '#dcfce7' : '#fee2e2', color: u.blocked ? '#166534' : '#991b1b', border: 'none', padding: '4px 8px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    {u.blocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: '1.1rem', color: '#ef4444', marginBottom: '10px' }}>Abuse Reports</h3>
          {reportedItems.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No reported items.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reportedItems.map((item) => (
                <div key={item._id} style={{ border: '1px solid #fecaca', padding: '12px', borderRadius: '10px', background: '#fff5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '0.9rem' }}>{item.title}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{item.description}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(item._id)}
                    style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Delete Post
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === "add" ? (
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
            Report Lost or Found Item
          </h2>
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

            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '5px' }}>
                Upload Item Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ ...inputStyle, padding: '8px' }}
              />
            </div>

            <input
              type="text"
              placeholder="Claim Question (e.g., What wallpaper is on it?)"
              value={claimQuestion}
              onChange={(e) => setClaimQuestion(e.target.value)}
              required
              style={inputStyle}
            />

            <button type="submit" disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Uploading & Posting..." : "Add Item"}
            </button>
          </form>
        </div>
      ) : (
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
          <h2 style={{ color: '#2563eb', textAlign: 'center', marginBottom: '15px', fontSize: '1.4rem', fontWeight: '700' }}>
            Campus Items Feed
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
            <button
              onClick={() => setFeedTypeTab("all")}
              style={{
                backgroundColor: feedTypeTab === "all" ? '#2563eb' : '#f1f5f9',
                color: feedTypeTab === "all" ? '#ffffff' : '#334155',
                border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              All Items
            </button>
            <button
              onClick={() => setFeedTypeTab("lost")}
              style={{
                backgroundColor: feedTypeTab === "lost" ? '#dc2626' : '#f1f5f9',
                color: feedTypeTab === "lost" ? '#ffffff' : '#334155',
                border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              Lost Feed
            </button>
            <button
              onClick={() => setFeedTypeTab("found")}
              style={{
                backgroundColor: feedTypeTab === "found" ? '#16a34a' : '#f1f5f9',
                color: feedTypeTab === "found" ? '#ffffff' : '#334155',
                border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              Found Feed
            </button>
          </div>

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
              {Array.isArray(items) && items.map((item) => (
                <li key={item._id} style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  {item.photoUrl && (
                    <img 
                      src={item.photoUrl} 
                      alt={item.title} 
                      style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px' }} 
                    />
                  )}

                  <div style={{ textAlign: 'left', wordBreak: 'break-word', flex: 1 }}>
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
                      
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        backgroundColor: item.status === 'returned' ? '#dcfce7' : item.status === 'claimed' ? '#fef9c3' : '#f1f5f9',
                        color: item.status === 'returned' ? '#166534' : item.status === 'claimed' ? '#854d0e' : '#475569',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {item.status ? item.status.toUpperCase() : 'ACTIVE'}
                      </span>
                    </div>
                    
                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '0.9rem' }}>{item.description}</p>
                    <p style={{ margin: '0 0 6px 0', color: '#475569', fontSize: '0.85rem' }}>📂 {item.category} | 📅 {item.date}</p>
                    
                    <small style={{ color: '#1e293b', fontWeight: '600', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', border: '1px solid #bfdbfe' }}>
                      📍 {item.location}
                    </small>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setDetailItem(item)}
                        style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}
                      >
                        Details
                      </button>
                      {item.claimQuestion && (
                        <button 
                          onClick={() => setSelectedItem(item)}
                          style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}
                        >
                          Claim
                        </button>
                      )}
                      <button 
                        onClick={() => setChatItem(item)}
                        style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}
                      >
                        Chat 💬
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(item._id, "returned")} 
                        style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}
                      >
                        Returned
                      </button>
                      <button 
                        onClick={() => handleReportItem(item._id)} 
                        style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}
                      >
                        Report
                      </button>
                      <button 
                        onClick={() => handleDelete(item._id)} 
                        style={{ backgroundColor: '#ffffff', color: '#ef4444', border: '1px solid #fecaca', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* QR Code Section Added Here */}
          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            marginTop: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1rem' }}>CampusCrate Portal QR</h4>
            <QRCodeSVG value="https://campuscrate-a6d49.web.app/" size={110} />
            <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Scan to access mobile portal</p>
          </div>

        </div>
      )}

      {detailItem && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '30px',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'left'
          }}>
            <h2 style={{ color: '#1e293b', marginBottom: '10px', fontSize: '1.5rem' }}>{detailItem.title}</h2>

            {detailItem.photoUrl && (
              <img 
                src={detailItem.photoUrl} 
                alt={detailItem.title} 
                style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '12px', marginBottom: '15px' }} 
              />
            )}

            <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '15px', lineHeight: '1.5' }}>
              {detailItem.description}
            </p>

            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>📂 <strong>Category:</strong> {detailItem.category}</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>📍 <strong>Location:</strong> {detailItem.location}</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>📅 <strong>Date:</strong> {detailItem.date}</p>
              {detailItem.claimQuestion && (
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#2563eb' }}>❓ <strong>Claim Question:</strong> {detailItem.claimQuestion}</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setDetailItem(null)} 
                style={{
                  flex: 1,
                  backgroundColor: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: '10px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

      {chatItem && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '450px',
            height: '500px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '15px 20px', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Chat: {chatItem.title}</h3>
              <button 
                onClick={() => setChatItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f8fafc' }}>
              {messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', marginTop: '40px' }}>No messages yet. Start the conversation!</p>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender === (currentUserEmail || authEmail);
                  return (
                    <div key={index} style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      backgroundColor: isMe ? '#2563eb' : '#e2e8f0',
                      color: isMe ? '#ffffff' : '#1e293b',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      maxWidth: '75%',
                      fontSize: '0.9rem',
                      wordBreak: 'break-word'
                    }}>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '2px' }}>{msg.sender}</div>
                      <div>{msg.text}</div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', backgroundColor: '#ffffff' }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                style={{ ...inputStyle, flex: 1, padding: '10px' }}
              />
              <button type="submit" style={{ ...buttonStyle, width: 'auto', padding: '10px 16px', marginTop: 0 }}>
                Send
              </button>
            </form>
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