import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import './gameplay.css';

const Gameplay = () => {
  const navigate = useNavigate();
  const matchTime = 210;
  const [time, setTime] = useState(matchTime);
  const [isRunning, setIsRunning] = useState(true);
  const rivalUser = "User438";
  const warningTime = 30;
  const [code, setCode] = useState('# Write your Python code here\n');

  useEffect(() => {
    let timer;
    if (isRunning && time > 0) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, time]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (time / 210) * 100;
  const isTimeWarning = time <= warningTime;

  const onChange = React.useCallback((value, viewUpdate) => {
    setCode(value);
  }, []);

  return (
    <div className="gameplay-container">
      <div className="header">
        <div className="left-section">
          <img 
            src={process.env.PUBLIC_URL + '/codestrike_logo.png'} 
            alt="Logo" 
            className="gameplay-logo" 
            onClick={() => navigate('/homepage')}
            style={{ cursor: 'pointer' }}
          />
          <button className="submit-btn">SUBMIT</button>
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
          <h2>Problem Description</h2>
          <div className="description-content">
            {/* Add your problem description content here */}
          </div>
        </div>

        <div className="code-editor">
          <h2>Code Editor</h2>
          <div className="editor-content">
            <CodeMirror
              value={code}
              height="100%"
              theme={vscodeDark}
              extensions={[python()]}
              onChange={onChange}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightSpecialChars: true,
                history: true,
                foldGutter: true,
                drawSelection: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                syntaxHighlighting: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                defaultKeymap: true,
                searchKeymap: true,
                historyKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true,
              }}
            />
          </div>
        </div>

        <div className="console-section">
          <h2>Console</h2>
          <div className="console-content">
            {/* Add your console content here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gameplay;
