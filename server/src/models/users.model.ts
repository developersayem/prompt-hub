import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export interface ISocialLinks{
 facebook?: string
  instagram?: string
  github?: string 
  linkedIn?: string
  x?: string
  portfolio?: string
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  socialLinks?: ISocialLinks;
  credits: number;
  isGoogleAuthenticated?: boolean;
  isCertified?: boolean;
  prompt: mongoose.Schema.Types.ObjectId[];
  purchasedPrompts: mongoose.Schema.Types.ObjectId[];
  bookmarks: mongoose.Schema.Types.ObjectId[];
  refreshToken: string;

  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
  {
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
    isGoogleAuthenticated: {
      type: Boolean,
      default: false
    },
    isCertified: {
      type: Boolean,
      default: false
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
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedIn: { type: String, default: '' },
      x: { type: String, default: '' },
      portfolio: { type: String, default: '' }
    },
    credits: { 
      type: Number,
      default: 1000
    },
    prompt: [{ 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prompt'
    }],
    purchasedPrompts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prompt'
    }],
    bookmarks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prompt'
    }],
    refreshToken: {
      type: String
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  const user = this as IUser;
  if (!user.isModified('password')) return next();
  user.password = await bcrypt.hash(user.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
  const user = this as IUser;
  return await bcrypt.compare(password, user.password);
};

userSchema.methods.generateAccessToken = function (): string {
  const expiresIn = Number(process.env.JWT_ACCESS_TOKEN_EXPIRY || 3600);
  return jwt.sign(
    {
      _id: this._id,
      email: this.email
    },
    process.env.JWT_ACCESS_TOKEN_SECRET!,
    { expiresIn }
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  const expiresIn = Number(process.env.JWT_REFRESH_TOKEN_EXPIRY || 604800); // default 7d
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.JWT_REFRESH_TOKEN_SECRET!,
    { expiresIn }
  );
};

export const User = mongoose.model<IUser>('User', userSchema);
