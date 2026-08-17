import { Room } from "./CustomTypes"

const Roles = {
    Lobo:{
        name: "Lobo",
        description: 
            "O lobo em pele de cordeiro, seu objetivo é se alimentar do "+
            "rebanho sem que ninguem descubra sua verdadeira natureza",
        team: "Lobos",
        action: (Room: Room, TargetID: string)=>{
            try{
                const Target = Room.players[TargetID]
                if(!Target){
                    return {erro: "Jogador "+TargetID+" não existe na sala: "+ Room.code}
                }
                if(Target.player_state.toUpperCase() == "MORTO"){
                    return {erro: "Jogador "+Target.name+" ja esta morto"}
                }
                if(exports.Funcoes[Target.role].equipe.toUpperCase() == "LOBOS"){
                    return {erro: "Lobo não pode atacar alguem da propria equipe"}
                }
                Target.player_effect.push("MATAR") //Adicionar "MATAR" na lista de efeitos do jogador
                return { ok: true }
            }catch(erro){
                return erro
            }
        }
    },
    Ovelha:{
        name: "Ovelha",
        description: 
            "Você faz parte do rebanho, seu objetivo é descobrir quem é o lobo, "+
            "e junto de seus colegas, mandar ele de volta pra floresta",
        team: "Rebanho",
        action: null
    },
    "Sao Bernardo":{
        name: "Sao Bernardo",
        description: 
            "Apesar de sua aparência assustadora, vocẽ é o animal mais confiavel dessa fazenda "+
            "seu objetivo é proteger as ovelhas indefesas durante a noite",
        team: "Rebanho",
        action: (Room: Room, TargetID: string)=>{
            try{
                const Target = Room.players[TargetID]
                if(!Target){
                    return {erro: "Jogador "+TargetID+" não existe na sala: "+ Room.code}
                }
                if(Target.player_state.toUpperCase() == "MORTO"){
                    return {erro: "Jogador "+Target.name+" ja esta morto"}
                }
                Target.player_effect.push("SALVAR") //Adicionar "PROTEGER" na lista de efeitos do jogador
                return { ok: true }
            }catch(erro){
                return { erro }
            }
        }
    }
}

export { Roles }