// src/routes/apiRoutes.js
const express = require('express');
const { sock } = require('../services/whatsappService');

module.exports = (app) => {
  const router = express.Router();

  // Rota para carregar grupos
  router.get('/groups', async (req, res) => {
    try {
      // Verifica se a conexão com o WhatsApp está ativa
      if (!sock || !sock.user) {
        console.error('Erro: Conexão WhatsApp não inicializada');
        return res.status(400).json({ error: 'Conexão WhatsApp não inicializada' });
      }

      console.log('Buscando grupos...');
      const groups = await sock.groupFetchAllParticipating();
      console.log('Grupos encontrados:', groups);

      // Verifica se há grupos retornados
      if (!groups || Object.keys(groups).length === 0) {
        console.error('Erro: Nenhum grupo encontrado');
        return res.status(404).json({ error: 'Nenhum grupo encontrado' });
      }

      // Formata os grupos para o frontend
      const formattedGroups = Object.values(groups).map(group => ({
        id: group.id,
        name: group.subject || 'Grupo sem nome', // Caso o grupo não tenha um nome
      }));

      console.log('Grupos formatados:', formattedGroups);
      res.json(formattedGroups);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      res.status(500).json({ error: 'Erro ao carregar grupos' });
    }
  });

  app.use('/api', router);
};