import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Lobby.css';

const Lobby = () => {
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState('');
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);

  const createMatch = () => {
    const newMatchId = Math.random().toString(36).substring(2, 8);
    setMatchId(newMatchId);
    setIsCreatingMatch(true);
    setPlayerCount(0);
  };

  const joinMatch = () => {
    if (matchId) {
      setPlayerCount((prevCount) => {
        const newCount = prevCount + 1;
        if (newCount === 2) {
          navigate(`/gameplay/${matchId}`);
        }
        return newCount;
      });
    }
  };

  return (
    <div className="lobby-container">
      <h1>Lobby</h1>
      <button className="create-match-btn" onClick={createMatch}>Create New Match</button>
      {isCreatingMatch && <p>Your Match ID: {matchId}</p>}
      <h2>Or Join Existing Match</h2>
      <input
        type="text"
        placeholder="Enter Match ID"
        value={matchId}
        onChange={(e) => setMatchId(e.target.value)}
      />
      <button className="join-match-btn" onClick={joinMatch}>Join Match</button>
      {playerCount > 0 && <p>Player {playerCount} has joined the match.</p>}
      {playerCount === 2 && <p>Both players are ready! Redirecting to gameplay...</p>}
    </div>
  );
};

export default Lobby;
