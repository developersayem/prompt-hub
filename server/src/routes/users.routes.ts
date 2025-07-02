import { Router } from "express";
import { userRegistrationController, googleOAuthCallbackController, loginUserController, logoutUser, userController, updateProfileController, getUserProfileController } from "../controller/users.controller";
import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";
import passport from "passport";




const router = Router()

// Route for get users
router.get("/", verifyJWT, userController);

// Route for register
router.route("/register").post(
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    userRegistrationController)

// Route for start Google Auth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Route for handle Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/login" }),
  googleOAuthCallbackController
);

// Route for login
router.route("/login").post(
    loginUserController
)
// Route for logout
router.route("/logout").post(verifyJWT, logoutUser)

// Route for update profile
router.route("/profile").put(
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    verifyJWT,
    updateProfileController)

// Route for public profile info
router.get("/profile/basic/:userId", getUserProfileController);

export default router