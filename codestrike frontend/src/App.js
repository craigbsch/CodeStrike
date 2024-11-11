import './App.css';
import React from 'react';
import Signup from './Signup.js';
import logo from './logo.png';


function App() {
  return (
    <div className="App">
      <div className="container">
        <img src={logo} className="App-logo" alt="logo" />
        <div className="signup-container">
          <Signup />
        </div>
      </div>
    </div>
  );
}

export default App;
