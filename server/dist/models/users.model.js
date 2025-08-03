"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const slugify_1 = __importDefault(require("slugify"));
const nanoid_1 = require("nanoid");
// ✨ Generate unique suffix (e.g. 8 characters)
const nanoid = (0, nanoid_1.customAlphabet)("abcdefghijklmnopqrstuvwxyz0123456789", 8);
const userSchema = new mongoose_1.Schema({
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
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "AiModel",
        },
    ],
    categories: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Category",
        },
    ],
    prompts: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Prompt",
        },
    ],
    purchasedPrompts: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Prompt",
        },
    ],
    bookmarks: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
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
}, { timestamps: true });
// Generate slug
userSchema.pre("save", function (next) {
    const user = this;
    if (!user.slug || user.isModified("name")) {
        const baseSlug = (0, slugify_1.default)(user.name, { lower: true, strict: true });
        const randomStr = nanoid();
        user.slug = `${baseSlug}-${randomStr}`; // e.g., sayem-molla-k9x7l3a1
    }
    next();
});
// Hash password
userSchema.pre("save", async function (next) {
    const user = this;
    if (!user.isModified("password"))
        return next();
    user.password = await bcrypt_1.default.hash(user.password, 10);
    next();
});
// Compare password
userSchema.methods.isPasswordCorrect = async function (password) {
    const user = this;
    return await bcrypt_1.default.compare(password, user.password);
};
// Generate access token
userSchema.methods.generateAccessToken = function () {
    const expiresIn = (process.env.JWT_ACCESS_TOKEN_EXPIRY ||
        "1h"); // e.g., '1h', '10d'
    const options = { expiresIn };
    return jsonwebtoken_1.default.sign({
        _id: this._id,
        email: this.email,
    }, process.env.JWT_ACCESS_TOKEN_SECRET, options);
};
// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
    const expiresIn = (process.env.JWT_REFRESH_TOKEN_EXPIRY ||
        "7d"); // e.g., '1h', '10d' // default 7d
    const options = { expiresIn };
    return jsonwebtoken_1.default.sign({
        _id: this._id,
    }, process.env.JWT_REFRESH_TOKEN_SECRET, options // Ensure algorithm is specified
    );
};
exports.User = mongoose_1.default.model("User", userSchema);
