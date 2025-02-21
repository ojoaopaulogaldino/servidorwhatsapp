// // src/services/whatsappService.js
// const { useMultiFileAuthState, makeWASocket } = require('@whiskeysockets/baileys');
// const qrcode = require('qrcode');

// let sock = null;
// let connectionStatus = false;

// async function startConnection(io) {
//   try {
//     const { state, saveCreds } = await useMultiFileAuthState('auth');

//     sock = makeWASocket({
//       auth: state,
//       printQRInTerminal: true,
//       markOnlineOnConnect: false,
//     });

//     sock.ev.on('creds.update', saveCreds);

//     sock.ev.on('connection.update', (update) => {
//       const { connection, qr } = update;

//       if (qr) {
//         qrcode.toDataURL(qr).then((url) => {
//           io.emit('qr', url);
//         });
//       }

//       if (connection === 'open') {
//         connectionStatus = true;
//         io.emit('connection-status', true);
//       } else if (connection === 'close') {
//         connectionStatus = false;
//         io.emit('connection-status', false);
//       }
//     });

//     return sock;
//   } catch (error) {
//     console.error('Erro na conexão:', error);
//     throw error;
//   }
// }

// module.exports = { startConnection, sock, connectionStatus };
// src/services/whatsappService.js
const { useMultiFileAuthState, makeWASocket } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');

let sock = null;
let connectionStatus = false;

async function startConnection(io) {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth');

    // whatsappService.js
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      markOnlineOnConnect: false,
      browser: ["Chrome (Linux)", "", ""], // Força um user-agent específico
      connectTimeoutMs: 60000, // Aumenta o timeout de conexão
      keepAliveIntervalMs: 30000 // Mantém a conexão ativa
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, qr } = update;

      if (qr) {
        qrcode.toDataURL(qr).then((url) => {
          io.emit('qr', url);
        });
      }

      if (connection === 'open') {
        connectionStatus = true;
        io.emit('connection-status', true);

        // Lista os grupos e envia para o frontend
        listarGrupos(io);
      }

      if (connection === 'close') {
        connectionStatus = false;
        io.emit('connection-status', false);
      }
      if (update.connection === 'close') {
        console.log('Reconectando...');
        startConnection(io); // Reconecta automaticamente
      }
    });

    return sock;
  } catch (error) {
    console.error('Erro na conexão:', error);
    throw error;
  }
}

// Função para listar grupos
async function listarGrupos(io) {
  try {
    if (!sock) {
      throw new Error('Conexão WhatsApp não inicializada');
    }

    // Obtém todos os grupos dos quais o usuário participa
    const grupos = await sock.groupFetchAllParticipating();

    // Formata os grupos para o frontend
    const formattedGroups = Object.values(grupos).map((grupo) => ({
      id: grupo.id,
      name: grupo.subject || 'Grupo sem nome',
    }));

    // Envia os grupos para o frontend
    io.emit('update-groups', formattedGroups);
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
    io.emit('log', `Erro ao listar grupos: ${error.message}`);
  }
}

// Exporta o objeto sock para ser usado em outros módulos
function getSock() {
  return sock;
}

module.exports = { startConnection, getSock, connectionStatus, listarGrupos };