import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import ConfirmationModal from './SubmitModal';
import useLocalStorage  from './hooks/useLocalStorage';
import './gameplay.css';

const Gameplay = () => {
  const { matchId } = useParams();
  const matchTime = 20;
  const [time, setTime] = useLocalStorage(`matchTime-${matchId}`, matchTime);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [question, setQuestion] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [userAResults, setUserAResults] = useState(null);
  const [userBResults, setUserBResults] = useState(null);

  const [code, setCode] = useState(`def solution(x):
# Write your code here
  pass
    `);
  const [output, setOutput] = useState('');
  const [isEditorDisabled, setIsEditorDisabled] = useState(false); // Disable editor after submission
  const [results, setResults] = useState(null); // Store match results
  const rivalUser = "User438";
  const warningTime = 30;

  useEffect(() => {
    console.log("Code state updated:", code);
  }, [code]);
  
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch('http://localhost:3001/question/1'); // Example: Fetch question with ID 1
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

  // Timer effect
  useEffect(() => {
    let timer;
    if (time > 0) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0 && !results) {
      console.log("Timer reached 0. Fetching results...");
      fetchResults(); // Fetch results when timer runs out
    }
    return () => clearInterval(timer);
  }, [time, results]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (time / matchTime) * 100;
  const isTimeWarning = time <= warningTime;

  const onChange = React.useCallback((value, viewUpdate) => {
    if (!isEditorDisabled) setCode(value);
  }, [isEditorDisabled]);

  const handleRun = async () => {
    setIsCodeRunning(true);
    setOutput('Executing code...');

    try {
        console.log("Sending code to backend for execution:", code);

        const response = await fetch('http://localhost:3001/run-test-cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, testCases: testCases.slice(0, 2) }), // Send the first two test cases
        });

        if (!response.ok) {
            throw new Error(`Failed to execute code: ${response.statusText}`);
        }

        const { results } = await response.json();
        console.log("API Response:", results);

        let outputText = 'Execution Results:\n\n';
        results.forEach((test, index) => {
            outputText += `Test Case ${index + 1}:\n`;
            outputText += `Input: ${test.testCase}\nExpected: ${test.expectedOutput}\nOutput: ${test.userOutput}\nPassed: ${test.passed}\n\n`;
        });
        
        setOutput(outputText); // Update the output in the UI
    } catch (error) {
        console.error("Error in handleRun:", error.message);
        setOutput(`Error: ${error.message}`);
    } finally {
        setIsCodeRunning(false);
    }
};

  
  
  const handleSubmit = () => {
    setIsModalOpen(true); // Open the confirmation modal
};

const processSubmission = async () => {
  try {
      const response = await fetch('http://localhost:3001/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, testCases }),
      });

      if (!response.ok) {
          throw new Error('Failed to submit code');
      }

      const data = await response.json();
      console.log("Submission Results:", data);

      // Update state with results
      setUserAResults(data.results);
      setOutput(`Code submitted successfully.\nTotal Passed: ${data.passedCount}/${testCases.length}\nExecution Time: ${data.totalTime}`);
  } catch (error) {
      console.error("Error submitting code:", error);
      setOutput(`Error submitting code: ${error.message}`);
  } finally {
      setIsEditorDisabled(true); // Lock the editor after submission
      setIsModalOpen(false); // Close the modal
  }
};


  const fetchResults = async () => {
    try {
      const response = await fetch('http://localhost:3001/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAResults: userAResults || [], // Ensure results are available
          userBResults: userBResults || [], // Replace with actual or mock data
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
  
      const data = await response.json();
      console.log('Fetched Results:', data);
      setResults(data); // Update results after timer ends
    } catch (error) {
      console.error('Error Fetching Results:', error.message);
      setOutput(`Error fetching results: ${error.message}`);
    }
  };
  

  const initialCode = `def solution(x):
# Write your code here
  pass
`;

  const problemDescription = `Problem ${matchId}`;

  return (
    <div className="gameplay-container">
      <div className="header">
        <div className="left-section">
          <img 
            src={process.env.PUBLIC_URL + '/codestrike_logo.png'} 
            alt="Logo" 
            className="gameplay-logo" 
            style={{ cursor: 'pointer' }}
          />
          <button className="submit-btn" onClick={handleSubmit} disabled={isEditorDisabled}>
            {isEditorDisabled ? 'Submitted' : 'SUBMIT'}
          </button>
          <span className="playing-against">Playing against</span>
          <span className="rival-user">{rivalUser}</span>
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
              value={code||initialCode}
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
        onConfirm={() => {
            processSubmission(); 
        }}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Gameplay;
