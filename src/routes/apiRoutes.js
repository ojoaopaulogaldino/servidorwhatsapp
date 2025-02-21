// src/routes/apiRoutes.js
const express = require('express');
const { getSock } = require('../services/whatsappService');
const { createMessage } = require('../controllers/messageController'); // Importação correta
const upload = require('../config/multer'); // Importa o módulo multer

module.exports = (app) => {
  const router = express.Router();

  // Rota para carregar grupos
  router.get('/groups', async (req, res) => {
    try {
      const sock = getSock(); // Obtém o objeto sock
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

      res.json(formattedGroups);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Rota para enviar mensagens
  router.post('/messages', upload.single('media'), (req, res) => {
    createMessage(req, res, app.get('io'));
  });

  // Rota para deletar mensagens
  router.delete('/messages/:id', (req, res) => {
    const { id } = req.params;
    db.messages = db.messages.filter(msg => msg.id !== id);
    saveDB();
    res.sendStatus(200);
  });

  app.use('/api', router);
};