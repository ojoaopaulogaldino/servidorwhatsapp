// listGroups.js
const { useMultiFileAuthState, makeWASocket } = require('@whiskeysockets/baileys');

async function start() {
  try {
    // Carrega o estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState('auth');

    // Cria a conexão com o WhatsApp
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true, // Exibe o QR Code no terminal
    });

    // Salva as credenciais quando necessário
    sock.ev.on('creds.update', saveCreds);

    // Escuta atualizações de conexão
    sock.ev.on('connection.update', async (update) => {
      const { connection, qr } = update;

      // Exibe o QR Code para conexão
      if (qr) {
        console.log('Escaneie este QR Code para conectar ao WhatsApp:');
      }

      // Quando a conexão é estabelecida
      if (connection === 'open') {
        console.log('✅ Conectado ao WhatsApp!');
        await listarGrupos(sock); // Chama a função para listar os grupos
      }

      // Verifica se a conexão foi fechada
      if (connection === 'close') {
        console.log('Conexão fechada. Tentando reconectar...');
        start(); // Reconecta automaticamente
      }
    });
  } catch (error) {
    console.error('Erro ao iniciar:', error);
  }
}

// Função para listar grupos
async function listarGrupos(sock) {
  try {
    // Obtém todos os grupos dos quais o usuário participa
    const grupos = await sock.groupFetchAllParticipating();

    // Exibe os grupos no terminal
    console.log('\nGrupos que você participa:');
    Object.values(grupos).forEach((grupo, index) => {
      console.log(`${index + 1}. ${grupo.subject || 'Sem nome'} (${grupo.id})`);
    });

    // Encerra a conexão após listar os grupos
    sock.end();
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
  }
}

// Inicia o processo
start();