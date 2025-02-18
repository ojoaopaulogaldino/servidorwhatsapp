const { saveDB, db } = require('../utils/database');
const { scheduleMessage } = require('../utils/scheduler'); // Importação corrigida

function createMessage(req, res, io) {
  const message = {
    id: require('uuid').v4(),
    ...req.body,
    media: req.file ? `/uploads/${req.file.filename}` : null,
    nextSend: new Date().toISOString() // Adicione esta linha para definir o próximo envio
  };

  db.messages.push(message);
  saveDB();
  scheduleMessage(message, io); // Agendamento

  io.emit('update-messages', db.messages);
  res.sendStatus(201);
}

module.exports = { createMessage };