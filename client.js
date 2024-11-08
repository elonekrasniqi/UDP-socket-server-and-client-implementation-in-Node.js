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



// Initial connection to server
console.log(`Connecting to server at ${SERVER_IP}:${SERVER_PORT}...`);
sendMessage('connect');