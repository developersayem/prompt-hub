import { Router } from "express";
import { userRegistrationController, googleOAuthCallbackController, loginUserController, logoutUser, userController } from "../controller/users.controller";
import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";
import passport from "passport";




const router = Router()

// users.routes.ts
router.get("/", verifyJWT, userController);

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
  passport.authenticate("google", { failureRedirect: "/auth/login" }),
  googleOAuthCallbackController
);

router.route("/auth/login").post(
    loginUserController
)

router.route("/logout").post(verifyJWT, logoutUser)

export default router