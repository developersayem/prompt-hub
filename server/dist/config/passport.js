"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const users_model_1 = require("../models/users.model");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: "./.env" });
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID, // set in .env
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/v1/users/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const existingUser = await users_model_1.User.findOne({ email: profile.emails?.[0].value });
        if (existingUser) {
            return done(null, existingUser);
        }
        const newUser = await users_model_1.User.create({
            name: profile.displayName,
            email: profile.emails?.[0].value,
            avatar: profile.photos?.[0].value || "",
            password: "", // no password required
            isGoogleAuthenticated: true,
            isVerified: true,
        });
        return done(null, newUser);
    }
    catch (error) {
        return done(error, false);
    }
}));
passport_1.default.serializeUser((user, done) => {
    done(null, user._id);
});
passport_1.default.deserializeUser(async (id, done) => {
    const user = await users_model_1.User.findById(id);
    done(null, user);
});
