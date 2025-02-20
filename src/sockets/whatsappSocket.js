// // src/sockets/whatsappSocket.js
// const { startConnection, sock } = require('../services/whatsappService');

// module.exports = (io) => {
//   io.on('connection', (socket) => {
//     console.log('Novo cliente conectado:', socket.id);

//     socket.on('connect-whatsapp', async () => {
//       try {
//         await startConnection(io);
//         console.log('Conexão WhatsApp iniciada com sucesso');
//       } catch (error) {
//         console.error('Erro ao iniciar conexão WhatsApp:', error);
//         socket.emit('connection-error', error.message);
//       }
//     });
//   });
// };
// src/sockets/whatsappSocket.js
const { startConnection, listarGrupos } = require('../services/whatsappService');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);

    // Inicia a conexão com o WhatsApp
    socket.on('connect-whatsapp', async () => {
      try {
        await startConnection(io);
        console.log('Conexão WhatsApp iniciada com sucesso');
      } catch (error) {
        console.error('Erro ao iniciar conexão WhatsApp:', error);
        socket.emit('connection-error', error.message);
      }
    });

    // Envia a lista de grupos para o frontend
    socket.on('request-groups', async () => {
      try {
        const grupos = await listarGrupos();
        socket.emit('update-groups', grupos);
      } catch (error) {
        console.error('Erro ao enviar grupos:', error);
        socket.emit('connection-error', error.message);
      }
    });
  });
};