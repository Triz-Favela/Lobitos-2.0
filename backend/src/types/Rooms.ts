import { Message } from "./Chat"
import { Player, TreatedPlayer } from "./Player"

type Role = "OVELHA" | "LOBO" | "SAO_BERNARDO"

type Vote = {
  target: string | null
}

type Privacy = "PUBLIC" | "PRIVATE"
type RoomState = "WAITING" | "NIGHT" | "DAY" | "INTERLUDE"


// TODO: Talvez mudar a estrutura para que todas as configuraçẽos 
// estejam em uma unica propriedade "config", um objeto que guarda 
// as opçẽos como privacidade, stalemate resolver e etc
interface Room {
  code: string
  privacy: Privacy
  room_state: RoomState
  player_quantity: number
  host: string
  players: Record<string, Player>,
  roles: ConfigRole[],
  votes: Record<string, Vote>,
  chat: Message[],
  round: number
}

interface TreatedRoom {
    code: string
    privacy: Privacy
    room_state: RoomState
    player_quantity: number
    host: string
    players: Record<string, TreatedPlayer>
}

type ConfigRole = {
    name: Role
    quantity: number
}

interface RoomConfig {
    privacy?: Privacy
    roles?: ConfigRole[]
}


export { 
    Room,
    TreatedRoom,
    RoomConfig, ConfigRole, Role, Vote,
    RoomState
}