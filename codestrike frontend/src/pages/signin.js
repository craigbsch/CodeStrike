import React, { useState } from 'react';
import './signin.css'; 
import { useNavigate } from 'react-router-dom';


const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();


  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Sign-in attempt:', { email, password });
    navigate('/signup');
  };

  const handleSignup = () => {
    navigate('/homepage');
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        {/* Logo */}
        <img src="logo.png" alt="Logo" className="logo" />
        
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
        <button onClick={handleSubmit} className="signup">SIGN UP</button>
        <button onClick={handleSignup} className="login">LOGIN</button>

        {/* Forgot Password */}
        <span className="forgot-password">Forgot Password?</span>
      </div>
    </div>
  );
};

export default SignIn;
