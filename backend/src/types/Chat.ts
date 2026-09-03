
type ChatGroup = "LOBISOMENS" | "GERAL" | "DEAD" | (string & {})
type Message = {
    from: string,
    to: ChatGroup,
    text: string
}

export { 
    ChatGroup,
    Message
}