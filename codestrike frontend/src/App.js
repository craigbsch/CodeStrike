import React from 'react';
import AccountPage from './AccountPage'; 
import logo from './logo.png';

function App() {
  return (
    <div className="App">
      <div className="container">
        <img src={logo} className="App-logo" alt="logo" />
        <div className="accountpage-container">
          <AccountPage />
        </div>
      </div>
    </div>
  );
}

export default App;
