import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Lobby.css';
import { io } from 'socket.io-client';


const Lobby = () => {
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState('');
  const [username, setUsername] = useState('');
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);

  const createMatch = async () => {
    const response = await fetch('http://localhost:3001/create-match', { method: 'POST' });
    const data = await response.json();
    setMatchId(data.matchId);
    setIsCreatingMatch(true);
  };

  const joinMatch = async () => {
    if (matchId.trim() && username.trim()) {
        const socket = io('http://localhost:3000'); // Connect to the backend
        console.log("CALLED FROM LOBBY HERE");
        socket.emit('joinRoom', { roomId: matchId, username });

        // Listen for 'startMatch' event to navigate
        socket.on('startMatch', (data) => {
            console.log(`Match started with opponent: ${data.opponentUsername}`);
            navigate(`/gameplay/${matchId}`, { state: { username, opponentUsername: data.opponentUsername } });
        });

        // Optionally, display a waiting message while waiting for the opponent
        socket.on('waitingForOpponent', (data) => {
            console.log(data.message);
            alert(data.message);
        });
    } else {
        alert('Please enter both a match ID and a username.');
    }
};


  return (
    <div className="lobby-container">
      <div className="lobby-text-h1">Lobby</div>
      <input
        type="text"
        placeholder="Enter Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button className="create-match-btn" onClick={createMatch}>Create New Match</button>
      {isCreatingMatch && <p>Your Match ID: {matchId}</p>}
      <input
        type="text"
        placeholder="Enter Match ID"
        value={matchId}
        onChange={(e) => setMatchId(e.target.value)}
      />
      <button className="join-match-btn" onClick={joinMatch}>Join Match</button>
    </div>
  );
};
export default Lobby;