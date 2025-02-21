// src/config/multer.js
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuração do armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Pasta onde os arquivos serão salvos
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`); // Gera um nome único para o arquivo
  },
});

// Filtro para aceitar apenas imagens e vídeos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens e vídeos são permitidos!'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
});

module.exports = upload;