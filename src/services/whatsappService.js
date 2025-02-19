// src/services/whatsappService.js
const { useMultiFileAuthState, makeWASocket } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');

let sock = null;
let connectionStatus = false;

async function startConnection(io) {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth');

    const connect = async () => {
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
          setTimeout(() => connect(), 5000); // Reconectar após 5 segundos
        }
      });

      sock.ev.on('messages.upsert', (data) => {
        console.log('Nova mensagem recebida:', data);
      });

      sock.ev.on('connection.error', (error) => {
        console.error('Erro de conexão:', error);
        setTimeout(() => connect(), 5000); // Reconectar após 5 segundos
      });
    };

    await connect();
    return sock;
  } catch (error) {
    console.error('Erro na conexão:', error);
    throw error;
  }
}

module.exports = { startConnection, sock, connectionStatus };