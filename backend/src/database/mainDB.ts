import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()

const ConnectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('A variável MONGODB_URI não foi definida no arquivo .env');
        }

        await mongoose.connect(mongoURI,{
            user: process.env.DB_USER,
            pass: process.env.DB_PASS,
            authSource: 'admin'
        });
        console.log(' MongoDB conectado com sucesso!');
        console.log(` Banco: ${mongoURI}`);
    } catch (error) {
        console.error(' Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

export {ConnectDB}