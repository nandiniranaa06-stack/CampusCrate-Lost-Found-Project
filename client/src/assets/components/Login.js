import React from 'react';
import { auth, provider, signInWithPopup } from '../firebase';

const Login = () => {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const token = await user.getIdToken();
      await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: user.email, name: user.displayName })
      });

      alert(`Welcome, ${user.displayName}!`);
    } catch (error) {
      console.error("Login Error:", error.message);
      alert("Google Login Failed!");
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Login to CampusCrate</h2>
      <button
        onClick={handleGoogleLogin}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;