import { Socket } from "socket.io";
import { TreatedRoom, TreatedPlayer, Room, RoomConfig, Player } from "../types/Rooms";
import { User } from "../types/User"
import { ListRooms, SaveRoom, SearchRoom } from "../database/redis";
import { Roles } from "../constants/Roles";

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

const GetRoom = async (code: string) => {
  try{
    const RawRoom = await SearchRoom(code)
    if(!RawRoom){
      throw new Error("Sala não encontrada")
    }
    return TreatRoom(RawRoom)
  }catch(error){
    console.log(error)
    return error
  }
}

const CreateRoom = async (socket: Socket, user: User, config: RoomConfig = {privacy: "PUBLIC", roles: [{name: "LOBO", quantity: 1},{name: "SAO_BERNARDO", quantity: 1}, {name: "OVELHA", quantity: 2}]}) => {
  try{
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
      votes: [],
      chat: [],
      round: 0
    }

    await SaveRoom(NewRoom)
    //TODO: eu nn achei no codigo antigo a parte do codigo em que te coloca na sala que vc criou
    // ent procurar um pouco mais e se nn achar colocar ela aqui

    return { ok: true, data:{Room: TreatRoom(NewRoom), message: `Sala ${code} criada com sucesso`}}
  }catch(error){
    console.log(error)
    return error
  }
}

const JoinRoom = async (socket: Socket, user: User, code: string) => {
  try{
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
      name: user.name + user.tag,
      role: null,
      player_state: "NOT_READY",
      player_effect: []
    }


  }catch(error){

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

export { ListPublicRooms, GetRoom }