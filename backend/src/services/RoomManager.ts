import { Socket } from "socket.io";
import { TreatedPlayer, Player } from "../types/Player";
import { TreatedRoom, Room, RoomConfig} from "../types/Rooms";
import { User } from "../types/User"
import { DeleteRoom, ListRooms, SaveRoom, SearchRoom } from "../database/cacheDB";
import { Roles } from "../constants/Roles";
import { AsyncResult } from "../types/Result";

const TreatRoom = (Room: Room) => {
  // Trata primeiro a lista de jogadores, faz com q a sala tratada nn tenha informações "sensiveis"
  // dos jogadores, como o papel atual dele e os efeitos que ele tem
  let TreatedPlayers: Record<string, TreatedPlayer> = {}
  if(Object.values(Room.players).length > 0){
    TreatedPlayers = Object.fromEntries(
      Object.entries(Room.players).map(([PlayerID, Player]) => {
        const TreatedPlayer: TreatedPlayer = {
          id: Player.id,
          socket_id: Player.socket_id,
          name: Player.name,
          tag: Player.tag,
          player_state : Player.player_state
        }
        return [PlayerID, TreatedPlayer]
      })
    )
  }

  // Depois trata a sala em si, tira as informaçẽos sensiveis e
  // coloca a lista de jogadores tratados
  const NewRoom: TreatedRoom = {
    code: Room.code,
    privacy: Room.privacy,
    room_state: Room.room_state,
    player_quantity: Room.player_quantity,
    host: Room.host,
    players: TreatedPlayers
  }

  return NewRoom
}

const ListPublicRooms = async () => {
  // TODO: fazer uma maneira de usuarios conseguirem espectar, talvez, então, mesmo q a partida tenha começado
  // vc pode entrar na sala e conversar com os mortos ou com quem mais estava esperando
  // Pega do redis a lista de salas e filtra pegando só as publicas e as que ainda não começaram
  const AllRooms = await ListRooms()
  const PublicRooms = AllRooms.filter(Room => Room.privacy == "PUBLIC" && Room.room_state == "WAITING")
  
  // Depois trata elas, pro usuario nn receber nada que não devia
  const TreatedRooms = PublicRooms.map(Room => {
    return TreatRoom(Room)
  })
  return TreatedRooms
}

const GetTreatedRoom = async (code: string): AsyncResult<{ Room: TreatedRoom; }> => {
  try{
    const RawRoom = await SearchRoom(code)
    if(!RawRoom){
      throw new Error("Sala não encontrada")
    }

    return { ok: true, data: { Room: TreatRoom(RawRoom) }}
  }catch(error){
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.log(error);
    return { ok: false, error: message };
  }
}



const CreateRoom = async (user: User, config: RoomConfig = {privacy: "PUBLIC", roles: [{name: "LOBO", quantity: 1},{name: "SAO_BERNARDO", quantity: 1}, {name: "OVELHA", quantity: 2}]}): AsyncResult<{ RoomCode: string; }> => {
  try{
    if(!config.privacy || !config.roles){
      throw new Error("A configuração inicial da sala precisa ter privacidade e papeis")
    }
    if(!["PUBLIC", "PRIVADO"].includes(config.privacy.toUpperCase())){
      throw new Error("A privacidade da sala tem que ser 'PUBLIC' ou 'PRIVATE'")
    }
    if(config.roles.length === 0){
      throw new Error("A sala deve pelo menos ter uma função")
    }
    config.roles.forEach(role => {
      if(!Roles[role.name]){
        throw new Error(`O papel ${role.name} não é um papel reconhecido pelo jogo`)
      }
      if(!Number.isInteger(role.quantity)){
        throw new Error("A quantidade de papel tem que ser um número inteiro")
      }
      if(role.quantity <= 0){
        throw new Error(`Os papeis não podem ter quantidade menor que 1`)
      }
    })

    const totalPlayers = config.roles.reduce((total, role) => total + role.quantity, 0)
    if(totalPlayers < 2 || totalPlayers > 20){
      throw new Error("O número de jogadores tem que ser entre 2 e 20")
    }
    const code = GetRandomCode()
    const NewRoom: Room = {
      code: code,
      privacy: config.privacy,
      room_state: "WAITING",
      player_quantity: totalPlayers,
      host: user.id,
      players: {},
      roles: config.roles,
      votes: {},
      chat: [],
      round: 0
    }

    await SaveRoom(NewRoom)
    //FIXME: eu nn achei no codigo antigo a parte do codigo em que te coloca na sala que vc criou
    // ent procurar um pouco mais e se nn achar colocar ela aqui

    return { ok: true, data:{RoomCode: code}}
  }catch(error){
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.log(error);
    return { ok: false, error: message };
  }
}

const JoinRoom = async (socket: Socket, user: User, code: string): AsyncResult<{ RoomCode: string; }> => {
  try{
    //NOTE: Tenho q rever esse metodo de checar a quantidade de salas que o player ta conectado pelo socket
    // minha ideia é ter mais de uma sala pra q tenha mais de um chat, chat dos lobos e chat principal, por exemplo
    // algo como uma sala do socket "CODIGO_GERAL" "CODIGO_LOBOS" e etc, escalavel pra caso queira algum outro papel
    // com habilidades mais especificas talvez
    if(socket.rooms.size > 1){
      throw new Error("tentou entrar em uma sala enaquanto já estava em outra sala")
    }
    const Room = await SearchRoom(code)
    if(!Room){
      throw new Error(`Sala ${code} não encontrada`)
    }

    const PlayerInRoom = Room.players[user.id]
    if(PlayerInRoom){
      throw new Error(`Jogador ${PlayerInRoom.name} ja existe na sala ${code}`)
    }

    if(Object.keys(Room.players).length >= Room.player_quantity){
      throw new Error(`Sala ${code} ja está cheia`)
    }

    const NewPlayer: Player = {
      id: user.id,
      socket_id: socket.id,
      name: user.name,
      tag: user.tag,
      role: null,
      player_state: "NOT_READY",
      player_effects: []
    }

    Room.players[user.id] = NewPlayer
    socket.join(`${code}_GERAL`)

    await SaveRoom(Room)  
    return { ok: true, data: { RoomCode: code }}  

  }catch(error){
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.log(error);
    return { ok: false, error: message };
  }
}

