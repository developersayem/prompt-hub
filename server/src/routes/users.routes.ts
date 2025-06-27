import { Router } from "express";
import { userRegistrationController, googleOAuthCallbackController, loginUserController, logoutUser } from "../controller/users.controller";
import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";
import passport from "passport";



const router = Router()

router.route("/register").post(
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    userRegistrationController)

    // Start Google Auth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Handle Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleOAuthCallbackController
);

router.route("/login").post(
    loginUserController
)

router.route("/logout").post(verifyJWT, logoutUser)

export default router