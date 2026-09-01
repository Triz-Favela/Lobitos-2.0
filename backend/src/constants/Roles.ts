import { Result } from "../types/Result"
import { Room } from "../types/Rooms"

const Roles = {
    "LOBO":{
        name: "Lobo",
        description: 
            "O lobo em pele de cordeiro, seu objetivo é se alimentar do "+
            "rebanho sem que ninguem descubra sua verdadeira natureza",
        team: "Lobos",
        ability: (Room: Room, targetID: string): Result =>{
            try{
                const Target = Room.players[targetID]
                if(!Target){
                    throw new Error("Jogador "+targetID+" não existe na sala: "+ Room.code)
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
                const message = error instanceof Error ? error.message : "Erro desconhecido";
                console.log(error);
                return { ok: false, error: message };
            }
        }
    },
    "OVELHA":{
        name: "Ovelha",
        description: 
            "Você faz parte do rebanho, seu objetivo é descobrir quem é o lobo, "+
            "e junto de seus colegas, mandar ele de volta pra floresta",
        team: "Rebanho",
        ability: null
    },
    "SAO_BERNARDO":{
        name: "São Bernardo",
        description: 
            "Apesar de sua aparência assustadora, vocẽ é o animal mais confiavel dessa fazenda "+
            "seu objetivo é proteger as ovelhas indefesas durante a noite",
        team: "Rebanho",
        ability: (Room: Room, targetID: string): Result =>{
            try{
                const Target = Room.players[targetID]
                if(!Target){
                    throw new Error("Jogador "+targetID+" não existe na sala: "+ Room.code)
                }
                if(Target.player_state.toUpperCase() == "DEAD"){
                    throw new Error("Jogador "+Target.name+" ja esta morto")
                }
                Target.player_effects.push("PROTECT") //Adicionar "PROTECT" na lista de efeitos do jogador
                return { ok: true }
            }catch(error){
                const message = error instanceof Error ? error.message : "Erro desconhecido";
                console.log(error);
                return { ok: false, error: message };
            }
        }
    }
}

export { Roles }