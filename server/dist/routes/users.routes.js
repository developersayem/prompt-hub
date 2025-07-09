"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const users_controller_1 = require("../controller/users.controller");
const multer_middlewares_1 = require("../middlewares/multer.middlewares");
const auth_middlewares_1 = require("../middlewares/auth.middlewares");
const ratelimit_middlewares_1 = require("../middlewares/ratelimit.middlewares");
const router = (0, express_1.Router)();
// Route for get users
router.get("/", auth_middlewares_1.verifyJWT, users_controller_1.userController);
// Route for get current user
router.get("/me", auth_middlewares_1.verifyJWT, users_controller_1.getMeController);
// Route for register
router.route("/register").post(multer_middlewares_1.upload.fields([{ name: "avatar", maxCount: 1 }]), users_controller_1.userRegistrationController);
// Start Google OAuth
router.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
// Callback URL after Google authentication
router.get("/google/callback", passport_1.default.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/auth/login`,
    session: false,
}), async (req, res) => {
    const user = req.user;
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();
    // Set cookie
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    });
    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/success`);
});
// Route for verify user
router.post("/verify", users_controller_1.verifyUserController);
// Route for resend verification code
router.post("/resend", ratelimit_middlewares_1.sendCodeLimiter, users_controller_1.resendVerificationCodeController);
// Route for verify OTP
router.post("/verify-otp", ratelimit_middlewares_1.sendCodeLimiter, users_controller_1.verifyOTPController);
// Route for change password
router.post("/change-password", users_controller_1.changePasswordController);
// Route for reset password
router.post("/reset-password", users_controller_1.resetPasswordController);
// Route for login
router.route("/login").post(users_controller_1.loginUserController);
// Route for logout
router.route("/logout").post(auth_middlewares_1.verifyJWT, users_controller_1.logoutUser);
// Route for send 2FA code
router.post("/send-2fa", ratelimit_middlewares_1.sendCodeLimiter, auth_middlewares_1.verifyJWT, users_controller_1.send2FACodeController);
// Route for verify 2FA code
router.post("/verify-2fa", ratelimit_middlewares_1.sendCodeLimiter, users_controller_1.verifyTwoFactorCodeController);
// Route for toggle 2FA
router.post("/toggle-2fa", ratelimit_middlewares_1.sendCodeLimiter, auth_middlewares_1.verifyJWT, users_controller_1.toggleTwoFactorAuthController);
// Route for update profile
router.route("/profile").put(multer_middlewares_1.upload.fields([{ name: "avatar", maxCount: 1 }]), auth_middlewares_1.verifyJWT, users_controller_1.updateProfileController);
// Route for public profile info
router.get("/profile/basic/:userId", users_controller_1.getUserProfileController);
exports.default = router;
