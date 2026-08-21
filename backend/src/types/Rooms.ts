const roles = ["OVELHA", "LOBO", "SAO_BERNARDO"] as const
type role = typeof roles[number]

type vote = {
  from: string
  to: string
}

type message = {
  from: string
  text: string
}

type privacy = "PUBLIC" | "PRIVATE"
type room_state = "WAITING" | "NIGHT" | "DAY"

interface Room {
  code: string
  privacy: privacy
  room_state: room_state
  player_quantity: number
  host: string
  players: Record<string, Player>,
  roles: ConfigRole[],
  votes: vote[],
  chat: message[],
  round: number
}

interface TreatedRoom {
    code: string
    privacy: privacy
    room_state: room_state
    player_quantity: number
    host: string
    players: Record<string, TreatedPlayer>
}

type ConfigRole = {
    name: role
    quantity: number
}

interface RoomConfig {
    privacy: privacy
    roles: ConfigRole[]
}


// E aqui, os tipos especificos e a estrutura do objeto do jogador

const player_effects = ["KILL", "PROTECT"] as const
type player_effect = typeof player_effects[number]
type player_state = "READY" | "NOT_READY" | "DEAD"

interface Player {
  id: string
  socket_id: string
  name: string
  role: role | null
  player_state: player_state
  player_effect: player_effect[] 
}

interface TreatedPlayer {
    id: string
    socket_id: string
    name: string
    player_state: player_state
}


export { 
    Room, Player, 
    TreatedRoom, TreatedPlayer,
    RoomConfig
}