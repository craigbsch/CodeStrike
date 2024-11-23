import React from 'react';
import { Play, User, BarChart } from 'lucide-react';
import './leaderboard.css';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
  const navigate = useNavigate();

  // Updated data to use ELO instead of points
  const leaderboardData = [
    { id: 1, username: "User134", elo: 1324 },
    { id: 2, username: "User827", elo: 1320 },
    { id: 3, username: "User743", elo: 1314 },
    { id: 4, username: "User445", elo: 1290 },
    { id: 5, username: "User921", elo: 1275 },
    { id: 49, username: "You", elo: 1024 },
    { id: 50, username: "User73823", elo: 1001 },
    { id: 51, username: "User552", elo: 985 },
    { id: 1032, username: "User****", elo: 0 },
  ];

  const topThree = leaderboardData.slice(0, 3);
  const otherUsers = leaderboardData.slice(3);

  return (
    <div className="app">
      <div className="sidebar">
        <div className="icon-container">
          <div 
            className="profile-icon"
            onClick={() => navigate('/homepage')}
            style={{ cursor: 'pointer' }}
          >
            <img src={process.env.PUBLIC_URL + '/codestrike_logo.png'} alt="Logo" />
          </div>
          <button className="sidebar-icon" onClick={() => navigate('/play')}>
            <Play size={24} />
          </button>
          <button className="sidebar-icon" onClick={() => navigate('/leaderboard')}>
            <BarChart size={24} />
          </button>
          <button className="sidebar-icon" onClick={() => navigate('/account')}>
            <User size={24} />
          </button>
        </div>
      </div>
      <div className="main-content">
        <div className="leaderboard-container">
          <h1>LEADERBOARD</h1>
          <div className="podium">
            <div className="podium-item second">
              <div className="podium-info">
                <div>{topThree[1].username}</div>
              </div>
              <div className="podium-rank">2</div>
            </div>
            <div className="podium-item first">
              <div className="podium-info">
                <div>{topThree[0].username}</div>
              </div>
              <div className="podium-rank">1</div>
            </div>
            <div className="podium-item third">
              <div className="podium-info">
                <div>{topThree[2].username}</div>
              </div>
              <div className="podium-rank">3</div>
            </div>
          </div>
          <div className="other-rankings">
            {leaderboardData.map((user) => (
              <div key={user.id} className="ranking-item">
                <span>{user.id}. {user.username}</span>
                <span>{user.elo} ELO</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;