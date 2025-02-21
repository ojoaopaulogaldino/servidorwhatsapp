// src/controllers/messageController.js
const { saveDB, db } = require('../utils/database');
const { getSock } = require('../services/whatsappService');

// src/controllers/messageController.js
function createMessage(req, res, io) {
  console.log('Dados recebidos:', req.body); // Log dos dados recebidos
  console.log('Arquivo recebido:', req.file); // Log do arquivo recebido

  const { title, content, time, daily, recipientType, group, contact, ddi } = req.body;

  try {
    // Verifica se o tipo de destinatário foi selecionado
    if (!recipientType) {
      throw new Error('Selecione o tipo de destinatário');
    }

    // Verifica se o destinatário foi selecionado
    let recipient;
    if (recipientType === 'group') {
      if (!group) {
        throw new Error('Selecione um grupo');
      }
      recipient = `${group}@g.us`; // Formato de ID de grupo no WhatsApp
    } else if (recipientType === 'contact') {
      if (!contact || !ddi) {
        throw new Error('Preencha o número do contato e o DDI');
      }
      recipient = `${ddi}${contact}@s.whatsapp.net`; // Formato de número de contato no WhatsApp
    }

    // Verifica se a mensagem foi preenchida
    if (!content) {
      throw new Error('Digite o conteúdo da mensagem');
    }

    // Verifica se o horário foi preenchido
    if (!time) {
      throw new Error('Selecione um horário de envio');
    }

    // Cria a mensagem agendada
    const scheduledMessage = {
      id: require('uuid').v4(),
      title,
      content,
      media: req.file ? `/uploads/${req.file.filename}` : null, // Caminho da mídia, se houver
      time,
      daily: daily === 'on', // Converte o valor do checkbox para booleano
      recipient,
      sent: false,
    };

    // Adiciona a mensagem ao banco de dados
    db.messages.push(scheduledMessage);
    saveDB();

    // Agenda a mensagem
    scheduleMessage(scheduledMessage, io);

    // Retorna sucesso
    res.status(201).json({ message: 'Mensagem agendada com sucesso!' });
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    res.status(400).json({ error: error.message });
  }
}

// Função para agendar a mensagem
// src/controllers/messageController.js
// src/controllers/messageController.js
async function scheduleMessage(message, io) {
  const now = new Date();
  const [hours, minutes] = message.time.split(':');
  const scheduleTime = new Date();
  scheduleTime.setHours(hours, minutes, 0, 0); // Define o horário de envio

  // Se o horário já passou hoje, agenda para o próximo dia
  if (scheduleTime < now) {
    scheduleTime.setDate(scheduleTime.getDate() + 1);
  }

  const delay = scheduleTime - now;

  if (delay > 0) {
    setTimeout(async () => {
      try {
        const sock = getSock();
        if (!sock) {
          throw new Error('Conexão WhatsApp não inicializada');
        }

        // Prepara o conteúdo da mensagem
        const content = {
          text: message.content,
        };

        // Adiciona mídia, se houver
        if (message.media) {
          const buffer = require('fs').readFileSync(require('path').join(__dirname, '../../', message.media));
          content.image = buffer;
          content.caption = message.content;
        }

        console.log('Conteúdo da mensagem:', content); // Log do conteúdo da mensagem

        // Aumenta o tempo limite para envio de mensagens
        const timeout = 30000; // 30 segundos
        await sock.sendMessage(message.recipient, content, { timeout });

        // Atualiza o status da mensagem
        message.sent = true;
        saveDB();

        // Envia atualização para o frontend
        io.emit('update-messages', db.messages);
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        io.emit('log', `Erro ao enviar mensagem: ${error.message}`);
      }
    }, delay);
  }

  // messageController.js
  if (message.media) {
    // Envia a mídia como um upload do WhatsApp
    const mediaMessage = await sock.prepareMessage(
      message.recipient,
      {
        image: { url: message.media }, // Usa o caminho do arquivo
        caption: message.content
      },
      {
        upload: true,
        mediaType: 'image', // ou 'video' se for vídeo
        timeout: 30000
      }
    );

    await sock.relayMessage(message.recipient, mediaMessage.message, {
      messageId: mediaMessage.key.id
    });
  } else {
    await sock.sendMessage(message.recipient, { text: message.content }, { timeout: 30000 });
  }

  // Se for uma mensagem diária, agenda novamente
  if (message.daily) {
    setInterval(async () => {
      try {
        const sock = getSock();
        if (!sock) {
          throw new Error('Conexão WhatsApp não inicializada');
        }

        // Prepara o conteúdo da mensagem
        const content = {
          text: message.content,
        };

        // Adiciona mídia, se houver
        if (message.media) {
          const buffer = require('fs').readFileSync(require('path').join(__dirname, '../../', message.media));
          content.image = buffer;
          content.caption = message.content;
        }

        console.log('Conteúdo da mensagem diária:', content); // Log do conteúdo da mensagem diária

        // Aumenta o tempo limite para envio de mensagens
        const timeout = 30000; // 30 segundos
        await sock.sendMessage(message.recipient, content, { timeout });

        // Atualiza o status da mensagem
        message.sent = true;
        saveDB();

        // Envia atualização para o frontend
        io.emit('update-messages', db.messages);
      } catch (error) {
        console.error('Erro ao enviar mensagem diária:', error);
        io.emit('log', `Erro ao enviar mensagem diária: ${error.message}`);
      }
    }, 86400000); // 24 horas em milissegundos
  }
}

module.exports = { createMessage };