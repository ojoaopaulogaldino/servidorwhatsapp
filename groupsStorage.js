const fs = require('fs');
const path = require('path');

const GROUPS_FILE = path.join(__dirname, 'groups.json');

// Função para salvar grupos no arquivo JSON
function saveGroups(grupos) {
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(grupos, null, 2));
}

// Função para carregar grupos do arquivo JSON
function loadGroups() {
  if (fs.existsSync(GROUPS_FILE)) {
    return JSON.parse(fs.readFileSync(GROUPS_FILE));
  }
  return [];
}

module.exports = { saveGroups, loadGroups };