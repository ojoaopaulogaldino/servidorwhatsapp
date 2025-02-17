const baileys = require('@whiskeysockets/baileys');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore, delay } = baileys;
const { Boom } = require('@hapi/boom');
const readline = require('readline');
const fs = require('fs');
const qrcode = require('qrcode-terminal'); // Exibe QR Code no terminal

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth'); // Autenticação
    const sock = makeWASocket({ auth: state });

    sock.ev.on('creds.update', saveCreds);

    // Exibe o QR Code para conexão
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.clear();
            console.log('Escaneie este QR Code para conectar ao WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            console.log('Conexão fechada, tentando reconectar...', shouldReconnect);
            if (shouldReconnect) start();
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
            scheduleMessage(sock);
        }
    });
}

function getRemainingTime(targetDate) {
    const now = new Date();
    const diff = targetDate - now;
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
}

async function scheduleMessage(sock) {
    // Defina os detalhes da mensagem agendada
    const scheduledDate = new Date('2025-02-16T14:17:00'); // Ajuste a data e hora desejada
    const chatId = '5588981898671@s.whatsapp.net'; // Número do destinatário com código do país
    const message = 'Esta é uma mensagem agendada!';

    const interval = setInterval(() => {
        const { hours, minutes, seconds } = getRemainingTime(scheduledDate);
        console.clear();
        console.log(`Enviando mensagem em: ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    const delayMs = scheduledDate - new Date();
    if (delayMs > 0) {
        setTimeout(async () => {
            clearInterval(interval);
            await sock.sendMessage(chatId, { text: message });
            console.log('✅ Mensagem enviada com sucesso!');
        }, delayMs);
    } else {
        console.log('⚠️ A data e hora programadas já passaram!');
    }
}

start();
