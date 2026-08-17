import { createClient } from 'redis'
import { Room } from "../constants/CustomTypes"
import dotenv from "dotenv"
dotenv.config()

const redis = createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379'
})

redis.on('error', err => console.error('Redis error', err))

async function ConnectDBCache(){
    try {
        if (!redis.isOpen) {
            await redis.connect()
        }
        return redis
    } catch (error) {
        console.error('Erro ao conectar ao Redis:', error)
        process.exit(1)
    }
}
//* Salas
const ROOMS_KEY = 'rooms'
const ACTIVE_ROOMS = 'active_rooms'

async function SaveRoom(Room: Room){
    if (!redis.isOpen) {
        await ConnectDBCache()
    }
    await redis.set(`${ROOMS_KEY}:${Room.code}`, JSON.stringify(Room), {EX: 10800})
    await redis.sAdd(`${ACTIVE_ROOMS}`, Room.code)
    return Room
}

async function SearchRoom(code: string): Promise<Room | null> {
    if (!redis.isOpen) {
        await ConnectDBCache()
    }
    const raw = await redis.get(`${ROOMS_KEY}:${code}`)
    if(raw){
        return JSON.parse(raw)
    }
    return null
}

async function DeleteRoom(code: string) {
    if (!redis.isOpen) {
        await ConnectDBCache()
    }
    await redis.del(`${ROOMS_KEY}:${code}`)
    await redis.sRem(`${ACTIVE_ROOMS}`, code)
}

async function ListRooms() {
    if (!redis.isOpen) {
        await ConnectDBCache()
    }
    const RoomCodes = await redis.sMembers(`${ACTIVE_ROOMS}`)
    if (RoomCodes.length === 0) return []

    const raw = await redis.mGet(RoomCodes)
    const Rooms: Room[] = raw
        .filter((json): json is string => json !== null)
        .map(json => JSON.parse(json))
    
    return Rooms
}

export {
    ConnectDBCache,
    SaveRoom,
    SearchRoom,
    DeleteRoom,
    ListRooms
}