const LeaveRoom = async (socket: Socket, user: User, code: string): AsyncResult => {
  try{
    const Room = await SearchRoom(code)
    if(!Room){
      throw new Error(`Sala ${code} não encontrada`)
    }

    const PlayerInRoom = Room.players[user.id]
    if(!PlayerInRoom){
      throw new Error(`Jogador ${user.name}#${user.tag} não existe na sala ${code}`)
    }

    const PlayerList = Object.keys(Room.players)

    if(user.id == Room.host && PlayerList.length > 1){
      const newHost = PlayerList[1]
      if(newHost){
        Room.host = newHost
      }
    }

    delete Room.players[user.id]
    socket.leave(`${code}_GERAL`)

    if(Object.keys(Room.players).length <= 0){
      await DeleteRoom(code)
    }else{
      await SaveRoom(Room)
    }

    return {ok: true}

  }catch(error){
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.log(error);
    return { ok: false, error: message };
  }
}

const ReconnectToRoom = async (socket: Socket, user: User, code: string): AsyncResult<{Room: string}> => {
  try{
    const Room = await SearchRoom(code)
    if(!Room){
      throw new Error(`Sala ${code} não encontrada`)
    }

    const PlayerInRoom = Room.players[user.id]
    if(!PlayerInRoom){
      throw new Error(`Jogador ${user.name}#${user.tag} não existe na sala ${code}`)
    }

    PlayerInRoom.socket_id = socket.id
    socket.join(`${code}_GERAL`)
    await SaveRoom(Room)
    socket.to(`${code}_GERAL`).emit('Reconnected', PlayerInRoom)
    return {ok: true, data:{Room: code}}
  }catch(error){
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.log(error);
    return { ok: false, error: message };
  }
}

const ChangeRoomConfig = async (user: User, code: string, config: RoomConfig = {}): AsyncResult<{Room: string}> => {
  try{
    const Room = await SearchRoom(code)
    if(!Room){
      throw new Error(`Sala ${code} não encontrada`)
    }
    const PlayerInRoom = Room.players[user.id]
    if(!PlayerInRoom || PlayerInRoom.id != Room.host){
      throw new Error(`Jogador ${user.name} não pode mudar as configurações da sala ${code}`)
    }

    if(Room.room_state != "WAITING"){
      throw new Error(`As configurações da sala só podem ser mudadas antes da partida comecar`)
    }
    //NOTE: talvez nn seja a melhor forma de abordar isso, mas por enquanto serve, e parece ser uam forma de manter
    // essa funcao escalavel, se eu tiver em algum momento outra configuração que é mudavel, 
    // mudo no "types/Rooms.ts" o RoomConfig e adiciono um condicional no switch
    // Talvez separar as funções e esse switch só chamar elas, pra nn poluir tanto essa funcao e seprarar responsabilidades
    for(const c in config){
      switch(c){
        case "privacy":
          if(config.privacy && ["PUBLIC", "PRIVATE"].includes(config.privacy.toUpperCase())){
            Room.privacy = config.privacy
          }
          break;
        case "roles":
          if(!config.roles){
            continue
          }
          config.roles.forEach(role => {
            if(!Roles[role.name]){
              throw new Error(`O papel ${role.name} não é um papel reconhecido pelo jogo`)
            }
            if(!Number.isInteger(role.quantity)){
              throw new Error("A quantidade de papel tem que ser um número inteiro")
            }
            if(role.quantity <= 0){
              throw new Error(`Os papeis não podem ter quantidade menor que 1`)
            }
          })
          const totalPlayers = config.roles.reduce((total, role) => total + role.quantity, 0)
          if(totalPlayers < 2 || totalPlayers > 20){
            throw new Error("O número de jogadores tem que ser entre 2 e 20")
          }
          Room.roles = config.roles
          Room.player_quantity = totalPlayers
          break;
      }
    }
    await SaveRoom(Room)
    return { ok: true, data: {Room: code}}

  }catch(error){
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.log(error);
    return { ok: false, error: message };
  }
}

const ToggleReady = async (user: User, code: string): AsyncResult => {
  try{
    const Room = await SearchRoom(code)
    if(!Room){
      throw new Error(`Sala ${code} não encontrada`)
    }
    const PlayerInRoom = Room.players[user.id]
    if(!PlayerInRoom){
      throw new Error(`Jogador ${user.name}#${user.tag} não existe na sala ${code}`)
    }
    if(Room.room_state != "WAITING"){
      throw new Error(`O jogador só pode "estar pronto" e "deixar de estar pronto" no lobby`)
    }
    PlayerInRoom.player_state = (PlayerInRoom.player_state.toUpperCase() === "READY") ? "NOT_READY" : "READY"
    await SaveRoom(Room)
    return {ok: true}

  }catch(error){
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.log(error);
    return { ok: false, error: message };
  }
}

const GetRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    var code = ''
    for(var i = 0; i <= 6; i++){
        code += characters.charAt(Math.random() * 36)
    }
    return code
}

export { 
  ListPublicRooms, 
  GetTreatedRoom, 
  CreateRoom,
  JoinRoom,
  LeaveRoom,
  ReconnectToRoom,
  ToggleReady,
  ChangeRoomConfig
}