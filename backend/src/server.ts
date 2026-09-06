import express from "express";
import cors from "cors";
import { ConnectDB } from "./database/mainDB";
import { ConnectDBCache } from "./database/cacheDB";

// const jogadorRoutes = require('./src/routes/JogadorRoutes');//importa as rotas do CRUD de jogadores
// const jogoRoutes = require('./src/routes/JogoRoutes');//importa as rotas das salas

//* Importação de funções pro socket.io funcionar
import { createServer } from "node:http";
import { Server } from "socket.io";
//const GameSocket = require('./src/sockets/GameSocket.js') //importa o "GameSocket", onde a lógica do jogo existe
import dotenv from "dotenv"
import SocketManager from "./Socket/SocketManager";
import { UserRoutes } from "./routes/UserRoutes";
dotenv.config()

const app = express();
ConnectDB();// Conecta ao banco de dados
ConnectDBCache();

//* Configuração do socket.io
const server = createServer(app) //cria o server "cru" a partir do express
const io = new Server(server, {connectionStateRecovery: {}});//"connectionRecovery" lida com breves desconexões
SocketManager(io)

//* Middlewares
app.use(cors());
// const FRONTADRESS = process.env.FRONTADRESS || "https://localhost:5173"
// app.use(cors({
//   origin: '{FRONTADRESS}'
// }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


//* Rotas da API
app.use('/api', UserRoutes);
// app.use('/api', jogoRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(` Servidor rodando na porta ${PORT}`);
    console.log(` Acesse: http://localhost:${PORT}`);
});