import React from "react";
import "./VictoryPage.css";
import { useNavigate } from 'react-router-dom';

const VictoryPage = () => {
  return (
    <div className="victory-page-wrapper">
      <div className="victory-page">
        <div className="victory-container">
          <h1 className="victory-title">Victory!</h1>
          <img src="/crown.png" alt="Crown" className="victory-crown" />
          <p className="victory-username">Your Username</p>
          <button className="victory-button">Continue</button>
        </div>
      </div>
    </div>
  );
};

export default VictoryPage;