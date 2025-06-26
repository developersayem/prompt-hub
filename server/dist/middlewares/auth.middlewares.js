"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ApiError_1 = require("../utils/ApiError");
const users_model_1 = require("../models/users.model");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
exports.verifyJWT = (0, asyncHandler_1.default)(async (req, _, next) => {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        throw new ApiError_1.ApiError(401, "Unauthorized - No token provided");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await users_model_1.User.findById(decoded._id).select("-password -refreshToken");
        if (!user)
            throw new ApiError_1.ApiError(401, "Unauthorized - User not found");
        req.user = user;
        next();
    }
    catch (error) {
        console.error("JWT verification error:", error);
        throw new ApiError_1.ApiError(401, error.message || "Invalid access token");
    }
});
