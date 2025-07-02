"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("../controller/users.controller");
const multer_middlewares_1 = require("../middlewares/multer.middlewares");
const auth_middlewares_1 = require("../middlewares/auth.middlewares");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
// Route for get users
router.get("/", auth_middlewares_1.verifyJWT, users_controller_1.userController);
// Route for register
router.route("/register").post(multer_middlewares_1.upload.fields([{ name: "avatar", maxCount: 1 }]), users_controller_1.userRegistrationController);
// Route for start Google Auth
router.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
// Route for handle Google callback
router.get("/google/callback", passport_1.default.authenticate("google", { failureRedirect: "/auth/login" }), users_controller_1.googleOAuthCallbackController);
// Route for login
router.route("/login").post(users_controller_1.loginUserController);
// Route for logout
router.route("/logout").post(auth_middlewares_1.verifyJWT, users_controller_1.logoutUser);
// Route for update profile
router.route("/profile").put(multer_middlewares_1.upload.fields([{ name: "avatar", maxCount: 1 }]), auth_middlewares_1.verifyJWT, users_controller_1.updateProfileController);
// Route for public profile info
router.get("/profile/basic/:userId", users_controller_1.getUserProfileController);
exports.default = router;
