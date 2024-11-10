# UDP-socket-server-and-client-implementation-in-Node.js
This is a semester project developed by students at the University "Hasan Prishtina" - Faculty of Electrical and Computer Engineering, in the course "Computer Network" - Prof.Blerim Rexha and Msc.Mergim Hoti.

## Introduction
This project demonstrates a server-client system using UDP sockets. The server listens for client requests, processes incoming messages, and provides either full or restricted access to stored files.

## ⚙️ Main Features

### Server
- **Configuration**: Set the server's IP address and port number.
- **Listening to Clients**: Actively listens for incoming requests from group members.
- **Request Handling**: Accepts and processes client requests.
- **Message Processing**: Reads and processes messages sent by clients.
- **File Access**: Provides full access to one client while restricting access for others.

### Client
- **Socket Creation**: Establishes a UDP socket connection with the server.
- **Client Privileges**: One client has full privileges (read, write, execute), while others have read-only permissions.
- **Server Connection**: Specifies correct port and IP for a successful connection.
- **Message Sending**: Allows clients to send text messages to the server.
- **Response Handling**: Reads and processes responses from the server.
- **File Access**: The client with full privileges can access server file contents.

## 🚀 How to Use
1. **Set Server IP & Port**: Ensure the server's IP address and port number are correctly configured.
2. **Run the Server**: Start the server and wait for client connections.
   ```bash
   node server.js
3. **Start Client(s):** Run the client script to send requests to the server.
   ```bash
   node client.js

### Contributors:
- [Elma Shabani](https://github.com/ElmaShabani)
- [Elion Mehaj](https://github.com/elionmehaj)
- [Elonë Krasniqi](https://github.com/elonekrasniqi)
- [Elton Pajaziti](https://github.com/EltonPajaziti)
