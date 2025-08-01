import { Router } from "express";
import passport from "passport";
import { userRegistrationController, loginUserController, logoutUser, userController, updateProfileController, getUserProfileController, verifyUserController, resendVerificationCodeController, changePasswordController, verifyOTPController, resetPasswordController, verifyTwoFactorCodeController, toggleTwoFactorAuthController, send2FACodeController, getMeController, setPasswordController } from "../controller/users.controller";
import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { sendCodeLimiter } from "../middlewares/ratelimit.middlewares";
import { cookieOptions } from "../utils/cookieOptions";
import { getGeoLocationFromIP } from "../utils/ipGeolocation";
import { ConnectedDevice } from "../models/connected-device.model";
import { extractClientDevice } from "../middlewares/extractClientDevice";
import { trackConnectedDevice } from "../utils/trackConnectedDevice";


const router = Router()

// Route for get users
router.get("/", verifyJWT, userController);
// Route for get current user
router.get("/me", verifyJWT, getMeController);
// Route for register
router.route("/register").post(
    userRegistrationController
)
// Start Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
// Callback URL after Google authentication
router.get(
  "/google/callback",
  extractClientDevice,
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/auth/login`,
    session: false,
  }),
  async (req, res) => {
    const user = req.user as any;

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    // Set cookie
    res.cookie("accessToken", accessToken, cookieOptions);

    res.cookie("refreshToken", refreshToken, cookieOptions);
    // Track current device login info
    await trackConnectedDevice(user._id, req);
    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/success`);
  }
);
// Route for verify user
router.post("/verify", extractClientDevice, verifyUserController);
// Route for resend verification code
router.post("/resend", sendCodeLimiter, resendVerificationCodeController);
// Route for verify OTP
router.post("/verify-otp", sendCodeLimiter, verifyOTPController);
// Route for change password
router.post("/change-password", changePasswordController);
// Route for change password
router.post("/set-password", verifyJWT, setPasswordController);
// Route for reset password
router.post("/reset-password", resetPasswordController);
// Route for login
router.post("/login",extractClientDevice,loginUserController);
// Route for logout
router.post("/logout",verifyJWT, logoutUser);
// Route for send 2FA code
router.post("/send-2fa", sendCodeLimiter, verifyJWT, send2FACodeController);
// Route for verify 2FA code
router.post("/verify-2fa", sendCodeLimiter, verifyTwoFactorCodeController);
// Route for toggle 2FA
router.post("/toggle-2fa", sendCodeLimiter, verifyJWT, toggleTwoFactorAuthController);
// Route for update profile
router.put("/profile",
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    verifyJWT,
    updateProfileController
);
// Route for public profile info
router.get("/profile/:slug", verifyJWT, getUserProfileController);
// Route from toggle notification settings on/off

export default router