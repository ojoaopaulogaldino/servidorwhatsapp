const { saveDB, db } = require('./database');
const { sock } = require('../services/whatsappService');

function scheduleMessage(message, io) {
  const nextSend = new Date(message.nextSend);
  const now = new Date();
  const timeout = nextSend - now;

  if (timeout > 0) {
    setTimeout(async () => {
      try {
        const content = {
          text: message.content
        };

        if (message.media) {
          const buffer = require('fs').readFileSync(require('path').join(__dirname, '../../', message.media));
          content.image = buffer;
          content.caption = message.content;
        }

        await sock.sendMessage(`${message.recipient}@s.whatsapp.net`, content);

        db.history.push({
          ...message,
          sentAt: new Date().toISOString()
        });

        if (!message.daily) {
          db.messages = db.messages.filter(m => m.id !== message.id);
        }

        saveDB();
        io.emit('update-history', db.history);
        io.emit('update-messages', db.messages);
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        io.emit('log', `Erro ao enviar: ${error.message}`);
      }
    }, timeout);

    if (message.daily) {
      setInterval(async () => {
        try {
          const content = {
            text: message.content
          };

          if (message.media) {
            const buffer = require('fs').readFileSync(require('path').join(__dirname, '../../', message.media));
            content.image = buffer;
            content.caption = message.content;
          }

          await sock.sendMessage(`${message.recipient}@s.whatsapp.net`, content);

          db.history.push({
            ...message,
            sentAt: new Date().toISOString()
          });

          saveDB();
          io.emit('update-history', db.history);
        } catch (error) {
          console.error('Erro ao enviar mensagem diária:', error);
          io.emit('log', `Erro ao enviar mensagem diária: ${error.message}`);
        }
      }, 86400000); // 24 horas
    }
  }
}

module.exports = { scheduleMessage };