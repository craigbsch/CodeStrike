const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');


const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

app.get('/results/:matchId', (req, res) => {
    const { matchId } = req.params;
    console.log(`Received matchId: ${matchId}`);
    res.json({
      matchId,
      userResults: [
        { passed: true }, { passed: false }
      ],
      rivalResults: [
        { passed: true }, { passed: true }
      ],
      winner: 'Rival User'
    });
  });

app.post('/submit', (req, res) => {
    const { code, testCases } = req.body;

    // Ensure 'temp' directory exists
    const tempDir = path.resolve(__dirname, 'temp').replace(/\\/g, '/');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    // Save the user code to a file
    const codeFilePath = path.join(tempDir, `solution.py`);
    fs.writeFileSync(codeFilePath, code);

    const results = [];
    const startTime = new Date(); // Track total execution time

    testCases.forEach((testCase, index) => {
        const inputFilePath = path.join(tempDir, `test_input_${index}.txt`);
        fs.writeFileSync(inputFilePath, testCase.input);

        const dockerCommand = `docker run --rm -v "${tempDir}:/sandbox/temp" docker_python sh -c "cat /sandbox/temp/test_input_${index}.txt | python3 /sandbox/temp/solution.py"`;

        const testStartTime = new Date(); // Track individual test execution time

        exec(dockerCommand, (err, stdout, stderr) => {
            const testEndTime = new Date();
            const executionTime = testEndTime - testStartTime; // Execution time in ms

            if (err) {
                console.error(`Error in Test Case ${index}:`, stderr);
                results.push({
                    testCase: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    userOutput: stderr.trim(),
                    passed: false,
                    executionTime: `${executionTime} ms`,
                });
            } else {
                const userOutput = stdout.trim();
                const passed = userOutput === testCase.expectedOutput.trim();

                results.push({
                    testCase: testCase.input,
                    expectedOutput: testCase.expectedOutput,
                    userOutput,
                    passed,
                    executionTime: `${executionTime} ms`,
                });
            }

            // Send results after processing all test cases
            if (results.length === testCases.length) {
                const totalTime = new Date() - startTime; // Total time for all test cases
                const passedCount = results.filter((result) => result.passed).length;

                res.send({
                    results,
                    totalTime: `${totalTime} ms`,
                    passedCount,
                });
            }
        });
    });
});


app.post('/compare', (req, res) => {
    const { userAResults, userBResults } = req.body;

    const userAScore = userAResults.filter((result) => result.passed).length;
    const userBScore = userBResults.filter((result) => result.passed).length;

    const userATime = userAResults.reduce(
        (total, result) => total + parseInt(result.executionTime),
        0
    );
    const userBTime = userBResults.reduce(
        (total, result) => total + parseInt(result.executionTime),
        0
    );

    let winner;
    if (userAScore > userBScore) {
        winner = 'User A';
    } else if (userBScore > userAScore) {
        winner = 'User B';
    } else {
        winner = userATime < userBTime ? 'User A' : 'User B';
    }

    res.send({
        scores: { userAScore, userBScore },
        executionTimes: { userATime: `${userATime} ms`, userBTime: `${userBTime} ms` },
        winner,
    });
});


  
  


app.listen(3001, () => console.log('Server running on port 3001'));
