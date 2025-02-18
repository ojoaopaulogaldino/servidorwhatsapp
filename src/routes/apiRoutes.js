// src/routes/apiRoutes.js
const express = require('express');
const { createMessage } = require('../controllers/messageController');
const upload = require('../config/multer'); // Caminho corrigido

module.exports = (app) => {
  const router = express.Router();

  router.post('/messages', upload.single('media'), (req, res) => {
    createMessage(req, res, app.get('io'));
  });

  app.use('/api', router);
};