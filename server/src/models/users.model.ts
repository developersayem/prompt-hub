import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken"

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  friends: mongoose.Types.ObjectId[];
  friendRequests: mongoose.Types.ObjectId[];
  online: boolean;
  lastSeen: Date;
  socketId?: string;
  refreshToken:string;

  // Add instance methods here:
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema: Schema<IUser> = new Schema({
  name: { 
    type: String,
    required: true
  },
  email: { 
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: '',
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  friends: [
    { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    }],
  friendRequests: [
    { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    }],
  online: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
    refreshToken: {
        type: String,
    },
  socketId: String,
}, { timestamps: true });



//hash password before save 
userSchema.pre("save", async function(next){
const user = this as unknown as IUser;
if(!user.isModified("password")) next()

user.password = await bcrypt.hash(user.password,10)
next();
})


// compare password
userSchema.methods.isPasswordCorrect = async function(password:string){
    const user = this as IUser;
    return await bcrypt.compare(password,user.password)
}


//generate assess token
userSchema.methods.generateAccessToken = function():string{

    const expiresIn =parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRY!, 10)

    return jwt.sign({
        _id:this._id,
        userName: this.userName,
        email: this.email
    },process.env.JWT_ACCESS_TOKEN_SECRET !,{
        expiresIn:expiresIn
    })
    
}


//generate refresh token
userSchema.methods.generateRefreshToken = function():string{
    const expiresIn =parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY!, 10)

    return jwt.sign({
        _id:this._id,
    },process.env.JWT_REFRESH_TOKEN_SECRET !,{
        expiresIn:expiresIn
    })
}

export const User =  mongoose.model<IUser>('User', userSchema);

