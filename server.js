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

function executeFile(file) {
    const filePath = path.join(currentDirectory, file);
    if (fs.existsSync(filePath)) {
        const exec = require('child_process').exec;
        exec(`node ${filePath}`, (error, stdout, stderr) => {
            if (error) return `Error executing file: ${stderr}`;
            return stdout;
        });
    }
    return `File ${file} does not exist.`;
}


//Funksioni per me i fshi fajllat
function clearFile(file) {
    if (!file) return "Error: File name not specified for 'clear' command.";
    const filePath = path.join(currentDirectory, file);
    try {
        fs.writeFileSync(filePath, '');
        return `Content of '${file}' cleared successfully.`;
    } catch (err) {
        return `Error clearing file '${file}': ${err.message}`;
    }
}

//Funksioni per me i listu fajllat
function listFiles() {
    try {
        const files = fs.readdirSync(currentDirectory);
        return `Files in directory ${currentDirectory}:\n${files.join('\n')}`;
    } catch (err) {
        return `Error listing files: ${err.message}`;
    }
}

//Funksioni per me kriju Folder
function makeDirectory(dirname) {
    if (!dirname) return "Error: Directory name not specified for 'mkdir' command.";
    const dirPath = path.join(currentDirectory, dirname);
    try {
        fs.mkdirSync(dirPath);
        return `Directory '${dirname}' created successfully.`;
    } catch (err) {
        return `Error creating directory '${dirname}': ${err.message}`;
    }
}

//Funksioni per me ndrru pathin ku jemi te Folderit, pra me dal nga nje folder ne tjetrin folder qe eshte krijuar paraprakisht

function changeDirectory(dirname) {
    if (!dirname) return "Error: Directory name not specified for 'cd' command.";
    const newDir = path.resolve(currentDirectory, dirname);
    if (fs.existsSync(newDir) && fs.lstatSync(newDir).isDirectory()) {
        currentDirectory = newDir;
        return `Current directory changed to: ${currentDirectory}`;
    } else {
        return `Directory '${dirname}' does not exist.`;
    }
}

//Funksioni per ta fshire nje folder
function deleteDirectory(dirname) {
    if (!dirname) return "Error: Directory name not specified for 'rmdir' command.";
    const dirPath = path.join(currentDirectory, dirname);
    try {
        fs.rmdirSync(dirPath, { recursive: true });
        return `Directory '${dirname}' deleted successfully.`;
    } catch (err) {
        return `Error deleting directory '${dirname}': ${err.message}`;
    }
}


// Function to handle client requests
server.on('message', async (msg, clientAddress) => {
    const message = msg.toString().trim();
    console.log(`Received message from ${clientAddress.address}:${clientAddress.port} - ${message}`);

    if (message === 'connect') {
        if (!clients.some(client => client.address === clientAddress.address && client.port === clientAddress.port)) {
            clients.push(clientAddress);
            clientPrivileges[`${clientAddress.address}:${clientAddress.port}`] = clientAddress.address === ADMIN_IP ? 'full' : 'read-only';

            console.log(`New client connected: ${clientAddress.address}:${clientAddress.port}`);
            const privilegeMsg = clientAddress.address === ADMIN_IP ?
                "Connection successful. You have admin privileges with full access." :
                "Connection successful. You have read-only access.";
            server.send(privilegeMsg, clientAddress.port, clientAddress.address);
        }
        return;
    }

    const privilege = clientPrivileges[`${clientAddress.address}:${clientAddress.port}`];
    const commandParts = message.split(' ');
    let response = '';

    if (message.startsWith("chat")) {
        const chatMessage = message.slice(5).trim();
        if (chatMessage.toLowerCase() === 'exit') {
            console.log(`Client ${clientAddress.address}:${clientAddress.port} left the chat.`);
            broadcastMessage(`Client ${clientAddress.address}:${clientAddress.port} has left the chat.`);
        } else {
            console.log(`Broadcasting chat message: ${chatMessage}`);
            broadcastMessage(`Client ${clientAddress.address}:${clientAddress.port} says: ${chatMessage}`, clientAddress);
        }
    } else {
        if (privilege === 'full') {
            switch (commandParts[0]) {
                case 'add':
                    response = addFile(commandParts[1]);
                    break;
                case 'remove':
                    response = removeFile(commandParts[1]);
                    break;
                case 'execute':
                    response = await executeFile(commandParts[1]);
                    break;
                case 'edit':
                    response = editFile(commandParts[1], commandParts.slice(2).join(' '));
                    break;
                case 'clear':
                    response = clearFile(commandParts[1]);
                    break;
                case 'ls':
                    response = listFiles();
                    break;
                case 'read':
                    response = readFile(commandParts[1]);
                    break;
                case 'mkdir':
                    response = makeDirectory(commandParts[1]);
                    break;
                case 'cd':
                    response = changeDirectory(commandParts[1]);
                    break;
                case 'rmdir':
                    response = deleteDirectory(commandParts[1]);
                    break;
                default:
                    response = 'Invalid command.';
            }
        } else {
            if (commandParts[0] === 'ls' || commandParts[0] === 'read') {
                response = commandParts[0] === 'ls' ? listFiles() : readFile(commandParts[1]);
            } else {

                response = 'You are not authorized to perform this action.';
                
            }
        }


        server.send(response + "\nEnter your command: ", clientAddress.port, clientAddress.address);

    }
});

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
