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


function editFile(file, text) {
    const filePath = path.join(currentDirectory, file);
    try {
        fs.appendFileSync(filePath, `\n${text}`);
        return `Text added to '${file}' successfully.`;
    } catch (err) {
        return `Error editing file '${file}': ${err.message}`;
    }
}

function clearFile(file) {
    const filePath = path.join(currentDirectory, file);
    try {
        fs.writeFileSync(filePath, '');
        return `Content of '${file}' cleared successfully.`;
    } catch (err) {
        return `Error clearing file '${file}': ${err.message}`;
    }
}

function listFiles() {
    try {
        const files = fs.readdirSync(currentDirectory);
        return `Files in directory ${currentDirectory}:\n${files.join('\n')}`;
    } catch (err) {
        return `Error listing files: ${err.message}`;
    }
}

function makeDirectory(dirname) {
    const dirPath = path.join(currentDirectory, dirname);
    try {
        fs.mkdirSync(dirPath);
        return `Directory '${dirname}' created successfully.`;
    } catch (err) {
        return `Error creating directory '${dirname}': ${err.message}`;
    }
}

function changeDirectory(dirname) {
    const targetDirectory = path.resolve(currentDirectory, dirname);
    if (targetDirectory.startsWith(BASE_DIRECTORY)) {
        if (fs.existsSync(targetDirectory) && fs.lstatSync(targetDirectory).isDirectory()) {
            currentDirectory = targetDirectory;
            return `Current directory changed to: ${currentDirectory}`;
        } else {
            return `Directory '${dirname}' does not exist.`;
        }
    } else {
        return "Access denied. Cannot navigate outside the base directory.";
    }
}

function deleteDirectory(dirname) {
    const dirPath = path.join(currentDirectory, dirname);
    try {
        fs.rmdirSync(dirPath, { recursive: true });
        return `Directory '${dirname}' deleted successfully.`;
    } catch (err) {
        return `Error deleting directory '${dirname}': ${err.message}`;
    }
}


// Trajtimi i mesazheve nga klientët
server.on('message', async (msg, clientAddress) => {
    const message = msg.toString().trim();
    const clientKey = `${clientAddress.address}:${clientAddress.port}`;

    console.log(`Received message from ${clientAddress.address}:${clientAddress.port} - ${message}`);

    // Kontrollo nëse mesazhi është enkriptim për klientët e tjerë
    if (message.startsWith('chat_clients')) {
        const encryptedContent = message.split(' ')[1];
        broadcastToClientsOnly(encryptedContent, clientAddress);
        return;
    }
