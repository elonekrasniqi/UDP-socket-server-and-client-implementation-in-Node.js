const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3500;
const IP_ADDRESS = '192.168.234.99';
const ADMIN_IP = '192.168.234.99';

const server = dgram.createSocket('udp4');
let currentDirectory = path.resolve('.');
let clients = [];
let clientPrivileges = {};

// Function to broadcast messages to all clients
function broadcastMessage(message, senderAddress = null) {
    clients.forEach(client => {
        if (!senderAddress || (client.address !== senderAddress.address || client.port !== senderAddress.port)) {
            server.send(message, client.port, client.address, (err) => {
                if (err) console.log(`Failed to send message to ${client.address}:${client.port} - ${err.message}`);
            });
        }
    });
}


// Funksionet do vazhdojne ketu...

//Funksioni per me lexu fajllin 
function readFile(file) {
    if (!file) return "Error: File name not specified for 'read' command.";
    const filePath = path.join(currentDirectory, file);
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return `Contents of '${file}':\n${data}`;
    } catch (err) {
        return `Error reading file '${file}': ${err.message}`;
    }
}

//Funksioni per me editu fajllin
function editFile(file, text) {
    if (!file) return "Error: File name not specified for 'edit' command.";
    const filePath = path.join(currentDirectory, file);
    try {
        fs.appendFileSync(filePath, `\n${text}`);
        return `Text added to '${file}' successfully.`;
    } catch (err) {
        return `Error editing file '${file}': ${err.message}`;
    }
}


// Server chat interface to broadcast messages
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("Type a message to broadcast to all clients, or type 'exit' to close the server.");
rl.on('line', (input) => {
    if (input.trim().toLowerCase() === 'exit') {
        console.log("Server shutting down...");
        server.close();
        rl.close();
    } else {
        broadcastMessage(`Server says: ${input}`);
        console.log("Message broadcasted to all clients.");
    }
});

server.bind(PORT, IP_ADDRESS, () => {
    console.log(`Server listening on ${IP_ADDRESS}:${PORT}`);
});
