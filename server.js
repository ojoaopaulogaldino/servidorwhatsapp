// const express = require('express');
// const { createServer } = require('http');
// const { Server } = require('socket.io');
// const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
// const qrcode = require('qrcode');
// const fs = require('fs');
// const path = require('path');
// const multer = require('multer');
// const moment = require('moment-timezone');
// const mime = require('mime-types'); // Para detectar o tipo MIME do arquivo

// const app = express();
// const server = createServer(app);
// const io = new Server(server, { cors: { origin: '*' } });

// // Configuração do Multer para salvar arquivos com extensão
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname); // Pega a extensão do arquivo
//     cb(null, `${Date.now()}${ext}`); // Salva com timestamp + extensão
//   }
// });

// const upload = multer({ storage });
// let sock = null;
// let isConnected = false;

// // Configuração do Banco de Dados
// const DB_FILE = 'db.json';
// if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ messages: [], history: [] }));

// // Funções do Banco de Dados
// const readDB = () => JSON.parse(fs.readFileSync(DB_FILE));
// const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// // Conexão WhatsApp
// async function connectToWhatsApp() {
//   if (isConnected) {
//     console.log('[WHATSAPP] Já conectado. Ignorando nova conexão.');
//     return;
//   }

//   console.log('[WHATSAPP] Iniciando conexão...');
//   const { state, saveCreds } = await useMultiFileAuthState('auth_info');

//   sock = makeWASocket({
//     printQRInTerminal: true,
//     auth: state,
//     browser: ['WhatsAuto', 'Chrome', '1.0']
//   });

//   sock.ev.on('connection.update', async (update) => {
//     console.log('[WHATSAPP] Status conexão:', update.connection);

//     if (update.qr) {
//       console.log('[WHATSAPP] QR Code gerado');
//       const qr = await qrcode.toDataURL(update.qr);
//       io.emit('qr', qr); // Envia QR Code para o frontend
//       io.emit('log', 'Escaneie o QR Code pelo WhatsApp > Dispositivos conectados');
//     }

//     if (update.connection === 'open') {
//       console.log('[WHATSAPP] Conexão estabelecida');
//       isConnected = true;
//       io.emit('connection-status', true);
//       io.emit('log', '✅ Conectado com sucesso!');
//       await saveCreds();
//     }

//     if (update.connection === 'close') {
//       console.log('[WHATSAPP] Conexão fechada');
//       isConnected = false;
//       io.emit('connection-status', false);
//       io.emit('log', '❌ Conexão perdida. Reinicie a conexão');
//     }
//   });

//   sock.ev.on('creds.update', saveCreds);
// }

// // Função para enviar mensagens com mídia
// async function sendMessageWithMedia(recipient, content, mediaPath) {
//   if (mediaPath) {
//     const media = fs.readFileSync(path.join(__dirname, mediaPath));
//     const mimeType = mime.lookup(mediaPath); // Detecta o tipo MIME do arquivo
//     await sock.sendMessage(recipient, {
//       [mimeType.split('/')[0]]: media, // Usa 'image', 'video', etc.
//       caption: content
//     });
//   } else {
//     await sock.sendMessage(recipient, { text: content });
//   }
// }

// // Verificador de Mensagens Pendentes
// setInterval(async () => {
//   if (!sock || !isConnected) {
//     console.log('[SCHEDULER] Socket não disponível ou não conectado');
//     return;
//   }

//   console.log('\n[SCHEDULER] Verificando mensagens...');
//   const db = readDB();
//   const now = moment().tz('America/Sao_Paulo').toDate();
//   console.log('[SCHEDULER] Hora atual:', now.toLocaleString());

//   for (const msg of db.messages) {
//     const [hours, minutes] = msg.time.split(':');
//     const scheduledTime = moment().tz('America/Sao_Paulo').set({ hours, minutes, seconds: 0 }).toDate();
    
//     console.log('\n[MENSAGEM] Analisando:', {
//       id: msg.id,
//       title: msg.title,
//       scheduled: scheduledTime.toLocaleString(),
//       now: now.toLocaleString(),
//       daily: msg.daily,
//       sent: msg.sent
//     });

//     if (
//       (msg.daily && scheduledTime.getHours() === now.getHours() && scheduledTime.getMinutes() === now.getMinutes()) ||
//       (!msg.daily && scheduledTime <= now && !msg.sent)
//     ) {
//       try {
//         await sendMessageWithMedia(msg.recipient, msg.content, msg.media);
//         console.log('[MENSAGEM] Mensagem enviada com sucesso');

//         // Atualizar banco de dados
//         msg.sent = true;
//         db.history.push({ 
//           ...msg, 
//           sentAt: new Date(),
//           recipient: msg.recipient
//         });
        
//         writeDB(db);
//         io.emit('update-messages', db.messages);
//         io.emit('update-history', db.history);
//         console.log('[MENSAGEM] Atualizado no histórico');
//       } catch (error) {
//         console.error('[ERRO] Falha ao enviar mensagem:', error);
//       }
//     }
//   }
// }, 60000); // Verifica a cada 1 minuto

// // Rotas
// app.post('/api/connect', (req, res) => {
//   connectToWhatsApp();
//   res.status(200).send('Iniciando conexão...');
// });

// app.post('/api/messages', upload.single('media'), (req, res) => {
//   const db = readDB();
//   const recipientType = req.body.recipientType;
//   const recipient = req.body.recipient;

//   const newMessage = {
//     id: Date.now(),
//     title: req.body.title,
//     content: req.body.content,
//     time: req.body.time,
//     daily: req.body.daily === 'true',
//     recipient: recipientType === 'group' ? recipient : `${recipient}@s.whatsapp.net`,
//     media: req.file ? `/uploads/${req.file.filename}` : null, // Já inclui a extensão
//     sent: false
//   };

//   db.messages.push(newMessage);
//   writeDB(db);
  
//   io.emit('update-messages', db.messages);
//   res.status(201).json(newMessage);
// });

// // Rota para listar grupos
// app.get('/api/groups', async (req, res) => {
//   if (!sock || !isConnected) {
//     return res.status(400).json({ error: 'Não conectado ao WhatsApp' });
//   }

//   try {
//     const groups = await sock.groupFetchAllParticipating();
//     const groupList = Object.values(groups).map(group => ({
//       id: group.id,
//       name: group.subject
//     }));
//     res.json(groupList);
//   } catch (error) {
//     res.status(500).json({ error: 'Falha ao carregar grupos' });
//   }
// });

// // Arquivos estáticos
// app.use(express.static(path.join(__dirname, 'public')));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Socket.io
// io.on('connection', (socket) => {
//   console.log('[SOCKET] Novo cliente conectado:', socket.id);
//   socket.emit('update-messages', readDB().messages);
//   socket.emit('update-history', readDB().history);
// });

// server.listen(3000, () => {
//   console.log('Servidor rodando em http://localhost:3000');
// });

// server.js
const app = require('./src/config/server');
const PORT = process.env.PORT || 3000;

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});