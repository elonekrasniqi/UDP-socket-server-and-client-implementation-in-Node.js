const dgram = require('dgram');
const readline = require('readline');

const SERVER_IP = '172.20.10.2';
const SERVER_PORT = 3500;

const client = dgram.createSocket('udp4');
let isConnected = false;
let inChatMode = false;