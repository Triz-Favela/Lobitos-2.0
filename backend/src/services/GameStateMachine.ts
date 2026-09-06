import { Result } from "../types/Result";
import { Room } from "../types/Rooms";
import { AssignRoles } from "./GameManager";

// TODO: Adicionar uma função pra checar o fim de jogo

// TODO: No final de cada turno, checar os players ativos asinda, e só então "sanitizar" a sala
// colocar como morto players desconectados, assim, evitando conflitos

//const AdvanceRoomState = (Room: Room): Result<{DeadPlayers: string[]}> => {
const AdvanceRoomState = (Room: Room): Result => {
    try{
        var DeadPlayers: string[] = []
        switch(Room.room_state){
            case "WAITING":
                Room.room_state = "NIGHT"
                AssignRoles(Room)
                Room.round += 1
                break;
            case "NIGHT":
                Object.values(Room.players).forEach(player => {
                    if(player.player_state === "DEAD"){
                        return
                    }
                    if(player.player_effects.includes("KILL") && !player.player_effects.includes("PROTECT")){
                        player.player_state = "DEAD"
                        DeadPlayers.push(player.id)
                    }
                    player.player_effects = []
                })
                Room.room_state = "DAY"
                break;
            case "DAY":
                const result = ProcessVote(Room)
                if(!result.ok){
                    return result
                }
                const VoteResult = result.data?.VoteResult!

                if(VoteResult !== "STALEMATE"){
                    Room.players[VoteResult]!.player_state = "DEAD"
                    DeadPlayers.push(VoteResult)
                }
                Room.votes = {}
                Room.chat = []
                Room.room_state = "NIGHT"
                Room.round += 1
                break;
        }
        
        Object.values(Room.players).forEach(player => {
            if(player.player_state === "DEAD"){
                return
            }
            player.player_state = "NOT_READY"
        })


        return {ok: true, data: {AdvancedRoomState: true, DeadPlayers}}

    }catch(error){
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.log(error);
        return { ok: false, error: message };
    }
}

const ProcessVote = (Room: Room): Result => {
    try{
        let VoteCount: Record<string, number> = {}
        Object.values(Room.votes).forEach(vote => {
            const Target = vote.target
            if(!Target){
                return
            }
            if(!VoteCount[Target]){
                VoteCount[Target] = 0
            }
            VoteCount[Target] += 1
        })
        
        let BannedPlayer: string[] = []
        let MaxVoteCount = -1
        for(const Target in VoteCount){
            if(VoteCount[Target] && VoteCount[Target] > MaxVoteCount){
                MaxVoteCount = VoteCount[Target]
                BannedPlayer = [Target]
            }else{
                if(VoteCount[Target] == MaxVoteCount){
                    BannedPlayer.push(Target)
                }
            }
        }

        //TODO: Uma ideia interessante é um stalemate resolver
        // Talvez alguma configuração da sala que decida oq fazer nessas situações
        // seja a decisão expulsar ambos, expuldar um aleatorio ou não expulsar ninguem
        // por enquanto, não expulsa ninguem
        let VoteResult: string

        if(BannedPlayer.length > 1){
            VoteResult = "STALEMATE"
        }else{
            VoteResult = BannedPlayer[0]!
        }
        
        return {ok: true, data:{VoteResult}}

    }catch(error){
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.log(error);
        return { ok: false, error: message };
    }

}

export { 
    AdvanceRoomState
}