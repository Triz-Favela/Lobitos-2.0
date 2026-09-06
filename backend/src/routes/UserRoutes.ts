import { CreateUser, FetchUser, ListUsers, Login, LoginGuest } from "../controllers/UserController";
import { ProtectRoute } from "../services/JWTAuth";

const express = require('express')
const router = express.Router();

router.post('/user', CreateUser)

router.post('/login', Login)
router.post('/login-guest', LoginGuest)

router.get('/users', ProtectRoute, ListUsers)

router.get('/user/:nametag', FetchUser)

export const UserRoutes = router 

