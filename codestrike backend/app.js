const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');


const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

const questions = [
    {
        id: 1,
        title: "Square a Number",
        description: "Write a program that reads an integer and prints its square.",
        testCases: [
            { input: "5\n", expectedOutput: "25\n", time_limit: 2 },
            { input: "3\n", expectedOutput: "9\n", time_limit: 2 },
            { input: "-4\n", expectedOutput: "16\n", time_limit: 2 },
        ],
    },
    {
        id: 2,
        title: "Sum of Two Numbers",
        description: "Write a program that reads two integers and prints their sum.",
        testCases: [
            { input: "2 3\n", expectedOutput: "5\n", time_limit: 2 },
            { input: "-1 -1\n", expectedOutput: "-2\n", time_limit: 2 },
            { input: "0 0\n", expectedOutput: "0\n", time_limit: 2 },
        ],
    },
];

app.get('/question/:id', (req, res) => {
    const { id } = req.params;
    const question = questions.find((q) => q.id === parseInt(id));
    if (!question) {
        return res.status(404).send({ error: "Question not found" });
    }
    res.send(question);
});


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

    let winner;
    if (userAScore > userBScore) {
        winner = 'User A';
    } else if (userBScore > userAScore) {
        winner = 'User B';
    } else {
        winner = 'It’s a tie!';
    }

    res.send({
        scores: { userAScore, userBScore },
        winner,
    });
});


  
  


app.listen(3001, () => console.log('Server running on port 3001'));
