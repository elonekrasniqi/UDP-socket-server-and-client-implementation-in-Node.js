const dgram = require('dgram');
const readline = require('readline');

const SERVER_IP = '172.20.10.2';
const SERVER_PORT = 3500;

const client = dgram.createSocket('udp4');
let isConnected = false;
let inChatMode = false;

client.on('message', (msg) => {
    const message = msg.toString().trim();
    console.log(`\nServer: ${message}`);

    if (!inChatMode) {
        showMenu();
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function sendMessage(message) {
    client.send(message, SERVER_PORT, SERVER_IP, (err) => {
        if (err) {
            console.log('Failed to send message:', err.message);
        }
    });
}

function showMenu() {
    if (!inChatMode) {
        console.log("\n1. Send a message to the chat");
        console.log("2. Send a command to the server");
        rl.question("Choose an option (1 or 2): ", (choice) => {
            if (choice === '1') {
                inChatMode = true;
                chatMode();
            } else if (choice === '2') {
                enterCommand();
            } else {
                console.log("Invalid choice. Please enter 1 or 2.");
                showMenu();
            }
        });
    }
}
function chatMode() {
    console.log("You are now in chat mode. Type 'EXIT' to leave chat.");
    rl.on('line', (input) => {
        if (input.toLowerCase() === 'exit') {
            inChatMode = false;
            sendMessage('chat exit');
            console.log("You have left the chat.");
            rl.removeAllListeners('line');
            showMenu();
        } else {
            sendMessage(`chat ${input}`);
        }
    });
}

function enterCommand() {
    rl.question("Enter your command: ", (cmd) => {
        const commandParts = cmd.trim().split(' ');
        const mainCommand = commandParts[0];

        // Check if command requires an argument and show an error if missing
        if ((mainCommand === 'add' || mainCommand === 'remove' || mainCommand === 'execute' || 
             mainCommand === 'edit' || mainCommand === 'clear' || mainCommand === 'read' || 
             mainCommand === 'mkdir' || mainCommand === 'cd' || mainCommand === 'rmdir') && 
            !commandParts[1]) {
            console.log(`Error: Argument required for '${mainCommand}' command.`);
            showMenu();
        } else {
            sendMessage(cmd);
        }
    });
}

// Initial connection to server
console.log(`Connecting to server at ${SERVER_IP}:${SERVER_PORT}...`);
sendMessage('connect');