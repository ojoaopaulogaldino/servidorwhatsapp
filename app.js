// const { WAConnection } = require("@adiwajshing/baileys")
// const fs = require("fs")
// const http = require("http")
// const qrcode = require("qrcode")
// const express = require("express")
// const socketIO = require("socket.io")
// const port = 8000 || process.env.PORT
// const conn = new WAConnection()
// const app = express()
// const server = http.createServer(app)
// const io = socketIO(server)

// conn.connectOptions.alwaysUseTakeover = true

// app.use("/", express.static(__dirname + "/"))

// app.use(express.json())
// app.use(express.urlencoded({
//   extended: true
// }))

// app.get('/', (req, res) => {
//     res.sendFile('index.html', {
//       root: __dirname
//     });
//   });

// io.on("connection", async socket => {
//     socket.emit('message', 'Connecting...');

// 	conn.on("qr", qr => {
//         console.log('QR RECEIVED', qr);
// 		qrcode.toDataURL(qr, (err, url) => {
// 			socket.emit("qr", url)
// 			socket.emit("log", "QR Code received, please scan!")
// 		})
// 	})

// 	conn.on("open", async res => {
//         const authInfo = conn.base64EncodedAuthInfo()
//         fs.writeFileSync('./auth.json', JSON.stringify(authInfo, null, '\t'))
//         socket.emit('message', 'Whatsapp is ready!');
//         socket.emit("qr", "./check.svg")
// 		socket.emit("log", res)
// 	})

// 	conn.on("close", res => {
//         if (fs.existsSync('./auth.json')) {
//             fs.unlinkSync('./auth.json');
//         }
//         conn.clearAuthInfo();
//         socket.emit('message', 'Whatsapp is disconnected!');
// 		socket.emit("log", res)
// 	})

//     if (fs.existsSync('./auth.json')) {
//         conn.loadAuthInfo('./auth.json')
//     }

// 	switch (conn.state) {
// 		case "close":
// 			await conn.connect()
// 			break
// 		case "open":
// 			socket.emit("qr", "./check.svg")
//             socket.emit('open', 'Whatsapp is ready!');
//             socket.emit('log', 'Whatsapp is ready!');
// 			break
// 		default:
// 			socket.emit("log", conn.state)
// 	}
// })

// server.listen(port, () => {
//     console.log(`http://localhost:${port}`)
// })

const { makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const fs = require("fs");
const http = require("http");
const qrcode = require("qrcode");
const express = require("express");
const socketIO = require("socket.io");
const path = require("path");

const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Configuração de autenticação
let auth;
let sock;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  
  sock = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    browser: ["Baileys Server", "Chrome", "1.0"]
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;
    
    if (qr) {
      const url = await qrcode.toDataURL(qr);
      io.emit("qr", url);
      io.emit("log", "QR Code recebido, escaneie!");
    }

    if (connection === "open") {
      io.emit("message", "WhatsApp conectado!");
      io.emit("qr", "./check.svg");
      await saveCreds();
    }

    if (connection === "close") {
      io.emit("message", "WhatsApp desconectado!");
      if (fs.existsSync("auth_info")) {
        fs.rmSync("auth_info", { recursive: true, force: true });
      }
      setTimeout(() => connectToWhatsApp(), 5000); // Reconecta após 5 segundos
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  socket.emit("message", "Conectando...");
  
  if (!sock) {
    connectToWhatsApp();
  } else if (sock.user) {
    socket.emit("message", "WhatsApp já conectado!");
    socket.emit("qr", "./check.svg");
  }
});

server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  connectToWhatsApp();
});