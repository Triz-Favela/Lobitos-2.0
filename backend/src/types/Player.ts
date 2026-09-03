import { Role } from "./Rooms"

// Os tipos especificos e a estrutura do objeto do jogador
// Um usuário só passa a ser "Player" quando entra na partida/Sala
// A estrtura de "Player" só existe dentro de um objeto de sala, 
// em outros lugares do site, ele é tratado como usuario "./User.ts"

type PlayerEffect = "KILL" | "PROTECT"
type PlayerState = "READY" | "NOT_READY" | "DEAD"

interface Player {
  id: string
  socket_id: string
  name: string
  tag: string
  role: Role | null
  player_state: PlayerState
  player_effects: PlayerEffect[] 
}

interface TreatedPlayer {
    id: string
    socket_id: string
    name: string
    tag: string
    player_state: PlayerState
}

export {
    Player,
    TreatedPlayer,
    PlayerEffect,
    PlayerState
}