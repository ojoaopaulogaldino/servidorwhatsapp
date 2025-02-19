// src/controllers/messageController.js
const { saveDB, db } = require('../utils/database');
const { scheduleMessage } = require('../utils/scheduler');
const { sock } = require('../services/whatsappService');

function createMessage(req, res, io) {
  const { recipientType, group, ddi, contact, content } = req.body;
  const recipient = recipientType === 'group' ? group : `${ddi}${contact}`;

  const message = {
    id: require('uuid').v4(),
    recipient,
    recipientType,
    content,
    media: req.file ? `/uploads/${req.file.filename}` : null,
    nextSend: new Date().toISOString(),
  };

  db.messages.push(message);
  saveDB();
  scheduleMessage(message, io);

  io.emit('update-messages', db.messages);
  res.sendStatus(201);
}

module.exports = { createMessage };