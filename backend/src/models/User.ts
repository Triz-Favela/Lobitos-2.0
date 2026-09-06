import mongoose, { CallbackWithoutResultAndOptionalError, HydratedDocument, Model} from "mongoose";


export interface IUser {
    email: string
    name: string;
    tag: string;
    password: string
    foto?: string | null
    createdAt?: Date;
    updatedAt?: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
    email:{
        type: String,
        required: [true, "E-mail é obrigatório"],
        unique: true,
        trim: true
    },
    name:{
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true,
        minlength: [3, 'Nome deve ter pelo menos 3 caracteres'],
        maxlength: [20, 'Nome deve ter no máximo 20 caracteres']
    },
    tag:{
        type: String,
        trim: true,
        uppercase: true,
        minlength: 4,
        maxlength: 4
    },
    password:{
        type:String,
        required:[true, 'Senha é obrigatoria'],
        trim: true,
        minlength: [8, 'senha deve ter no minimo 8 caracteres']
    },
    foto: {
        type: String,
        required: false,
        default: null
    }
},{
    collection: 'Users',
    timestamps: true
});

function getNextTag(tagAtual: string): string {
  const numeroDecimal = parseInt(tagAtual, 36);

  const proximoDecimal = numeroDecimal + 1;
  const proximaBase36 = proximoDecimal.toString(36).toUpperCase();

  return proximaBase36.padStart(4, '0');
}

UserSchema.pre('save', async function (this: HydratedDocument<IUser>){
  
    if (!this.isNew && !this.isModified('name')) return
    const UserModel = this.constructor as Model<IUser>;

    const ultimoUsuario = await UserModel.findOne({ name: this.name })
        .sort({ tag: -1 })
        .exec();

    if (!ultimoUsuario) {
        this.tag = '0001';
    } else {
        this.tag = getNextTag(ultimoUsuario.tag);
    }
});

UserSchema.index({ name: 1, tag: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', UserSchema)