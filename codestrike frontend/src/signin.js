import React, { useState } from 'react';
import './signin.css'; 

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Sign-in attempt:', { email, password });
  };

  return (
    <div className="signin-container">
      {/* Logo */}
      <img src="codestrike_logo.png" alt="Logo" className="codestrike_logo" />
      
      {/* Email Address */}
      <div className="email-container">
      <input
      type="email"
      id="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="Email Address" 
      required
     />
      </div>
      
      {/* Password */}
      <div className="password-container">
      <input
      type="password"
      id="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Password" 
      required
      />
      </div>
      
      {/* Sign Up and Login buttons */}
      <button className="signup">SIGN UP</button>
      <button className="login">LOGIN</button>

      {/* Forgot Password */}
      <span className="forgot-password">Forgot Password?</span>
    </div>
  );
};

export default SignIn;
