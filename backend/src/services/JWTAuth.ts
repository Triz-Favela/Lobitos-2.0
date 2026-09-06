import { NextFunction, Request, Response } from "express"
import jwt from 'jsonwebtoken';
const jwt_secret = `${process.env.JWT_SECRET}`

export const ProtectRoute = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Token malformado' });
    }
    const token = parts[1];

    jwt.verify(token!, jwt_secret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ 
                error: 'Token inválido ou expirado',
                message: err
            });
        }
        (req as any).user = decoded;

        return next();
    });
};
