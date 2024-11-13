const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const { exec } = require('child_process');

// Konfigurimet e serverit
const PORT = process.env.PORT || 3500;
const IP_ADDRESS = '127.0.0.1';
const BASE_DIRECTORY = path.join(__dirname, 'Files'); // Drejtoria kryesore "Files"

const server = dgram.createSocket('udp4');
let clients = [];
let clientPrivileges = {};
let clientModes = {};
let adminRequests = [];
let currentDirectory = BASE_DIRECTORY; // Drejtoria fillestare është "Files"

// Krijo drejtorinë kryesore "Files" nëse nuk ekziston
if (!fs.existsSync(BASE_DIRECTORY)) {
    fs.mkdirSync(BASE_DIRECTORY);
}

// Çelësi dhe IV për enkriptimin dhe dekriptimin (duhet të jetë i njëjtë si te klientët për testim)
const encryptionKey = Buffer.from('12345678901234567890123456789012', 'utf8'); // 32 bytes për AES-256
const iv = Buffer.from('1234567890123456', 'utf8'); // 16 bytes për IV

// Funksioni për transmetimin e mesazheve të enkriptuara vetëm te klientët
function broadcastToClientsOnly(encryptedMessage, senderAddress) {
    clients.forEach(client => {
        if (client.address !== senderAddress.address || client.port !== senderAddress.port) {
            server.send(`chat_clients ${encryptedMessage}`, client.port, client.address);
        }
    });
}

// Funksionet për operacionet me skedarë brenda drejtorisë kryesore
function addFile(file) {
    if (!file) return "Error: File name not specified for 'add' command.";
    const filePath = path.join(currentDirectory, file);
    try {
        fs.writeFileSync(filePath, '');
        return `File '${file}' created successfully in ${currentDirectory}.`;
    } catch (err) {
        return `Error creating file '${file}': ${err.message}`;
    }
}

function removeFile(file) {
    if (!file) return "Error: File name not specified for 'remove' command.";
    const filePath = path.join(currentDirectory, file);
    try {
        fs.unlinkSync(filePath);
        return `File '${file}' removed successfully.`;
    } catch (err) {
        return `Error removing file '${file}': ${err.message}`;
    }
}


function executeFile(file) {
    const filePath = path.join(currentDirectory, file);
    return new Promise((resolve) => {
        let command;
        if (file.endsWith('.py')) {
            command = `python ${filePath}`;
        } else if (file.endsWith('.js')) {
            command = `node ${filePath}`;
        } else {
            command = filePath;
        }
        exec(command, (error, stdout, stderr) => {
            if (error) {
                resolve(`Execution failed for '${file}'. Error: ${stderr}`);
            } else {
                resolve(`Execution of '${file}' successful. Output: ${stdout}`);
            }
        });
    });
}

function readFile(file) {
    const filePath = path.join(currentDirectory, file);
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return `Contents of '${file}':\n${data}`;
    } catch (err) {
        return `Error reading file '${file}': ${err.message}`;
    }
}
