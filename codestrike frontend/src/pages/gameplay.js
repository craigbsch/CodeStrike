import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import ConfirmationModal from './SubmitModal';
import './gameplay.css';

const Gameplay = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const matchTime = 210;
  const [time, setTime] = useState(matchTime);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const rivalUser = "User438";
  const warningTime = 30;
  const [code, setCode] = useState('# Write your Python code here\n');
  const [output, setOutput] = useState('');

  useEffect(() => {
    let timer;
    if (isTimerRunning && time > 0) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, time]);

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

  const handleSubmit = () => {
    setIsModalOpen(true);
  };

  const confirmSubmission = () => {
    setIsModalOpen(false);
    run_code();
  };

  const run_code = async () => {
    setIsCodeRunning(true);
    setOutput('Executing code...');

    try {
      const submitResponse = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'accept': 'application/json',
          'X-RapidAPI-Key': process.env.REACT_APP_RAPID_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          source_code: code,
          language_id: 71,
          stdin: '',
          expected_output: null,
          memory_limit: null,
          time_limit: null
        })
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new Error(`API Error (${submitResponse.status}): ${errorText}`);
      }

      const token = await submitResponse.json();

      const resultResponse = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token.token}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': process.env.REACT_APP_RAPID_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      });

      if (!resultResponse.ok) {
        throw new Error('Failed to get results');
      }

      const result = await resultResponse.json();

      let outputText = '';
      if (result.compile_output) {
        outputText += `Compilation Output:\n${result.compile_output}\n`;
      }
      if (result.stderr) {
        outputText += `Error:\n${result.stderr}\n`;
      }
      if (result.stdout) {
        outputText += `Output:\n${result.stdout}\n`;
      }
      if (result.time) {
        outputText += `\nExecution Time: ${result.time}s`;
      }
      if (result.memory) {
        outputText += `\nMemory Used: ${Math.round(result.memory / 1024)} KB`;
      }
      if (!outputText) {
        outputText = 'No output generated.';
      }

      setOutput(outputText);

    } catch (error) {
      setOutput(`Error: ${error.message}\nPlease try again.`);
    } finally {
      setIsCodeRunning(false);
    }
  };

  const problemDescription = `Problem ${matchId}`;

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
          <button className="submit-btn" onClick={handleSubmit}>SUBMIT</button>
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
          <h2>{problemDescription}</h2>
          <div className="description-content">
            {/* Add your problem description content here */}
          </div>
        </div>

        <div className="code-editor">
          <div className="editor-header">
            <h2>Code Editor</h2>
            <button 
              className="run-btn" 
              onClick={run_code}
              disabled={isCodeRunning}
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
            <pre>{output}</pre>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={confirmSubmission} 
      />
    </div>
  );
};

export default Gameplay;
