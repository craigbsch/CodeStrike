import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import ConfirmationModal from './SubmitModal';
import useLocalStorage from './hooks/useLocalStorage';
import './gameplay.css';

// Firebase imports
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Socket.IO
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = "http://localhost:3000"; // Update this if needed
const matchTime = 50;
const warningTime = 30;

const Gameplay = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [rivalUsername, setRivalUsername] = useState('Waiting for opponent...');
  const [time, setTime] = useLocalStorage(`matchTime-${matchId}`, matchTime);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [question, setQuestion] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [userAResults, setUserAResults] = useState(null);
  const [userBResults, setUserBResults] = useState(null);
  const [code, setCode] = useState(`def solution(x):\n# Write your code here\n  pass`);
  const [output, setOutput] = useState('');
  const [isEditorDisabled, setIsEditorDisabled] = useState(false);
  const [results, setResults] = useState(null);

  // Socket reference
  const socketRef = useRef(null);

  // User data from Firebase
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDocRef = doc(db, "Users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserData({
              name: userDoc.data().userName || '',
              email: currentUser.email || ''
            });
          }
        }
        setIsLoadingUser(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsLoadingUser(false);
      }
    };
    fetchUserData();
  }, []);

  // Socket.IO setup
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.on('connect', () => {
        console.log('Connected to socket server:', socketRef.current.id);
        //socketRef.current.emit('joinRoom', matchId);
        console.log("CALLED FROM GAMEPLAY");
    });

    socketRef.current.on('waitingForOpponent', (data) => {
        console.log(data.message);
        setRivalUsername('Waiting for opponent...');
    });

    socketRef.current.on('startMatch', (data) => {
        console.log('Match started with opponent:', data.opponentId);

        const rivalDocRef = doc(db, "Users", data.opponentId);
        getDoc(rivalDocRef).then((docSnap) => {
            if (docSnap.exists()) {
                setRivalUsername(docSnap.data().userName || 'Unknown Opponent');
            }
        });
    });

    return () => {
        socketRef.current.disconnect();
    };
}, [matchId]);

  // Fetch question on mount
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch('http://localhost:3001/question/1'); // Example ID: 1
        if (!response.ok) {
          throw new Error('Failed to fetch question');
        }
        const data = await response.json();
        setQuestion(data);
        setTestCases(data.testCases);
      } catch (error) {
        console.log('Error fetching question:', error.message);
      }
    };
    fetchQuestion();
  }, []);

  // Timer logic
  useEffect(() => {
    let timer;
    if (time > 0 && !results) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0 && !results) {
      console.log("Timer reached 0. Fetching results...");
      fetchResults();
    }
    return () => clearInterval(timer);
  }, [time, results, setTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (time / matchTime) * 100;
  const isTimeWarning = time <= warningTime;

  const onChange = useCallback((value) => {
    if (!isEditorDisabled) {
      setCode(value);
    }
  }, [isEditorDisabled]);

  const handleRun = async () => {
    setIsCodeRunning(true);
    setOutput('Executing code...');

    try {
      const response = await fetch('http://localhost:3001/run-test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, testCases: testCases.slice(0, 2) }),
      });

      if (!response.ok) {
        throw new Error(`Failed to execute code: ${response.statusText}`);
      }

      const { results } = await response.json();

      let outputText = 'Execution Results:\n\n';
      results.forEach((test, index) => {
        outputText += `Test Case ${index + 1}:\n`;
        outputText += `Input: ${test.testCase}\nExpected: ${test.expectedOutput}\nOutput: ${test.userOutput}\nPassed: ${test.passed}\n\n`;
      });

      setOutput(outputText);
    } catch (error) {
      console.error("Error in handleRun:", error.message);
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsCodeRunning(false);
    }
  };

  const handleSubmit = () => {
    setIsModalOpen(true); // Open confirmation modal
  };

  const processSubmission = async () => {
    try {
        const response = await fetch('http://localhost:3001/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, testCases }),
        });

        if (!response.ok) {
            throw new Error(`Failed to submit code: ${response.statusText}`);
        }

        const data = await response.json();
        setUserAResults(data.results);
        setOutput(`Code submitted successfully.\nTotal Passed: ${data.passedCount}/${testCases.length}\nExecution Time: ${data.totalTime}`);
    } catch (error) {
        console.error("Error submitting code:", error.message);
        setOutput(`Error submitting code: ${error.message}`);
    } finally {
        setIsEditorDisabled(true);
        setIsModalOpen(false);
    }
};


const fetchResults = async () => {
    try {
        const response = await fetch('http://localhost:3001/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAResults,
                userBResults,
                userATime: localStorage.getItem('userATime'), // Retrieve stored execution time
                userBTime: localStorage.getItem('userBTime') // Retrieve rival's execution time
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch results');
        }

        const data = await response.json();
        console.log('Fetched Results:', data);
        setResults(data);
    } catch (error) {
        console.error('Error Fetching Results:', error.message);
        setOutput(`Error fetching results: ${error.message}`);
    }
};



  if (isLoadingUser) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="gameplay-container">
      <div className="header">
        <div className="left-section">
          <span className="user-info">{userData.name} ({userData.email})</span>
          <button className="submit-btn" onClick={handleSubmit} disabled={isEditorDisabled}>
            {isEditorDisabled ? 'Submitted' : 'SUBMIT'}
          </button>
          <span className="playing-against">Playing against</span>
          <span className="rival-user">{rivalUsername}</span>
        </div>
        <div className="timer-container">
          <div className="timer-bar">
            <div 
              className={`timer-progress ${isTimeWarning ? 'warning' : ''}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className={`timer-text ${isTimeWarning ? 'warning' : ''}`}>
            {formatTime(time)}
          </span>
        </div>
      </div>

      <div className="gameplay-main-content">
        <div className="problem-description">
          {question ? (
            <>
              <h2>{question.title}</h2>
              <p>{question.description}</p>
            </>
          ) : (
            <p>Loading question...</p>
          )}
        </div>
        
        <div className="code-editor">
          <div className="editor-header">
            <h2>Code Editor</h2>
            <button 
              className="run-btn" 
              onClick={handleRun}
              disabled={isCodeRunning || isEditorDisabled}
            >
              {isCodeRunning ? 'Running...' : 'Run Code'}
            </button>
          </div>
          <div className="editor-content">
            <CodeMirror
              value={code}
              height="100%"
              theme={vscodeDark}
              extensions={[python()]}
              onChange={onChange}
              editable={!isEditorDisabled}
            />
          </div>
        </div>

        <div className="console-section">
          <h2>Console</h2>
          <div className="console-content">
          {results ? (
            <div>
              <h3>Results:</h3>
              <p>Your Score: {results.userAScore}</p>
              <p>Opponent's Score: {results.userBScore}</p>
              <h4>Winner: {results.winner}</h4>
            </div>
          ) : (
            <pre>{output}</pre>
          )}
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onConfirm={async () => {
          console.log("onConfirm triggered");
          await processSubmission();
        }}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Gameplay
