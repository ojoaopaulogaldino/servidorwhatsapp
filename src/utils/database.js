const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../db.json');
let db = { messages: [], history: [], groups: [] };

if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

module.exports = { saveDB, db };