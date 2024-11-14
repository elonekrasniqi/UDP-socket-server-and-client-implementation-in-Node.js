const dgram = require('dgram');
const readline = require('readline');
const crypto = require('crypto');

const SERVER_IP = '192.168.104.99';
const SERVER_PORT = 3500;

const client = dgram.createSocket('udp4');
let inChatMode = false;
let waitingForResponse = false;
let hasRequestedPrivileges = false;
let isAdmin = false; // Ndjek statusin admin për klientin

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Çelësi dhe IV për enkriptimin dhe dekriptimin (duhet të jetë i njëjtë si te serveri për testim)
const encryptionKey = Buffer.from('12345678901234567890123456789012', 'utf8'); // 32 bytes për AES-256
const iv = Buffer.from('1234567890123456', 'utf8'); // 16 bytes për IV

// Funksioni për enkriptimin e mesazhit
function encryptMessage(message) {
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Funksioni për dekriptimin e mesazhit
function decryptMessage(encryptedMessage) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Funksioni për chat mes klientëve (me enkriptim AES)
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

// Handler për marrjen e mesazheve nga serveri
// Handler për marrjen e mesazheve nga serveri
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
            isAdmin = true; // Vendos klientin si admin nëse serveri e aprovon
            waitingForResponse = false;
            showMenuAfterPrivilegeRequest(); // Thirr menynë pa opsionin 4
        } else if (message.includes("Your admin privileges request has been denied")) {
            waitingForResponse = false;
            console.log("Admin privileges request was denied.");
            showMenu(); // Thirr menynë me të gjitha opsionet për të rifilluar rrjedhën
        } else if (!inChatMode && !waitingForResponse) {
            setImmediate(() => showMenu());
        }
    }
});


// Trajtimi i gabimeve nga klienti
client.on('error', (err) => {
    console.log(`Client error: ${err.message}`);
    client.close();
    process.exit();
});

// Mbyllja e lidhjes
client.on('close', () => {
    console.log("Disconnected from the server.");
    process.exit();
});

// Funksioni për dërgimin e mesazheve te serveri
function sendMessage(message) {
    client.send(message, SERVER_PORT, SERVER_IP, (err) => {
        if (err) {
            console.log('Failed to send message:', err.message);
        }
    });
}

// Funksioni për të shfaqur menynë kryesore
function showMenu() {
    if (!inChatMode && !waitingForResponse) {
        console.log("\n1. Send a message to the server");
        console.log("2. Send a message to the chat with other clients");
        console.log("3. Send a command to the server");
        if (!isAdmin) console.log("4. Request admin privileges"); // Shfaq opsionin 4 vetëm nëse nuk është admin

        rl.question(`Choose an option${isAdmin ? ' (1, 2, or 3): ' : ' (1, 2, 3, or 4): '}`, (choice) => {
            if (choice === '1') {
                chatWithServer();
            } else if (choice === '2') {
                chatWithClients();
            } else if (choice === '3') {
                enterCommand();
            } else if (choice === '4' && !hasRequestedPrivileges && !isAdmin) {
                requestAdminPrivileges();
            } else {
                console.log("Invalid choice. Please enter a valid option.");
                showMenu();
            }
        });
    }
}

// Funksioni për chat me serverin
function chatWithServer() {
    inChatMode = true;
    console.log("You are now in chat mode with the server. Type 'EXIT' to leave chat.");

    rl.on('line', (input) => {
        if (input.toLowerCase() === 'exit') {
            inChatMode = false;
            sendMessage(`chat_exit ${client.address().address}`);
            console.log("You have left the chat.");
            rl.removeAllListeners('line');
            showMenu();
        } else {
            sendMessage(`chat ${client.address().address}: ${input}`);
        }
    });
}

// Funksioni për dërgimin e komandave te serveri
function enterCommand() {
    rl.question("Enter your command: ", (cmd) => {
        const commandParts = cmd.trim().split(' ');
        const mainCommand = commandParts[0];

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

// Funksioni për kërkimin e privilegjeve admin
function requestAdminPrivileges() {
    sendMessage('request_admin');
    console.log("Admin privilege request sent. Waiting for server response...");
    waitingForResponse = true;
    hasRequestedPrivileges = true;
}

// Funksioni për të shfaqur menynë pas kërkesës për privilegje admin
function showMenuAfterPrivilegeRequest() {
    console.log("\nAdmin privileges granted. You now have full access.");
    console.log("\n1. Send a message to the server");
    console.log("2. Send a message to the chat with other clients");
    console.log("3. Send a command to the server");
    
    rl.question("Choose an option (1, 2, or 3): ", (choice) => {
        if (choice === '1') {
            chatWithServer();
        } else if (choice === '2') {
            chatWithClients();
        } else if (choice === '3') {
            enterCommand();
        } else {
            console.log("Invalid choice. Please enter a valid option.");
            showMenuAfterPrivilegeRequest();
        }
    });
}

// Lidhja fillestare me serverin
console.log(`Connecting to server at ${SERVER_IP}:${SERVER_PORT}...`);
sendMessage('connect');
