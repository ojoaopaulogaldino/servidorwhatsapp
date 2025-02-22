// src/controllers/messageController.js
const { saveDB, db } = require('../utils/database');
const { getSock } = require('../services/whatsappService');
const path = require('path');
const fs = require('fs');

function createMessage(req, res, io) {
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
      recipient = group.endsWith('@g.us') ? group : `${group}@g.us`; // Evita duplicação // Formato de ID de grupo no WhatsApp
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

    // Define o caminho da mídia (se houver upload)
    const mediaPath = req.file ? path.join(__dirname, '../../uploads', req.file.filename) : null;

    // Cria a mensagem agendada
    const scheduledMessage = {
      id: require('uuid').v4(),
      title,
      content,
      media: mediaPath, // Caminho da mídia, se houver
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

        // Verifica se a conexão está ativa
        if (!sock.user) {
          throw new Error('Conexão WhatsApp não está ativa');
        }

        if (message.media) {
          console.log('Caminho da mídia:', message.media); // Log para depuração
          console.log('Agendando mensagem:', {
            id: message.id,
            title: message.title,
            time: message.time,
            daily: message.daily,
            recipient: message.recipient,
            media: message.media ? 'Sim' : 'Não'
          });
          if (!fs.existsSync(message.media)) {
            throw new Error(`Arquivo de mídia não encontrado: ${message.media}`);
          }

          const buffer = fs.readFileSync(message.media);
          await sock.sendMessage(message.recipient, { image: buffer, caption: message.content });
        } else {
          await sock.sendMessage(message.recipient, { text: message.content });
        }

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

  // Se for uma mensagem diária, agenda novamente
  if (message.daily) {
    setInterval(async () => {
      try {
        const sock = getSock();
        if (!sock) {
          throw new Error('Conexão WhatsApp não inicializada');
        }

        // Verifica se a conexão está ativa
        if (!sock.user) {
          throw new Error('Conexão WhatsApp não está ativa');
        }

        if (message.media) {
          if (!fs.existsSync(message.media)) {
            throw new Error(`Arquivo de mídia não encontrado: ${message.media}`);
          }

          const buffer = fs.readFileSync(message.media);
          await sock.sendMessage(message.recipient, { image: buffer, caption: message.content });
        } else {
          await sock.sendMessage(message.recipient, { text: message.content });
        }

        // Atualiza o status da mensagem
        message.sent = false; // Permite que a mensagem seja enviada novamente no próximo dia
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