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
    // Carrega o estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState('auth');

    // Cria a conexão com o WhatsApp
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      markOnlineOnConnect: false,
    });

    // Salva as credenciais quando necessário
    sock.ev.on('creds.update', saveCreds);

    // Escuta atualizações de conexão
    sock.ev.on('connection.update', async (update) => {
      const { connection, qr } = update;

      // Exibe o QR Code para conexão
      if (qr) {
        const qrCodeUrl = await qrcode.toDataURL(qr);
        io.emit('qr', qrCodeUrl); // Envia o QR Code para o frontend
      }

      // Quando a conexão é estabelecida
      if (connection === 'open') {
        connectionStatus = true;
        io.emit('connection-status', true);

        // Lista os grupos e envia para o frontend
        const grupos = await listarGrupos();
        io.emit('update-groups', grupos);
      }

      // Verifica se a conexão foi fechada
      if (connection === 'close') {
        connectionStatus = false;
        io.emit('connection-status', false);
      }
    });

    return sock;
  } catch (error) {
    console.error('Erro na conexão:', error);
    throw error;
  }
}

// Função para listar grupos
async function listarGrupos() {
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

    return formattedGroups;
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
    throw error;
  }
}

module.exports = { startConnection, sock, connectionStatus, listarGrupos };