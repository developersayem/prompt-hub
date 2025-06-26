import { Router } from "express";
import { userRegistrationController,loginUserController, logoutUser } from "../controller/users.controller";
import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";



const router = Router()

router.route("/register").post(
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    userRegistrationController)

router.route("/login").post(
    loginUserController
)

router.route("/logout").post(verifyJWT, logoutUser)

export default router