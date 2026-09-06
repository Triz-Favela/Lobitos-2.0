import { AsyncResult, Result } from "../types/Result";
import { Role, Room, Vote } from "../types/Rooms";
import { SaveRoom, FetchRoom } from "../database/cacheDB";
import { User } from "../types/User";
import { Roles } from "../constants/Roles";
import { ChatGroup, Message } from "../types/Chat";
import { Player } from "../types/Player";
import { AdvanceRoomState } from "./GameStateMachine";

const AssignRoles = (Room: Room): Result => {
    try{
        if(Room.room_state === "WAITING"){
            throw new Error(`O jogo da sala ${Room.code} ainda não começou`)
        }

        const RolesList: Role[] = Room.roles.flatMap(role =>
            Array.from({ length: role.quantity }, () => role.name)
        )

        ShuffleArray(RolesList)
        Object.values(Room.players).forEach((player, index) => {
            player.role = RolesList[index]!
        })

        return { ok: true }

    }catch(error){
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.log(error);
        return { ok: false, error: message };
    }

}

const UseAbility = async (user: User, code: string, targetID: string | null = null): AsyncResult => {
    try{
        const Room = await FetchRoom(code)
        if(!Room){
            throw new Error(`Sala ${code} não encontrada`)
        }
        if(Room.room_state != "NIGHT"){
            throw new Error(`Só é possível usar a habilidade durante a noite`)
        }

        const PlayerInRoom = Room.players[user.id]
        if(!PlayerInRoom){
            throw new Error(`Jogador ${user.name}#${user.tag} não está na sala ${code}`)
        }
        if(PlayerInRoom.player_state != "NOT_READY"){
            throw new Error(`Jogador ja usou a habilidade ou está morto`)
        }

        const Role = Roles[PlayerInRoom.role!]
        if(!Role){
            throw new Error(`O papel "${PlayerInRoom.role}" não é um papel reconhecido pelo jogo`)
        }

        let AbilityResult: Result = {ok: true}

        // TODO: preciso talvez criar algum meio pra checar se a habilidade precisa de fato de um alvo
        // caso queira criar papeis com habilidades diferentes, algo como "pegar um player aleatorio" ou algma
        // habilidade que tenha mais de um alvo, nn sei direito como faria isso T-T ... 
        // talvez o "targetID" sendo uma array, mas parece gambiarra
        if(Role.ability){
            if(targetID == null){
                throw new Error(`${Role.name} precisa de um alvo`)
            }
            AbilityResult = Role.ability(Room, targetID)!
        }

        if(!AbilityResult.ok){
            throw new Error(AbilityResult.error)
        }

        const PlayerReadyResult = SetPlayerReady(PlayerInRoom, Room)
        if(!PlayerReadyResult.ok){
            throw new Error(PlayerReadyResult.error)
        }

        await SaveRoom(Room)
        return PlayerReadyResult

    }catch(error){
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.log(error);
        return { ok: false, error: message };

    }
}

const Vote = async (user: User, code: string, targetID: string|null): AsyncResult => {
    try{
        const Room = await FetchRoom(code)
        if(!Room){
            throw new Error(`Sala ${code} não encontrada`)
        }
        if(Room.room_state != "DAY"){
            throw new Error(`Só é possível participar da votação durante a noite`)
        }

        const PlayerInRoom = Room.players[user.id]
        if(!PlayerInRoom){
            throw new Error(`Jogador ${user.name}#${user.tag} não está na sala ${code}`)
        }
        if(PlayerInRoom.player_state != "NOT_READY"){
            throw new Error(`Jogador ja votou ou está morto, logo, não pode votar`)
        }
        if(Room.votes[PlayerInRoom.id]){
            throw new Error(`Jogador ja votou, não pode votar 2 vezes`)
        }

        let vote: Vote = {
            target: null
        }


        const Target = targetID? Room.players[targetID] : null
        if(Target){
            if(Target.player_state == "DEAD"){
                throw new Error(`Jogador com id "${Target}" ja está morto`)
            }
            vote = {
                target: targetID
            }
        }

        Room.votes[user.id] = vote

        const PlayerReadyResult = SetPlayerReady(PlayerInRoom, Room)
        if(!PlayerReadyResult.ok){
            throw new Error(PlayerReadyResult.error)
        }

        await SaveRoom(Room)
        return {ok: true}
    }catch(error){
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.log(error);
        return { ok: false, error: message };
    }
}

const SendMessage = async (user: User, code: string, text: string, to: ChatGroup = "GERAL"): AsyncResult => {
    try{
        const Room = await FetchRoom(code)
        if(!Room){
            throw new Error(`Sala ${code} não encontrada`)
        }
        const PlayerInRoom = Room.players[user.id]
        if(!PlayerInRoom){
            throw new Error(`Jogador ${user.name}#${user.tag} não está na sala ${code}`)
        }

        let message: Message = {
            from: `${user.name}#${user.tag}`,
            to: PlayerInRoom.player_state == "DEAD" ? to : "DEAD",
            text
        }

        Room.chat.push(message)
        await SaveRoom(Room)
        return {ok: true, data: {message}}
    }catch(error){
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        return { ok: false, error: message };
    }
}

const ShuffleArray = (Array: string[]) => {
    let index = Array.length
    while(index !== 0){
        const random = Math.floor(Math.random() * index)
        index--

        [Array[index], Array[random]] = [Array[random]!, Array[index]!]
    }
}


const SetPlayerReady = (Player: Player, Room: Room): Result => {
    try{
        Player.player_state = "READY"
        
        if(AllPlayersReady(Room).ok){
            const result = AdvanceRoomState(Room)
            return result
        }
        return {ok: true}
    }catch(error){
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.log(error);
        return { ok: false, error: message };
    }
}

const AllPlayersReady = (Room: Room): Result => {
    try{
        const players = Room.players
        for(const player of Object.values(players)){
             if(player.player_state = "DEAD"){
                continue
            }
            if(player.player_state = "NOT_READY"){
                throw new Error(`Nem todos os jogadores estão prontos`)
            }
        }
        return {ok: true}
    }catch(error){
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        return { ok: false, error: message };
    }
}

export { 
    AssignRoles,
    UseAbility,
    SendMessage,
    Vote,
    AllPlayersReady
}