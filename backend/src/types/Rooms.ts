const Roles = ["OVELHA", "LOBO", "SAO_BERNARDO"] as const
type Role = typeof Roles[number]

type Vote = {
  from: string
  to: string
}

type Message = {
  from: string
  text: string
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
  votes: Vote[],
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


// E aqui, os tipos especificos e a estrutura do objeto do jogador
// NOTE: Um usuário só passa a ser "Player" quando entra na partida/Sala
// A estrtura de "Player" só existe dentro de um objeto de sala, 
// em outros lugares do site, ele é tratado como usuario "./User.ts"


const PlayerEffects = ["KILL", "PROTECT"] as const
type PlayerEffect = typeof PlayerEffects[number]
type PlayerState = "READY" | "NOT_READY" | "DEAD"

interface Player {
  id: string
  socket_id: string
  name: string
  role: Role | null
  player_state: PlayerState
  player_effects: PlayerEffect[] 
}

interface TreatedPlayer {
    id: string
    socket_id: string
    name: string
    player_state: PlayerState
}


export { 
    Room, Player, 
    TreatedRoom, TreatedPlayer,
    RoomConfig, ConfigRole,
    RoomState
}