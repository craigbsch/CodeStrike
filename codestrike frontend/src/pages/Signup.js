import React, { useState } from 'react';
import logo from './logo.png';
import './Signup.css';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { setDoc, doc } from 'firebase/firestore';

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};
        if (!name) newErrors.name = 'Name is required';
        if (!email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        
        // First validate the form
        if (!validateForm()) {
            return;
        }

        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user document in Firestore
            await setDoc(doc(db, "Users", user.uid), {
                userName: name,
                email: email,
                createdAt: new Date(),
                // You can add more initial user fields here
            });

            console.log("User registered successfully!!!");
            
            setSubmitted(true);
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setErrors({});

            // Navigate after a short delay
            setTimeout(() => {
                setSubmitted(false);
                navigate('/homepage'); 
            }, 1000);

        } catch (error) {
            console.error("Signup Error:", error);
            
            // Handle specific Firebase errors
            if (error.code === 'auth/email-already-in-use') {
                setErrors({email: 'Email is already in use'});
            } else {
                alert('Signup failed. Please try again.');
            }
        }
    };

    const handleSignin = () => {
        navigate('/signin');
    };

    return (
        <div className="signup-page">
            <div className="App">
                <header className="App-header">
                    <div className="container">
                        <img src={logo} className="App-logo" alt="logo" />
                    </div>
                </header>
                <div className="signup-container">
                    <header>
                        <p>Create Your CodeStrike Go Account</p>
                    </header>
                    {submitted && <div className="success-message">Signup successful!</div>}
                    <form onSubmit={handleSignup} noValidate>
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            {errors.name && <p className="error">{errors.name}</p>}
                        </div>
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
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
                        </div>
                        <div className="button-group">
                            <button type="submit" className="signup-btn primary-btn">Sign Up</button>
                            <button type="button" onClick={handleSignin} className="signup-btn secondary-btn">Login</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Signup;