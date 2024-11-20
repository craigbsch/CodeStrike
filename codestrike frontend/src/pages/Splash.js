import React from "react";
import "./Splash.css";
import { useNavigate } from 'react-router-dom';


function Splash() {
  const navigate = useNavigate();

  const handleSignup = () => {
    navigate('/signup');
};


  const handleSignin = () => {
      navigate('/signin');
  };

  return (
    <div className="splash-page">
      <div className="container">
        <div className="logo-container">
          <img src="/logo.png" alt="CodeStrike Logo" className="logo" />
        </div>
        <div className="content-container">
          <header>
            <p>Code Strike: Where Coders Clash and Champions Rise!</p>
          </header>
          <div className="button-group">
            <button type="submit" onClick={handleSignup} className="signup-btn primary-btn">Sign Up</button>
            <button type="button" onClick={handleSignin} className="signup-btn secondary-btn">Login</button>
          </div>
          <p className="description">
            Challenge your coding skills in real-time PvP matches! Compete against friends or players with similar skill levels on LeetCode-style problems, climb the ELO leaderboard, and sharpen your problem-solving skills under pressure. Ready to Code Strike?
          </p>
        </div>
      </div>
    </div>
  );
}

export default Splash;
