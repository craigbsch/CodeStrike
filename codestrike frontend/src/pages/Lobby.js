import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Lobby.css';
import { io } from 'socket.io-client';


const Lobby = () => {
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState('');
  const [username, setUsername] = useState('');
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [opponentUsername, setOpponentUsername] = useState('');
  const [socket, setSocket] = useState(null);

  const createMatch = async () => {
    const response = await fetch('http://localhost:3001/create-match', { method: 'POST' });
    const data = await response.json();
    setMatchId(data.matchId);
    setIsCreatingMatch(true);
  };

  const joinMatch = () => {
    if (matchId && username) {
      const socketInstance = io('http://localhost:3000'); 
      setSocket(socketInstance);

      socketInstance.emit('joinRoom', { roomId: matchId, username });

      socketInstance.on('startMatch', (data) => {
        setOpponentUsername(data.opponentUsername);
        navigate(`/gameplay/${matchId}`, { state: { username, opponentUsername: data.opponentUsername } });
      });

      socketInstance.on('waitingForOpponent', (data) => {
        console.log(data.message);
        alert('Waiting for another player to join...');
      });
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