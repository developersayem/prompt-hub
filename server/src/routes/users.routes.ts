import { Router } from "express";
import passport from "passport";
import { userRegistrationController, loginUserController, logoutUser, userController, updateProfileController, getUserProfileController, verifyUserController, resendVerificationCodeController, changePasswordController, verifyOTPController, resetPasswordController, verifyTwoFactorCodeController, toggleTwoFactorAuthController, send2FACodeController } from "../controller/users.controller";
import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { sendCodeLimiter } from "../middlewares/ratelimit.middlewares";




const router = Router()

// Route for get users
router.get("/", verifyJWT, userController);

// Route for register
router.route("/register").post(
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    userRegistrationController)

// Route for verify user
router.post("/verify", verifyUserController);
// Route for resend verification code
router.post("/resend", sendCodeLimiter, resendVerificationCodeController);
// Route for verify OTP
router.post("/verify-otp", sendCodeLimiter, verifyOTPController);
// Route for change password
router.post("/change-password", changePasswordController);
// Route for reset password
router.post("/reset-password", resetPasswordController);
// Route for login
router.route("/login").post(loginUserController);
// Route for logout
router.route("/logout").post(verifyJWT, logoutUser);
// Route for send 2FA code
router.post("/send-2fa", sendCodeLimiter, verifyJWT, send2FACodeController);
// Route for verify 2FA code
router.post("/verify-2fa", sendCodeLimiter, verifyJWT, verifyTwoFactorCodeController);
// Route for toggle 2FA
router.post("/toggle-2fa", sendCodeLimiter, verifyJWT, toggleTwoFactorAuthController);

// Route for update profile
router.route("/profile").put(
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    verifyJWT,
    updateProfileController
);
// Route for public profile info
router.get("/profile/basic/:userId", getUserProfileController);

export default router