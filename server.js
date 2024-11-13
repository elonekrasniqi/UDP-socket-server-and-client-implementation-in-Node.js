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



