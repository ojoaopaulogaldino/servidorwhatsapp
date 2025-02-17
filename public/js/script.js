const socket = io();
let connectionPopup = null;

// Elementos UI
const connectionBtn = document.getElementById('connection-btn');
const messageForm = document.getElementById('message-form');
const messagesContainer = document.getElementById('messages-container');
const historyItems = document.getElementById('history-items');

// Controle de Conexão
connectionBtn.addEventListener('click', () => {
  if (connectionPopup) return;

  connectionPopup = document.createElement('div');
  connectionPopup.innerHTML = `
    <div class="popup">
      <div class="popup-content">
        <h2>Conexão WhatsApp</h2>
        <div id="qr-container"></div>
        <pre id="terminal">Aguardando QR Code...</pre>
        <button onclick="this.closest('.popup').remove(); connectionPopup = null">Fechar</button>
      </div>
    </div>
  `;

  document.body.appendChild(connectionPopup);
  fetch('/api/connect', { method: 'POST' });
});

// Receber QR Code
socket.on('qr', (qr) => {
  const qrContainer = document.getElementById('qr-container');
  if (qrContainer) qrContainer.innerHTML = `<img src="${qr}" style="width: 200px">`;
});

// Receber Logs
socket.on('log', (message) => {
  const terminal = document.getElementById('terminal');
  if (terminal) terminal.textContent += `\n${message}`;
});

// Atualizar Status
socket.on('connection-status', (status) => {
  connectionBtn.innerHTML = status
    ? '<i class="fas fa-check"></i> Conectado'
    : '<i class="fas fa-times"></i> Conectar';
  connectionBtn.style.backgroundColor = status ? '#25D366' : '#dc3545';
});

// Enviar Mensagem
messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const recipientType = document.getElementById('recipientType').value;
  formData.append('recipientType', recipientType);

  const response = await fetch('/api/messages', {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    e.target.reset();
  }
});

// Atualizações
socket.on('update-messages', renderMessages);
socket.on('update-history', renderHistory);

function renderMessages(messages) {
  messagesContainer.innerHTML = messages.map(msg => `
    <div class="message-card" style="display: flex; flex-direction: row;">
    ${msg.media ? `<img src="${msg.media}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 5px; margin-right: 12px;">` : ''}
      <div id="content-card" style="display: flex; flex-direction: column;">
      <h3>${msg.title}</h3>
      <p>${msg.content}</p>
      <small>${msg.time} ${msg.daily ? '(Diário)' : ''}</small>
      <button onclick="deleteMessage(${msg.id})" style="
    background-color: #ff4d4d; 
    color: white; 
    border: none; 
    padding: 4px 8px; 
    border-radius: 15px; 
    cursor: pointer; 
    font-weight: bold;
    transition: background 0.3s;
" 
onmouseover="this.style.backgroundColor='#cc0000'" 
onmouseout="this.style.backgroundColor='#ff4d4d'">
    Excluir
</button>

      </div>
    </div>
  `).join('');
}

function renderHistory(history) {
  historyItems.innerHTML = history.map(entry => `
    <div class="history-item">
      <div>${entry.title}</div>
      <div>${new Date(entry.sentAt).toLocaleString()}</div>
      <div>${entry.recipient}</div>
    </div>
  `).join('');
}

window.deleteMessage = async (id) => {
  const db = await fetch('/api/messages').then(res => res.json());
  const updated = db.messages.filter(msg => msg.id !== id);
  writeDB({ ...db, messages: updated });
  renderMessages(updated);
};

// Carregar grupos disponíveis
async function loadGroups() {
  const response = await fetch('/api/groups');
  const groups = await response.json();
  const recipientSelect = document.getElementById('recipient');

  groups.forEach(group => {
    const option = document.createElement('option');
    option.value = group.id;
    option.textContent = group.name;
    recipientSelect.appendChild(option);
  });
}

// Atualizar o campo de destinatário com base no tipo selecionado
document.getElementById('recipientType').addEventListener('change', (e) => {
  const recipientSelect = document.getElementById('recipient');
  if (e.target.value === 'group') {
    loadGroups();
  } else {
    recipientSelect.innerHTML = '<option value="">Selecione um contato ou grupo</option>';
  }
});

// Debug: Log de todas as atualizações
socket.onAny((event, ...args) => {
  console.log('[FRONTEND] Evento recebido:', event, args);
});

// Debug: Log ao enviar formulário
messageForm.addEventListener('submit', async (e) => {
  console.log('[FRONTEND] Enviando formulário:', Object.fromEntries(new FormData(e.target)));
});

// Debug: Log ao deletar mensagem
window.deleteMessage = async (id) => {
  console.log('[FRONTEND] Deletando mensagem ID:', id);
  // ...resto do código
};