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

const SOCKET_SERVER_URL = "http://localhost:3000"; 
const matchTime = 50;
const warningTime = 30;

const Gameplay = () => {

  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { username, opponentUsername, userRole } = location.state || {};
  const [rivalUsername, setRivalUsername] = useState(opponentUsername || 'Waiting for opponent...');
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

  const socketRef = useRef(null);

  const [userData, setUserData] = useState({ name: '', email: '' });
  const [isLoadingUser, setIsLoadingUser] = useState(true);

// sets the username and rival username to display to users
  useEffect(() => {
    console.log('Username:', username);
    console.log('Opponent Username:', rivalUsername);
  }, [username, rivalUsername]);

// helps gets the user data for use later
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


//allows for real time communication between two users 
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.on('connect', () => {
        console.log('Connected to socket server:', socketRef.current.id);
    });
// waits for two people to join the game before the match begins
    socketRef.current.on('waitingForOpponent', (data) => {
        console.log(data.message);
        setRivalUsername('Waiting for opponent...');
    });
// once two people have joined the match starts
    socketRef.current.on('startMatch', (data) => {
      console.log('Match started with opponent (from gameplay file):', data.opponentUsername);
      setRivalUsername(data.opponentUsername || 'Unknown Opponent');
      console.log(`opponent is: ${rivalUsername}`)
  });
// once the data is received and compared to the other submission, results are returned
  socketRef.current.on('matchResults', (data) => {
    console.log('Match results received:', data.resultsMessage);
    setOutput(data.resultsMessage);
  });

    return () => {
        socketRef.current.disconnect();
    };
}, [matchId]);

// fetches and displays question to users
// we hope to expand this to randomize the questions
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch('http://localhost:3001/question/1'); 
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

// handles the timer and the timer running out
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

// when a user runs their code, it is compared with our test cases and returned to the user
// calls the api endpoint to run their code in the docker container and uses the test inputs we provide
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
          outputText += `Input: ${test.testCase}\n`;
          outputText += `Expected: ${test.expectedOutput}\n`;
          outputText += `Output: ${test.userOutput}\n`;
          outputText += `Passed: ${test.passed}\n\n`;
      });

      setOutput(outputText);
  } catch (error) {
      console.error('Error in handleRun:', error.message);
      setOutput(`Error: ${error.message}`);
  } finally {
      setIsCodeRunning(false);
  }
};

  const handleSubmit = () => {
    setIsModalOpen(true); 
  };

  // this handles the submissions where it calls the api endpoint and stores the information to be returned when the timer runs out
  // this also makes it so that the editor is uneditable and the user can no longer submit or run their code
  const processSubmission = async () => {
    try {
        setOutput('Submitting code...');
        const startTime = Date.now(); 

        const response = await fetch('http://localhost:3001/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username, 
                code,
                testCases,
                roomId: matchId, 
            }),
        });

        const endTime = Date.now(); 
        const executionTime = `${endTime - startTime} ms`; 

        if (!response.ok) {
            throw new Error(`Failed to submit code: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Submission successful:', data);

        setOutput(
            `Submission successful. Passed: ${data.passedCount}, Execution Time: ${data.totalTime}`
        );

        setUserAResults(data.results);
        localStorage.setItem('executionTime', executionTime);
    } catch (error) {
        console.error('Error submitting code:', error.message);
        setOutput(`Error submitting code: ${error.message}`);
    } finally {
        setIsEditorDisabled(true);
        setIsModalOpen(false);
    }
};

// once both users submit their code and the timer runs out, the submissions are compares and whoever passed the most test cases, and then (if tie) looks at the execution times
//returns the results and the winner to both users
const fetchResults = async () => {
  try {
      const userATime = localStorage.getItem('executionTime') || 0;

      const response = await fetch('http://localhost:3001/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              userAResults: userRole === 'User A' ? userAResults : undefined,
              userBResults: userRole === 'User B' ? userBResults : undefined,
              userATime: userRole === 'User A' ? userATime : undefined,
              userBTime: userRole === 'User B' ? userATime : undefined, 
              roomId: matchId,
          }),
      });

      const data = await response.json();
      setResults(data.resultsMessage);
      
  } catch (error) {
      console.error('Error fetching results:', error.message);
  }
};

useEffect(() => {
  if (results !== null) {
      console.log(`UPDATED FINAL VALUE: ${results}`);
  }
}, [results]);




// this is when both users join this is displayed as the transition screen
  if (isLoadingUser) {
    return <div>Loading user data...</div>;
  }
// this is our layout and displays all the information, buttons, and page
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
                <pre>{results}</pre>
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
