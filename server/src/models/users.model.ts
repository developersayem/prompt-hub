import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import slugify from "slugify";
import { customAlphabet } from "nanoid";

// Generate unique suffix (e.g. 8 characters)
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

export interface ISocialLinks {
  facebook?: string;
  instagram?: string;
  github?: string;
  linkedIn?: string;
  x?: string;
  portfolio?: string;
}

export interface IAddress {
  street: String;
  city: String;
  state: String;
  postalCode: String;
  country: String;
}

export interface IUser extends Document {
  name: string;
  slug: string;
  title:string;
  email: string;
  publicEmail?: string;
  password: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  verificationCode: string;
  verificationCodeExpires: Date | null;
  lastVerificationSentAt: Date | null;
  socialLinks?: ISocialLinks;
  credits: number;
  isGoogleAuthenticated?: boolean;
  isCertified?: boolean;
  isEmailNotificationEnabled: boolean;
  isPushNotificationEnabled: boolean;
  isMarketingNotificationEnabled: boolean;
  // isDeleted: boolean;
  // deletedAt: Date | null;
  prompts: mongoose.Schema.Types.ObjectId[];
  purchasedPrompts: mongoose.Schema.Types.ObjectId[];
  bookmarks: mongoose.Schema.Types.ObjectId[];
  address: IAddress;
  phone: string;
  countryCode: string;
  publicPhone?: string;
  publicCountryCode?: string;
  refreshToken: string;
  isTwoFactorEnabled: boolean;
  twoFactorCode: string;
  twoFactorCodeExpires: Date | null;
  aiModels: mongoose.Schema.Types.ObjectId[];
  categories: mongoose.Schema.Types.ObjectId[];
  dndStart: string;
  dndEnd: string;
  loginAlerts: boolean;
  passwordChangeAlerts: boolean;
  twoFactorAlerts: boolean;
  inAppSound: boolean;
  doNotDisturb: boolean;
  createdAt: Date;
  updatedAt: Date;

  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    title: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    publicEmail: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: function () {
        return !this.isGoogleAuthenticated;
      },
    },
    isGoogleAuthenticated: {
      type: Boolean,
      default: false,
    },
    isCertified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: "",
      required: false, 
    },
    bio: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // existing fields...
  isEmailNotificationEnabled: { type: Boolean, default: true },
  isPushNotificationEnabled: { type: Boolean, default: true },
  isMarketingNotificationEnabled: { type: Boolean, default: false },

  loginAlerts: { type: Boolean, default: true },
  passwordChangeAlerts: { type: Boolean, default: true },
  twoFactorAlerts: { type: Boolean, default: true },

  inAppSound: { type: Boolean, default: true },
  doNotDisturb: { type: Boolean, default: false },
  dndStart: { type: String, default: "22:00" },
  dndEnd: { type: String, default: "07:00" },
    verificationCode: {
      type: String,
      default: "",
    },
    verificationCodeExpires: {
      type: Date,
      default: null,
    },
    // isDeleted: { type: Boolean, default: false, index: true },
    // deletedAt: { type: Date, default: null },
    isTwoFactorEnabled: { type: Boolean, default: false },
    twoFactorCode: { type: String },
    twoFactorCodeExpires: { type: Date },
    lastVerificationSentAt: { type: Date, default: null },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      github: { type: String, default: "" },
      linkedIn: { type: String, default: "" },
      x: { type: String, default: "" },
      portfolio: { type: String, default: "" },
    },
    credits: {
      type: Number,
      default: 1000,
    },
    aiModels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AiModel",
      },
    ],
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    prompts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Prompt",
      },
    ],
    purchasedPrompts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Prompt",
      },
    ],
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Prompt",
      },
    ],
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "" },
    },
    phone: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);
// Generate slug before validation
userSchema.pre("validate", async function (next) {
  const user = this as IUser;

  // Only generate slug if it's not already set or if name has changed
  if (!user.slug || user.isModified("name")) {
    try {
      const baseSlug = slugify(user.name, { lower: true, strict: true });
      const randomStr = nanoid();
      const newSlug = `${baseSlug}-${randomStr}`;
      
      // Check for uniqueness (though very unlikely with nanoid)
      const existingUser = await mongoose.model<IUser>("User").findOne({ 
        slug: newSlug, 
        _id: { $ne: user._id } 
      });
      
      if (existingUser) {
        // Generate another random string if collision occurs
        const anotherRandomStr = nanoid();
        user.slug = `${baseSlug}-${anotherRandomStr}`;
      } else {
        user.slug = newSlug;
      }
    } catch (error) {
      console.error("Error generating slug:", error);
      // Fallback slug generation
      const fallbackSlug = `user-${nanoid()}`;
      user.slug = fallbackSlug;
    }
  }

  next();
});
// Hash password
userSchema.pre("save", async function (next) {
  const user = this as IUser;
  if (!user.isModified("password")) return next();
  user.password = await bcrypt.hash(user.password, 10);
  next();
});
// Compare password
userSchema.methods.isPasswordCorrect = async function (password: string) {
  const user = this as IUser;
  return await bcrypt.compare(password, user.password);
};
// Generate access token
userSchema.methods.generateAccessToken = function (): string {
  const expiresIn = (process.env.JWT_ACCESS_TOKEN_EXPIRY ||
    "1h") as `${number}${"s" | "m" | "h" | "d"}`; // e.g., '1h', '10d'
  const options: SignOptions = { expiresIn };

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.JWT_ACCESS_TOKEN_SECRET as string,
    options
  );
};
// Generate refresh token
userSchema.methods.generateRefreshToken = function (): string {
  const expiresIn = (process.env.JWT_REFRESH_TOKEN_EXPIRY ||
    "7d") as `${number}${"s" | "m" | "h" | "d"}`; // e.g., '1h', '10d' // default 7d
  const options: SignOptions = { expiresIn };
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_REFRESH_TOKEN_SECRET!,
    options // Ensure algorithm is specified
  );
};

export const User = mongoose.model<IUser>("User", userSchema);
