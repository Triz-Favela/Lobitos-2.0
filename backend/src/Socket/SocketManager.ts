
import { Server, DefaultEventsMap } from "socket.io";
import { CreateRoom, GetTreatedRoom, JoinRoom, LeaveRoom, ListPublicRooms, ReconnectToRoom, StartGame, ToggleReady } from "../services/RoomManager";
import { RoomConfig } from "../types/Rooms";
import { Result } from "../types/Result";
import { User } from "../types/User";
import { SendMessage, UseAbility, Vote } from "../services/GameManager";
import { ChatGroup } from "../types/Chat";
const jwt = require("jsonwebtoken")
const jwt_secret = `${process.env.JWT_SECRET}`

declare module "socket.io" {
  interface SocketData {
    user: User;
    roomCode: string | null;
  }
}

export default function SocketManager(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>){
    io.use((socket, next) => {
        const token: string = socket.handshake.auth.token
        if(!token){
            return next(new Error(`Token não fornecido, usuário não autenticado`))
        }
        try {
            const decoded = jwt.verify(token, jwt_secret);            
            socket.data.user = decoded
            socket.data.roomCode = null
            next(); 
        } catch (erro) {
            return next(new Error("Token inválido ou expirado."));
        }
    })

    io.on('connection', (socket) => {
        if(!socket.data.user){
            socket.disconnect();
        }
        console.log(socket.data.user.name + 'conectou')

        socket.use((packet, next) => { // Middleware que checa o token do jogador após cada requisição do socket
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Acesso negado. Token não fornecido."));
            }
            try {
                jwt.verify(token, jwt_secret);
                next();
            } catch (erro) {
                return next(new Error("Token inválido ou expirado."));
            }
        })

        socket.emit('LoadPlayer', socket.data.user, socket.data.roomCode)// Eu nn lembro oq isso faz lol :P

        socket.on('CreateRoom', async (config: RoomConfig, callback: CallableFunction) => {
            let result: Result
            if(Object.keys(config).length === 0){
                result = await CreateRoom(socket.data.user)
            }else{
                result = await CreateRoom(socket.data.user, config)
            }

            callback(result)

            if(result.ok){
                io.emit("UpdateRoomList")
            }
            
        })

        socket.on("JoinRoom", async (code: string, callback: CallableFunction) => {
            const result = await JoinRoom(socket, socket.data.user, code)
            callback(result)
            if(result.ok){
                socket.to(`${code}_GERAL`).emit("JoinedRoom", result.data?.RoomCode, socket.data.user)
                socket.broadcast.emit("UpdateRoomList")
                socket.data.roomCode = code
            }else{
                if(result.error.includes("já existe")){
                    socket.data.roomCode = code
                }
            }
        })

        socket.on("ReconnectToRoom", async (code: string, callback: CallableFunction) => {
            const result = await ReconnectToRoom(socket, socket.data.user, code)
            callback(result)
            if(result.ok){
                socket.data.roomCode = code
            }
        })

        socket.on("ListPublicRooms", async (callback: CallableFunction) => {
            const Rooms = await ListPublicRooms()
            callback({ok: true, data:{Rooms}})
        })

        socket.on("GetRoomState", async (callback: CallableFunction) => {
            const result = await GetTreatedRoom(socket.data.user, socket.data.roomCode)
            callback(result)
        })

        socket.on("LeaveRoom", async (callback: CallableFunction) => {
            const result = await LeaveRoom(socket, socket.data.user, socket.data.roomCode)
            callback(result)
            if(result.ok){
                socket.to(`${socket.data.roomCode}_GERAL`).emit("SaiuDaSala")
                socket.data.roomCode = null
                socket.broadcast.emit("UpdateRoomList")
            }
        })

        socket.on("ToggleReady", async (callback: CallableFunction) => {
            const result = await ToggleReady(socket.data.user, socket.data.roomCode)
            callback(result)
            if(result.ok){
                socket.to(`${socket.data.roomCode}_GERAL`).emit("UpdateRoom")
            }
        })

        socket.on("StartGame", async (callback: CallableFunction) => {
            const result = await StartGame(socket.data.user, socket.data.roomCode)
            callback(result)
            if(result.ok){
                io.to(`${socket.data.roomCode}_GERAL`).emit("GameStarted")
            }
        })

        socket.on("UseAbility", async (targetID: string|null = null, callback: CallableFunction) => {
            const result = await UseAbility(socket.data.user, socket.data.roomCode, targetID)
            callback(result)
            if(result.ok){
                socket.to(`${socket.data.roomCode}_GERAL`).emit("PlayerReady", socket.data.user)
                if(result.data && result.data.AdvandedRoomState){
                    io.to(`${socket.data.roomCode}_GERAL`).emit("UpdateRoom")
                }
            }
        })

        socket.on("Vote", async (targetID: string|null = null, callback: CallableFunction) => {
            const result = await Vote(socket.data.user, socket.data.roomCode, targetID)
            callback(result)
            if(result.ok){
                socket.to(`${socket.data.roomCode}_GERAL`).emit("PlayerReady", socket.data.user)
                if(result.data && result.data.AdvandedRoomState){
                    io.to(`${socket.data.roomCode}_GERAL`).emit("UpdateRoom")
                }
            }
        })

        socket.on("SendMessage", async (text: string, to?: ChatGroup) => {
            const result = await SendMessage(socket.data.user, socket.data.roomCode, text, to)
            if(result.ok){
                io.to(`${socket.data.roomCode}_${to?to:"GERAL"}`).emit("ReceiveMessage", result.data.message)
            }
        })

        socket.on("disconnect", (reason) => {
            if(!socket.data.player){
                console.log("Jogador não autenticado desconectou")
                return
            }
        })


    })
}