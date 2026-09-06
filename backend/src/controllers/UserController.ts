import { Request, Response } from "express"
import { User } from "../models/User";
const bcrypt = require("bcrypt")
import jwt from "jsonwebtoken"
const jwt_secret = `${process.env.JWT_SECRET}`

const CreateUser = async (req: Request, res: Response) => {
    try{
        const { email, name, password } = req.body

        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({ 
                error: 'Todos os campos (nome, email, senha) são obrigatórios' 
            });
        }

        const TreatedEmail = email.trim().toLowerCase()
        const EmailExists = await User.findOne({ email: TreatedEmail });
        if (EmailExists) {
            return res.status(400).json({ 
                error: 'Este email já está em uso!' 
            });
        }

        const NameExists = await User.findOne({ nome: name.trim() });
        if (NameExists) {
            return res.status(400).json({ 
                error: 'Este nome já está em uso!' 
            });
        }

        const EncryptPass = await bcrypt.hash(password, 10)
        const CreatedUser = await User.create({
            email: TreatedEmail,
            name: name.trim(),
            password: EncryptPass
        })

        res.status(201).json({
            success: true,
            message: "Usuário criado com sucesso",
            jogador: {
                email: CreatedUser.email,
                name: CreatedUser.name,
                tag: CreatedUser.tag
            }
        })
        return
    }catch(error){
        res.status(500).json({ error })
        return
    }
}

const ListUsers = async (req: Request, res: Response ) => {
    try {
        const UserList = await User.find()
        .select('email nome dataCadastro');
        
        res.json({
            success: true,
            count: UserList.length,
            usuarios: UserList
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error});
    }
    
}

interface UserParams {
    nametag: string
    name: string
    tag: string
}

const FetchUser = async (req: Request<UserParams>, res: Response) => {
    try {
        const { nametag } = req.params;
        const [name, tag] = nametag.split(/[-#]/)

        if(!name?.trim() || !tag?.trim()){
            return res.status(404).json({ error: 'Credenciais não informadas' });
        }

        const UserFound = await User.findOne({
             name: { $regex: new RegExp(`^${name}$`, 'i')},
             tag: tag.toUpperCase() 
        });
        
        if (!UserFound) {
            return res.status(404).json({ error: 'Jogador não encontrado' });
        }
        
        return res.json({
            success: true,
            nome: UserFound.name,
            tag: UserFound.tag
        });
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Erro ao buscar' });
    }
}

const FetchUsers = async (req: Request<UserParams>, res: Response) => {
    try {
        const { name } = req.params;
        const UsersFound = await User.find({
             name: { $regex: name, $options: 'i'} 
        });
        
        if (UsersFound.length === 0) {
            return res.status(404).json({ error: 'Nenhum jogador encontrado' });
        }
        
        return res.json({
            success: true,
            users: UsersFound
        });
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Erro ao buscar' });
        
    }
}

const DeleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.json({ success: true, message: 'Jogador removido com sucesso' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Erro ao deletar' });
    }
}

const Login = async (req: Request, res: Response) => {
    try{
        const { name, tag, password } = req.body;
        const UserFound = await User.findOne({
             name: { $regex: new RegExp(`^${name}$`, 'i')},
             tag: tag.toUpperCase() 
        });
        
        if (!UserFound) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }

        const CorrectPassword = await bcrypt.compare(password, UserFound.password);

        if(CorrectPassword){
            const token = jwt.sign(
                { id: UserFound._id, name: UserFound.name, tag: UserFound.tag, logado: true }, 
                jwt_secret, 
                { expiresIn: '1h' }
            );

            return res.json({ 
                success: true,
                token,
                jogador: { id: UserFound._id, name: UserFound.name, tag: UserFound.tag } 
            });
        }

        return res.status(401).json({ error: "Credenciais inválidas" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            error: "Erro interno no servidor",
            message : error
         });
    }
}

const LoginGuest = async (req: Request, res: Response)=> {
    try {
        const { name } = req.body;

        const TempId = crypto.randomUUID()

        if(name.trim() != "") {
            const token = jwt.sign(
                { id: TempId, nome: name, tag: "GUEST", logado: false }, 
                jwt_secret, 
                { expiresIn: '1h' }
            );

            return res.json({ 
                success: true,
                token,
                jogador: { id: TempId, name, tag: "GUEST" } 
            });
        }

        return res.status(500).json({ 
            error: "Erro interno no servidor"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            error: "Erro interno no servidor",
            message : error
         });
    } 
}

export {
    CreateUser,
    ListUsers,
    FetchUser,
    FetchUsers,
    DeleteUser,
    Login,
    LoginGuest
}