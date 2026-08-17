// Define os tipos especificos pra estrtura das salas

// FIXME: MUdar de um arquivo monolitico pra uma pasta de arquivos que declaram tipos 
// pra cada ocasião diferente

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
  roles: role[],
  votes: vote[],
  chat: message[],
  turn: number
}

interface TreatedRoom {
    code: string
    privacy: privacy
    room_state: room_state
    player_quantity: number
    host: string
    players: Record<string, TreatedPlayer>
}


// TODO: Fazer o RoomConfig interface
interface RoomConfig {}

// E aqui, os tipos especificos e a estrutura do objeto do jogador

const player_effects = ["MATAR", "SALVAR"] as const
type player_effect = typeof player_effects[number]
type player_state = "READY" | "NOT_READY"

interface Player {
  id: string
  socket_id: string
  name: string
  role: role
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
    TreatedRoom, TreatedPlayer
}