import React, { useState } from 'react';
import { Play, User, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AccountPage.css';

const AccountPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  //handles account deletion
  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account?')) {
      //insert code for deleting account
      alert('Account deleted');
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="icon-container">
          <div 
            className="profile-icon"
            onClick={() => navigate('/homepage')}
            style={{ cursor: 'pointer' }}
          >
            <img src={process.env.PUBLIC_URL + '/codestrike_logo.png'} alt="Logo" />
          </div>
          <button className="sidebar-icon" onClick={() => navigate('/play')}>
            <Play size={24} />
          </button>
          <button className="sidebar-icon" onClick={() => navigate('/leaderboard')}>
            <BarChart size={24} />
          </button>
          <button className="sidebar-icon" onClick={() => navigate('/account')}>
            <User size={24} />
          </button>
        </div>
      </div>
      <div className="main-content">
        <div className="accountpage-container">
          <div className="account-page">
            <div className="profile-circle"></div>
            
            <div className="account-form">
              <div className="input-group">
                <label htmlFor="username">Username:</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>

              <div className="input-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <button className="delete-account" onClick={handleDeleteAccount}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
