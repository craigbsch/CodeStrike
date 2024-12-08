const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000', // Frontend domain
    methods: ['GET', 'POST'],
    credentials: true
}));
const tempDir = path.resolve(__dirname, 'temp');

// Ensure the temp directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// Set up HTTP server and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});



const matches = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomId, username }) => {
        console.log(`Request to join room: ${roomId} by user: ${username}`);
        console.log(`is room initialized: ${!matches[roomId]}`);
        console.log(`dictionary: ${matches}`);

        // Ensure the room array is initialized
        if (matches[roomId]) {
            if (matches[roomId].length == 1){
            
            }else{
                matches[roomId] = []; // Initialize room as an array
                console.log(`New room initialized: ${roomId}`);
            }
        }

        // Push the player into the room
        matches[roomId].push({ id: socket.id, username });
        console.log(`Player ${username} with ID ${socket.id} joined room ${roomId}`);
        console.log(`Current players in room ${roomId}:`, matches[roomId]);

        // Join the Socket.IO room
        socket.join(roomId);

        // Check if the room now has 2 players
        if (matches[roomId].length === 2) {
            const [player1, player2] = matches[roomId];
            console.log(`Room ${roomId} is now full. Starting match.`);
            
            // Notify both players that the match is starting
            io.to(player1.id).emit('startMatch', { opponentUsername: player2.username });
            io.to(player2.id).emit('startMatch', { opponentUsername: player1.username });
            console.log("REACHED END")
        } else {
            // Notify the current player that they are waiting for an opponent
            socket.emit('waitingForOpponent', { message: 'Waiting for another player to join...' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Handle removing the player from matches[roomId] if necessary
    });
});


// HTTP Endpoints

app.get('/matches', (req, res) => {
    res.json(matches);
});

// Create a new match
app.post('/create-match', (req, res) => {
    const matchId = Math.random().toString(36).substring(2, 8);
    // Initialize the match in memory
    matches[matchId] = { players: [] };
    res.send({ matchId });
});

// Join an existing match
app.post('/join-match', (req, res) => {
    const { matchId } = req.body;
    if (!matches[matchId]) {
        return res.status(400).send({ success: false, error: 'Match does not exist.' });
    }

    // We do not finalize joining here. The actual join happens in Socket.IO `joinRoom` event.
    // But we return success to proceed in the client, so the user can navigate to /gameplay/:matchId
    res.send({ success: true });
});

app.post('/run-test-cases', async (req, res) => {
    const { code, testCases } = req.body;

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const codeFilePath = path.join(tempDir, 'solution.py');
    const testWrapperPath = path.join(tempDir, 'wrapped_solution.py');

    // Write the user's solution to solution.py
    fs.writeFileSync(codeFilePath, code);

    // Create a wrapped solution script
    const wrappedSolution = `
${code.replace(/if __name__ == ['"]__main__['"]:/g, '# if __name__ == "__main__":').replace(/^\s+print\(.*\)$/gm, '')}

# Wrapper for test cases
def run_tests():
    results = []
    ${testCases
        .map(
            (test) => `
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
            console.log("Unparsable stdout:", stdout.trim());
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

const submissions = []; // Array to store submissions

app.post('/submit', async (req, res) => {
    const { username, code, testCases, roomId } = req.body;

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

                // Add the submission to the global submissions array
                submissions.push({
                    username,
                    roomId,
                    results,
                    executionTime: totalExecutionTime,
                    passedCount,
                });

                console.log("Updated submissions:", submissions);

                res.send({
                    message: `Submission received for ${username}`,
                    totalTime: totalExecutionTime,
                    passedCount,
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
    const { roomId } = req.body;
  
    // Filter submissions by roomId
    const roomSubmissions = submissions.filter((sub) => sub.roomId === roomId);
  
    if (roomSubmissions.length < 2) {
      return res.status(400).send({ message: "Not enough submissions to compare" });
    }
  
    console.log("Submissions for room:", roomSubmissions);
  
    // Determine winner
    const [submission1, submission2] = roomSubmissions;
  
    const score1 = submission1.results.filter((r) => r.passed).length;
    const score2 = submission2.results.filter((r) => r.passed).length;
  
    let winner;
    if (score1 > score2) {
      winner = submission1.username;
    } else if (score2 > score1) {
      winner = submission2.username;
    } else {
      winner = submission1.executionTime < submission2.executionTime
        ? submission1.username
        : submission2.username;
    }
  
    const resultsMessage = `
      Submissions for Room ${roomId}:
      ${submission1.username}'s Score: ${score1}, Time: ${submission1.executionTime}
      ${submission2.username}'s Score: ${score2}, Time: ${submission2.executionTime}
      Winner: ${winner}
    `;
  
    res.send({ resultsMessage, winner });
  });
  





const PORT = 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
