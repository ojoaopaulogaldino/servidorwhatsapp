// src/config/server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
app.set('io', io);

// Configurações básicas
app.use(express.json());
app.use(express.static('public'));

// Rotas
require('../routes/apiRoutes')(app);
require('../routes/webRoutes')(app); // Adicionado aqui

// Sockets
require('../sockets/whatsappSocket')(io);

module.exports = httpServer;