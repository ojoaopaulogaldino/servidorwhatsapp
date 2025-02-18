// const fs = require('fs');
// const path = require('path');

// // Estrutura de pastas
// const folders = [
//   'src/config',
//   'src/controllers',
//   'src/routes',
//   'src/services',
//   'src/utils',
//   'src/sockets'
// ];

// // Função para criar pastas
// function createFolders() {
//   folders.forEach(folder => {
//     const dir = path.join(__dirname, folder);
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//       console.log(`Pasta criada: ${dir}`);
//     } else {
//       console.log(`Pasta já existe: ${dir}`);
//     }
//   });
// }

// createFolders();



const fs = require('fs');
const path = require('path');

// Estrutura de arquivos
const files = [
  { path: 'src/config/server.js', content: `const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(express.static('public'));

module.exports = httpServer;` },

  { path: 'src/controllers/messageController.js', content: `const { saveDB, db } = require('../utils/database');
const { scheduleMessage } = require('../utils/scheduler');

function createMessage(req, res, io) {
  const message = {
    id: require('uuid').v4(),
    ...req.body,
    media: req.file ? \`/uploads/\${req.file.filename}\` : null
  };

  db.messages.push(message);
  saveDB();
  scheduleMessage(message, io);

  io.emit('update-messages', db.messages);
  res.sendStatus(201);
}

module.exports = { createMessage };` },

  { path: 'src/routes/apiRoutes.js', content: `const express = require('express');
const { createMessage } = require('../controllers/messageController');
const upload = require('../../config/multer');

module.exports = (app) => {
  const router = express.Router();

  router.post('/messages', upload.single('media'), (req, res) => {
    createMessage(req, res, app.get('io'));
  });

  app.use('/api', router);
};` },

  { path: 'src/services/whatsappService.js', content: `const { useMultiFileAuthState, makeWASocket } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');

let sock = null;
let connectionStatus = false;

async function startConnection(io) {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      markOnlineOnConnect: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, qr } = update;
      
      if (qr) {
        qrcode.toDataURL(qr).then(url => {
          io.emit('qr', url);
        });
      }

      if (connection === 'open') {
        connectionStatus = true;
        io.emit('connection-status', true);
      }
    });

    return sock;
  } catch (error) {
    console.error('Erro na conexão:', error);
    throw error;
  }
}

module.exports = { startConnection, sock, connectionStatus };` },

  { path: 'src/utils/database.js', content: `const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../db.json');
let db = { messages: [], history: [], groups: [] };

if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

module.exports = { saveDB, db };` },

  { path: 'src/sockets/whatsappSocket.js', content: `const { startConnection } = require('../services/whatsappService');

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
};` }
];

// Função para criar arquivos
function createFiles() {
  files.forEach(file => {
    const filePath = path.join(__dirname, file.path);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, file.content);
      console.log(`Arquivo criado: ${filePath}`);
    } else {
      console.log(`Arquivo já existe: ${filePath}`);
    }
  });
}

createFiles();