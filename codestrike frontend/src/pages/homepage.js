import React, { useState, useRef } from 'react';
import {Play, BarChart2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './homepage.css';

const FriendsList = () => {
  const [friends] = useState([
    { id: 1, name: "Friend 1", online: true },
    { id: 2, name: "Friend 2", online: true },
    { id: 3, name: "Friend 3", online: false },
    { id: 4, name: "Friend 4", online: true },
    { id: 5, name: "Friend 5", online: false }
  ]);

  // Sort friends with online friends first
  const sortedFriends = [...friends].sort((a, b) => {
    if (a.online && !b.online) return -1;
    if (!a.online && b.online) return 1;
    return 0;
  });

  return (
    <div className="friends-panel">
      <h2>Friends</h2>
      <input 
        type="text" 
        className="friends-input"
        placeholder="Add Friends..."
      />
      <div className="friends-list">
        {sortedFriends.map((friend) => (
          <div 
            key={friend.id} 
            className={`friend-item ${friend.online ? 'online' : 'offline'}`}
          >
            {friend.name}
          </div>
        ))}
      </div>
    </div>
  );
};

const CodeEditor = ({ navigate }) => {
  return (
    <div className="code-area">
      <div className="include-statement">
        #include CodeStrike libraries <span className="comment">//colored text are buttons</span>
      </div>
      <div className="include-statement">
        #include CS 320 libraries
      </div>
      <div className="spacer" />
      <div className="code-line">
        <span 
          className="function-play"
          onClick={() => navigate('/play')}
        >
          Play()
        </span>
        <span className="comment">//start a Ranked Match</span>
      </div>
      <div className="code-line">
        for (int i = 0; i {'<'} 10; i++) {'{'}
      </div>
      <div className="code-line indent">
        <span 
          className="function-leaderboard"
          onClick={() => navigate('/leaderboard')}
        >
          Leaderboard()
        </span>
        <span className="comment">//access the leaderboard and see where you rank</span>
      </div>
      <div className="code-line">{'}'}</div>
      <div className="spacer" />
      <div className="code-line">
        int x = 0;
      </div>
      <div className="code-line">
        while (x != 3) {'{'}
      </div>
      <div className="code-line indent">
        <span 
          className="function-account"
          onClick={() => navigate('/account')}
        >
          Account()
        </span>
        <span className="comment">//access your profile/account</span>
      </div>
      <div className="code-line">{'}'}</div>
    </div>
  );
};

const Sidebar = ({ navigate }) => {
  return (
    <div className="sidebar">
      <div className="icon-container">
        <div 
          className="profile-icon"
          onClick={() => navigate('/homepage')}
          style={{ cursor: 'pointer' }}
          title="Account"
        >
          <img src={process.env.PUBLIC_URL + '/codestrike_logo.png'} alt="CodeStrike Logo" />
        </div>
        <button className="sidebar-icon" onClick={() => navigate('/play')}>
          <Play />
        </button>
        <button className="sidebar-icon" onClick={() => navigate('/leaderboard')}>
          <BarChart2 />
        </button>
        <button className="sidebar-icon" onClick={() => navigate('/account')}>
          <User />
        </button>
      </div>
      <FriendsList />
    </div>
  );
};

const Terminal = () => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };
  
  return (
    <div className="bottom-bar" onClick={handleTerminalClick}>
      <div className="terminal-prompt">
        <div className="prompt-text">username@</div>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="terminal-input"
          spellCheck="false"
          rows={1}
        />
      </div>
    </div>
  );
};

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <Sidebar navigate={navigate} />
      <div className="main-content">
        <div className="top-bar">
          <span>File.1</span>
          <button 
            className="logout-btn"
            onClick={() => navigate('/logout')}
          >
            LOGOUT
          </button>
        </div>
        <CodeEditor navigate={navigate} />
        <Terminal />
      </div>
    </div>
  );
};

export default Homepage;