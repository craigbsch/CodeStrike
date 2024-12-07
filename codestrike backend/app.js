const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json());


const tempDir = path.resolve(__dirname, 'temp');

// Ensure the temp directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

app.post('/run-test-cases', async (req, res) => {
    const { code, testCases } = req.body;

    const tempDir = path.resolve(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const codeFilePath = path.join(tempDir, 'solution.py');
    const testWrapperPath = path.join(tempDir, 'wrapped_solution.py');

    // Write the user's solution to solution.py
    fs.writeFileSync(codeFilePath, code);

    // Create a new wrapped solution script
    const wrappedSolution = `
${code.replace(/if __name__ == ['"]__main__['"]:/g, '# if __name__ == "__main__":').replace(/^\s+print\(.*\)$/gm, '')}

# Wrapper for test cases
def run_tests():
    results = []
    ${testCases
        .map(
            (test, index) => `
    try:
        input_value = ${JSON.stringify(test.input.trim())}
        expected_output = ${JSON.stringify(test.expectedOutput.trim())}
        user_output = str(solution(int(input_value.strip())))
        passed = user_output == expected_output
        results.append({
            "testCase": input_value,
            "expectedOutput": expected_output,
            "userOutput": user_output,
            "passed": passed
        })
    except Exception as e:
        results.append({
            "testCase": ${JSON.stringify(test.input.trim())},
            "expectedOutput": ${JSON.stringify(test.expectedOutput.trim())},
            "userOutput": str(e),
            "passed": False
        })
`
        )
        .join('\n')}
    return results

if __name__ == "__main__":
    import json
    results = run_tests()
    print(json.dumps(results, indent=4))
`;
    
    // Write the wrapped solution to a new file
    fs.writeFileSync(testWrapperPath, wrappedSolution);

    console.log("Wrapped solution content:", fs.readFileSync(testWrapperPath, 'utf8'));

    // Docker command to execute the wrapped script
    const dockerCommand = `docker run --rm -v "${tempDir}:/sandbox/temp" docker_python sh -c "python3 /sandbox/temp/wrapped_solution.py"`;

    exec(dockerCommand, (err, stdout, stderr) => {
        console.log("Docker Command:", dockerCommand);
        console.log("Raw stdout:", stdout);
        console.log("Raw stderr:", stderr);

        if (err) {
            console.error("Error executing code:", stderr);
            return res.status(500).send({ error: stderr.trim() });
        }

        try {
            const results = JSON.parse(stdout.trim()); // Parse the JSON results
            res.send({ results });
        } catch (parseError) {
            console.error("Error parsing JSON output:", parseError.message);
            console.log("Unparsable stdout:", stdout.trim()); // Log the problematic output
            res.status(500).send({ error: "Failed to parse execution results." });
        }
    });
});




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

app.post('/submit', async (req, res) => {
    const { code, testCases } = req.body;

    // Ensure the temp directory exists
    const tempDir = path.resolve(__dirname, 'temp').replace(/\\/g, '/');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    // Save the user code to a file
    const codeFilePath = path.join(tempDir, `wrapped_solution.py`);
    const wrappedCode = `
${code.replace(/if __name__ == ['"]__main__['"]:/g, '# if __name__ == "__main__":')}

# Wrapper for test cases
def run_tests():
    results = []
    ${testCases
        .map((test, index) => `
    try:
        input_value = ${JSON.stringify(test.input.trim())}
        expected_output = ${JSON.stringify(test.expectedOutput.trim())}
        user_output = str(solution(int(input_value.strip())))
        passed = user_output == expected_output
        results.append({
            "testCase": input_value,
            "expectedOutput": expected_output,
            "userOutput": user_output,
            "passed": passed
        })
    except Exception as e:
        results.append({
            "testCase": input_value,
            "expectedOutput": expected_output,
            "userOutput": str(e),
            "passed": False
        })
        `)
        .join('\n')}
    return results

if __name__ == "__main__":
    import json
    results = run_tests()
    print(json.dumps(results, indent=4))
`;
    fs.writeFileSync(codeFilePath, wrappedCode);

    // Start tracking total execution time
    const startTime = new Date();

    try {
        const dockerCommand = `docker run --rm -v "${tempDir}:/sandbox/temp" docker_python sh -c "python3 /sandbox/temp/wrapped_solution.py"`;
        console.log("Executing Docker Command:", dockerCommand);

        exec(dockerCommand, (err, stdout, stderr) => {
            const totalExecutionTime = `${new Date() - startTime} ms`;

            if (err) {
                console.error("Error executing code:", stderr);
                return res.status(500).send({
                    error: "Execution failed",
                    stderr: stderr.trim(),
                    executionTime: totalExecutionTime
                });
            }

            console.log("Raw stdout:", stdout);
            console.log("Raw stderr:", stderr);

            try {
                const results = JSON.parse(stdout.trim());
                const passedCount = results.filter((result) => result.passed).length;

                res.send({
                    results,
                    totalTime: totalExecutionTime,
                    passedCount
                });
            } catch (parseError) {
                console.error("Error parsing JSON output:", parseError.message);
                res.status(500).send({
                    error: "Failed to parse execution results.",
                    stdout: stdout.trim(),
                    stderr: stderr.trim()
                });
            }
        });
    } catch (error) {
        console.error("Error submitting code:", error);
        res.status(500).send({ error: "Internal server error" });
    }
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
