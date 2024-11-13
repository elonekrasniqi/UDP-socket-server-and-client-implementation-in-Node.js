const dgram = require('dgram');
const readline = require('readline');
const crypto = require('crypto');

const SERVER_IP = '127.0.0.1';
const SERVER_PORT = 3500;

const client = dgram.createSocket('udp4');
let inChatMode = false;
let waitingForResponse = false;
let hasRequestedPrivileges = false;
let isAdmin = false;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const encryptionKey = Buffer.from('12345678901234567890123456789012', 'utf8'); 
const iv = Buffer.from('1234567890123456', 'utf8');

function encryptMessage(message) {
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decryptMessage(encryptedMessage) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function chatWithClients() {
    console.log("You are now in chat with other clients. Type 'EXIT' to leave.");

    rl.on('line', (input) => {
        if (input.toLowerCase() === 'exit') {
            inChatMode = false;
            console.log("Exiting chat with clients.");
            rl.removeAllListeners('line');
            showMenu();
        } else {
            const encryptedMessage = encryptMessage(input);
            sendMessage(`chat_clients ${encryptedMessage}`);
        }
    });
}

client.on('message', (msg) => {
    const message = msg.toString().trim();
    if (message.startsWith('chat_clients')) {
        const encryptedContent = message.split(' ')[1];
        try {
            const decryptedMessage = decryptMessage(encryptedContent);
            console.log(`Client message (decrypted): ${decryptedMessage}`);
        } catch (error) {
            console.log("Failed to decrypt message:", error.message);
        }
    } else {
        console.log(`\nServer: ${message}`);
        if (message.includes("Your admin privileges have been approved")) {
            isAdmin = true;
            waitingForResponse = false;
            showMenuAfterPrivilegeRequest();
        } else if (message.includes("Your admin privileges request has been denied")) {
            waitingForResponse = false;
            console.log("Admin privileges request was denied.");
            showMenu();
        } else if (!inChatMode && !waitingForResponse) {
            setImmediate(() => showMenu());
        }
    }
});

client.on('error', (err) => {
    console.log(`Client error: ${err.message}`);
    client.close();
    process.exit();
});

client.on('close', () => {
    console.log("Disconnected from the server.");
    process.exit();
});