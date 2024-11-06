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