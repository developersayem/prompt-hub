import { Router } from "express";

import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { createPromptController } from "../controller/prompt.controller";


const router = Router()

// Prompt Creation Routes
router.post("/create",
    verifyJWT,
    upload.fields([{ name: "promptContent", maxCount: 1 }]),
    createPromptController
);

// prompt like route
router.post("/like", verifyJWT,)



export default router