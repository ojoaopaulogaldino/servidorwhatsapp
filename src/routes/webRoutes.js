// src/routes/webRoutes.js
const express = require('express');
const path = require('path');

module.exports = (app) => {
  const router = express.Router();

  // Rota para servir o arquivo index.html
  router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });

  // Rota para servir arquivos estáticos (CSS, JS, imagens)
  router.use(express.static(path.join(__dirname, '../../public')));

  // Adicione outras rotas do frontend aqui, se necessário

  app.use('/', router);
};