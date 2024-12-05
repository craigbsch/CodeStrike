import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import Homepage from './pages/homepage';
import Signup from './pages/Signup';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signin from './pages/signin';
import Splash from './pages/Splash';
import AccountPage from './pages/AccountPage';
import Leaderboard from './pages/leaderboard';
import Gameplay from './pages/gameplay';
import VictoryPage from './pages/VictoryPage'
import LossPage from './pages/LossPage';
import Lobby from './pages/Lobby';

const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(  
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Splash />} /> 
      <Route path="/signup" element={<Signup />} />
      <Route path="/homepage" element={<Homepage />} /> 
      <Route path="/account" element={<AccountPage />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/leaderboard" element={<Leaderboard/>} />
      <Route path="/play" element={<Lobby />} />
      <Route path="/gameplay/:matchId" element={<Gameplay />} />
      </Routes>
  </BrowserRouter>
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
