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
exports.Prompt = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const slugify_1 = __importDefault(require("slugify"));
const nanoid_1 = require("nanoid");
const users_model_1 = require("./users.model");
// Nanoid setup for 8-character random string
const nanoid = (0, nanoid_1.customAlphabet)("abcdefghijklmnopqrstuvwxyz1234567890", 8);
const promptSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String },
    tags: { type: [String], required: true },
    category: { type: String, required: true },
    promptText: { type: String, required: true },
    resultType: {
        type: String,
        enum: ["text", "image", "video"],
        required: true,
    },
    resultContent: { type: String, required: true },
    aiModel: { type: String, required: true },
    price: { type: Number },
    paymentStatus: {
        type: String,
        enum: ["free", "paid"],
        required: true,
        default: "free",
    },
    isDraft: { type: Boolean, default: false },
    creator: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Like" }],
    comments: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Comment" }],
    views: { type: Number, default: 0 },
    viewedBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    viewedIPs: [{ type: String }],
    purchasedBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    shareCount: { type: Number, default: 0 },
    sharedBy: {
        users: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: [] }],
        ips: { type: [String], default: [] },
    },
    slug: {
        type: String,
        unique: true,
    },
    isPublic: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });
// 🔁 Pre-save hook to generate unique slug using nanoid
promptSchema.pre("save", function (next) {
    if (!this.slug || this.isModified("title")) {
        const baseSlug = (0, slugify_1.default)(this.title, { lower: true, strict: true });
        const randomStr = nanoid();
        this.slug = `${baseSlug}-${randomStr}`; // e.g. cool-title-3k7x9ab1
    }
    next();
});
// 🔁 Post-save hook to add prompt to user's prompts
promptSchema.post("save", async function (doc, next) {
    try {
        if (doc.creator) {
            await users_model_1.User.updateOne({ _id: doc.creator }, { $addToSet: { prompts: doc._id } });
        }
        next();
    }
    catch (error) {
        if (error instanceof Error) {
            next(error);
        }
        else {
            next();
        }
    }
});
exports.Prompt = mongoose_1.default.model("Prompt", promptSchema);
