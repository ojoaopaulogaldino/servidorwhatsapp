// src/services/whatsappService.js
const { useMultiFileAuthState, makeWASocket } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');

let sock = null;
let connectionStatus = false;

async function startConnection(io) {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth');

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      markOnlineOnConnect: false,
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
      } else if (connection === 'close') {
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

module.exports = { startConnection, sock, connectionStatus };