import { Room } from "../types/Rooms"

const Roles = {
    "LOBO":{
        name: "Lobo",
        description: 
            "O lobo em pele de cordeiro, seu objetivo é se alimentar do "+
            "rebanho sem que ninguem descubra sua verdadeira natureza",
        team: "Lobos",
        action: (Room: Room, TargetID: string)=>{
            try{
                const Target = Room.players[TargetID]
                if(!Target){
                    throw new Error("Jogador "+TargetID+" não existe na sala: "+ Room.code)
                }
                if(Target.player_state.toUpperCase() == "DEAD"){
                    throw new Error("Jogador "+Target.name+" ja esta morto")
                }
                if(Target.role && Roles[Target.role].team.toUpperCase() == "LOBOS"){
                    throw new Error("Lobo não pode atacar alguem da propria equipe")
                }
                Target.player_effects.push("KILL") //Adicionar "KILL" na lista de efeitos do jogador
                return { ok: true }
            }catch(error){
                console.log(error)
                return error
            }
        }
    },
    "OVELHA":{
        name: "Ovelha",
        description: 
            "Você faz parte do rebanho, seu objetivo é descobrir quem é o lobo, "+
            "e junto de seus colegas, mandar ele de volta pra floresta",
        team: "Rebanho",
        action: null
    },
    "SAO_BERNARDO":{
        name: "São Bernardo",
        description: 
            "Apesar de sua aparência assustadora, vocẽ é o animal mais confiavel dessa fazenda "+
            "seu objetivo é proteger as ovelhas indefesas durante a noite",
        team: "Rebanho",
        action: (Room: Room, TargetID: string)=>{
            try{
                const Target = Room.players[TargetID]
                if(!Target){
                    throw new Error("Jogador "+TargetID+" não existe na sala: "+ Room.code)
                }
                if(Target.player_state.toUpperCase() == "DEAD"){
                    throw new Error("Jogador "+Target.name+" ja esta morto")
                }
                Target.player_effects.push("PROTECT") //Adicionar "PROTECT" na lista de efeitos do jogador
                return { ok: true }
            }catch(error){
                console.log(error)
                return { error }
            }
        }
    }
}

export { Roles }