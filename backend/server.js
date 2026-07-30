const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const registerChatSocket = require('./sockets/chatSocket');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    // Attach Socket.IO
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    registerChatSocket(io);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    return server;

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };