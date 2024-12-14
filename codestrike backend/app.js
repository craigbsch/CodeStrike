const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());

// cors allows the frontend to call on the backend
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST'],
    credentials: true
}));
const tempDir = path.resolve(__dirname, 'temp');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});


// holds active matches to call on later
const matches = {};

// allows for real time communication between two users
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomId, username }) => {
        console.log(`Request to join room: ${roomId} by user: ${username}`);
        console.log(`is room initialized: ${!matches[roomId]}`);
        console.log(`dictionary: ${matches}`);

        // if the room id is not already created and in the matches then we add an empty one
        // this parts checks that two players are in the room and if there is not, then the match does not start until two join
        if (matches[roomId]) {
            if (matches[roomId].length == 1){
            
            }else{
                matches[roomId] = []; 
                console.log(`New room initialized: ${roomId}`);
            }
        }

        matches[roomId].push({ id: socket.id, username });
        console.log(`Player ${username} with ID ${socket.id} joined room ${roomId}`);
        console.log(`Current players in room ${roomId}:`, matches[roomId]);

        socket.join(roomId);

        if (matches[roomId].length === 2) {
            const [player1, player2] = matches[roomId];
            console.log(`Room ${roomId} is now full. Starting match.`);
            

            //the match is then started when both are in the room
            io.to(player1.id).emit('startMatch', { opponentUsername: player2.username });
            io.to(player2.id).emit('startMatch', { opponentUsername: player1.username });
            console.log("REACHED END")
        } else {
            socket.emit('waitingForOpponent', { message: 'Waiting for another player to join...' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});


// HTTP API Endpoints

// retrieves matches from the dictionary
app.get('/matches', (req, res) => {
    res.json(matches);
});

// creates the new unique match id
app.post('/create-match', (req, res) => {
    const matchId = Math.random().toString(36).substring(2, 8);
    matches[matchId] = { players: [] };
    res.send({ matchId });
});

// sends request to join the room that corresponds to the match id
app.post('/join-match', (req, res) => {
    const { matchId } = req.body;
    if (!matches[matchId]) {
        return res.status(400).send({ success: false, error: 'Match does not exist.' });
    }

    res.send({ success: true });
});

// starts docker container in order to dynamically test the user code input
// we provide test input and in the docker container, their code is run with our first two test case inputs and then the results are stored
app.post('/run-test-cases', async (req, res) => {
    const { code, testCases } = req.body;

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const codeFilePath = path.join(tempDir, 'solution.py');
    const testWrapperPath = path.join(tempDir, 'wrapped_solution.py');

    fs.writeFileSync(codeFilePath, code);

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
            const results = JSON.parse(stdout.trim()); 
            res.send({ results });
        } catch (parseError) {
            console.error("Error parsing JSON output:", parseError.message);
            console.log("Unparsable stdout:", stdout.trim());
            res.status(500).send({ error: "Failed to parse execution results." });
        }
    });
});

// these are our static questions for right now
// we hope to expand and randomize the question presented to the user by using the firebase database of questions
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

// this fetches the question and can easily change this to randomize it
app.get('/question/:id', (req, res) => {
    const { id } = req.params;
    const question = questions.find((q) => q.id === parseInt(id));
    if (!question) {
        return res.status(404).send({ error: "Question not found" });
    }
    res.send(question);
});



const submissions = []; 
// when a user submits, the code and results are stored in this array in order for later comparison
// similarly to run test cases, all the test cases provided are ran in a docker container with the code provided by the user
app.post('/submit', async (req, res) => {
    const { username, code, testCases, roomId } = req.body;

    const tempDir = path.resolve(__dirname, 'temp').replace(/\\/g, '/');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

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



// once both of the users submit their code and the timer runs out, this is called in order to compare the submissions
// first the number is test cases is compare and then if it is a tie, the execution time is looked at.
app.post('/compare', (req, res) => {
    const { roomId } = req.body;
  
    const roomSubmissions = submissions.filter((sub) => sub.roomId === roomId);
  
    if (roomSubmissions.length < 2) {
      return res.status(400).send({ message: "Not enough submissions to compare" });
    }
  
    console.log("Submissions for room:", roomSubmissions);
  
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
  // this is the results message that is returned to the frontend and communicates who the winner is
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
