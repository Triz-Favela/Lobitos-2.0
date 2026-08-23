import { Player, Room, RoomState } from "../types/Rooms";

// TODO: Adicionar uma função pra checar o fim de jogo


const AdvanceRoomState = (Room: Room) => {
    try{
        var DeadPlayers: string[] = []
        switch(Room.room_state){
            case "WAITING":
                Room.room_state = "NIGHT"
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
                const VoteResult = ProcessVote(Room)
                if(VoteResult !== "STALEMATE"){
                    Room.players[VoteResult]!.player_state = "DEAD"
                    DeadPlayers.push(VoteResult)
                }
                Room.votes = []
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


        return {ok: true, data: {Room, DeadPlayers}}

    }catch(error){

    }
}

const ProcessVote = (Room: Room) => {
    try{
        let VoteCount: Record<string, number> = {}
        Room.votes.forEach(vote => {
            const Target = vote.to
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
        
        return VoteResult

    }catch(error){
        console.log(error)
        return "STALEMATE"
    }

}