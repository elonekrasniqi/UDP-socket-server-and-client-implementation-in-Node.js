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
