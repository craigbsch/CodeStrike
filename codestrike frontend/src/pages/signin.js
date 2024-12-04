import React, { useState } from 'react';
import './signin.css'; 
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import logo from './logo.png';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSignin = async (e) => {
    e.preventDefault();

    // First validate the form
    if (!validateForm()) {
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in successfully');

      setSubmitted(true);
      setEmail('');
      setPassword('');

      setErrors({});

      // Navigate after a short delay
      setTimeout(() => {
        setSubmitted(false);
        navigate('/homepage'); 
      }, 1000);
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleSignUp = () => {
    navigate('/signup');
};

  return (
    // <div className="signin-page">
    //   <div className="signin-container">
    //     {/* Logo */}
    //     <img src="logo.png" alt="Logo" className="logo" />
        
    //     {/* Email Address */}
    //     <div className="email-container">
    //     <input
    //     type="email"
    //     id="email"
    //     value={email}
    //     onChange={(e) => setEmail(e.target.value)}
    //     placeholder="Email Address" 
    //     required
    //   />
    //     </div>
        
    //     {/* Password */}
    //     <div className="password-container">
    //     <input
    //     type="password"
    //     id="password"
    //     value={password}
    //     onChange={(e) => setPassword(e.target.value)}
    //     placeholder="Password" 
    //     required
    //     />
    //     </div>
        
    //     {/* Sign Up and Login buttons */}
    //     <button onClick={handleSubmit} className="signup">SIGN UP</button>
    //     <button onClick={handleSignup} className="login">LOGIN</button>

    //     {/* Forgot Password */}
    //     <span className="forgot-password">Forgot Password?</span>
    //   </div>
    // </div>

    <div className="signin-page">
      <div className="App">
        <header className="App-header">
            <div className="container">
                <img src={logo} className="App-logo" alt="logo" />
            </div>
        </header>
        <div className="signin-container">
          <header>
            <p>Log In to your Code Strike Go Account</p>
          </header>
            {submitted && <div className="success-message">Login successful!</div>}
            <form onSubmit={handleSignin} noValidate>
                <div className="form-group">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    {errors.email && <p className="error">{errors.email}</p>}
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {errors.password && <p className="error">{errors.password}</p>}
                </div>
                <div className="button-group">
                    <button type="submit" className="signin-btn primary-btn">Login</button>
                    <button type="button" onClick={handleSignUp} className="signin-btn secondary-btn">Sign Up</button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
