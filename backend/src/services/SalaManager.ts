import { TreatedRoom, TreatedPlayer, Room } from "../constants/CustomTypes";
import { ListRooms, SearchRoom } from "../database/redis";

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
  const newRoom: TreatedRoom = {
    code: Room.code,
    privacy: Room.privacy,
    room_state: Room.room_state,
    player_quantity: Room.player_quantity,
    host: Room.host,
    players: TreatedPlayers
  }

  return newRoom
}

const ListPublicRooms = async () => {
  const AllRooms = await ListRooms()
  const PublicRooms = AllRooms.filter(Room => Room.privacy == "PUBLIC")
  
  const TreatedRooms = PublicRooms.map(Room => {
    return TreatRoom(Room)
  })
  return TreatedRooms
}

const GetRoom = async (code: string) => {
  const RawRoom = await SearchRoom(code)
  if(!RawRoom){
    throw new Error("Sala não encontrada")
  }
  return TreatRoom(RawRoom)
}

const CreateRoom = async () => {

}

export { ListPublicRooms, GetRoom }