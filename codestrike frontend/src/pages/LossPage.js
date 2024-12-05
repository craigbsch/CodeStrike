import React from "react";
import "./LossPage.css";
import { useNavigate } from 'react-router-dom';

const LossPage = () => {
  return (
    <div className="loss-page-wrapper">
    <div className="loss-page">
      <div className="loss-container">
        <h1 className="loss-title">Try Again Next Time!</h1>
        <img src="/loss.png" alt="Crown" className="loss-image" />
        <p className="loss-username">Your Username</p>
        <button className="loss-button">Continue</button>
      </div>
    </div>
  </div>
  );
};

export default LossPage