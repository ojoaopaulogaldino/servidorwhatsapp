const { startConnection, sock } = require('../services/whatsappService');

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('connect-whatsapp', async () => {
      try {
        await startConnection(io);
      } catch (error) {
        socket.emit('connection-error', error.message);
      }
    });
  });
};