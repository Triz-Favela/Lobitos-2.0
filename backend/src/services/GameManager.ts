import { AsyncResult, Result } from "../types/Result";
import { Role, Room, Vote } from "../types/Rooms";
import { SaveRoom, SearchRoom } from "../database/cacheDB";
import { User } from "../types/User";
import { Roles } from "../constants/Roles";

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

const UseAbility = async (user: User, code: string, targetID: string): AsyncResult => {
    try{
        const Room = await SearchRoom(code)
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
        if(Role.ability){
            AbilityResult = Role.ability(Room, targetID)!
        }
        if(!AbilityResult.ok){
            throw new Error(AbilityResult.error)
        }

        await SaveRoom(Room)
        return {ok: true}

    }catch(error){
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.log(error);
        return { ok: false, error: message };

    }
}

const Vote = async (user: User, code: string, targetID: string): AsyncResult => {
    try{
        const Room = await SearchRoom(code)
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

        const Target = Room.players[targetID]
        if(Target){
            if(Target.player_state == "DEAD"){
                throw new Error(`Jogador com id "${Target}" ja está morto`)
            }
            vote = {
                target: targetID
            }
        }

        Room.votes[user.id] = vote
        await SaveRoom(Room)
        
        return {ok: true}
    }catch(error){
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.log(error);
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

export { 
    AssignRoles,
    UseAbility
}