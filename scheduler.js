const { CronJob } = require('cron');
const fs = require('fs');
const path = require('path');
const { scheduledMessages, history } = require('./server');

// Verifica mensagens agendadas
function checkScheduledMessages() {
  const now = new Date();
  scheduledMessages.forEach((msg, index) => {
    const scheduledTime = new Date(msg.datetime);

    if (scheduledTime <= now && msg.status === 'Agendado') {
      sendMessage(msg);
      if (!msg.daily) {
        msg.status = 'Enviado';
      } else {
        // Reagenda para o próximo dia
        msg.datetime = new Date(scheduledTime.setDate(scheduledTime.getDate() + 1)).toISOString();
      }
    }
  });
}

// Envia a mensagem
async function sendMessage(msg) {
  try {
    const { content, media, datetime } = msg;
    const to = '5511999999999@c.us'; // Substitua pelo número desejado

    if (media) {
      const mediaPath = path.join(__dirname, media);
      const mediaBuffer = fs.readFileSync(mediaPath);
      await sock.sendMessage(to, {
        image: mediaBuffer,
        caption: content,
      });
    } else {
      await sock.sendMessage(to, { text: content });
    }

    history.push({
      message: content,
      timestamp: datetime,
      status: 'Enviado',
    });

    console.log(`Mensagem enviada: ${content}`);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
}

// Agendador de tarefas
new CronJob('* * * * * *', checkScheduledMessages).start(); // Verifica a cada segundo