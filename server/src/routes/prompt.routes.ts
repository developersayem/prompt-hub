import { Router } from "express";

import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { createPromptController } from "../controller/prompt.controller";


const router = Router()

// Prompt Routes
//TODO! verifyJWT
router.post("/create",
    verifyJWT,
    upload.fields([{ name: "promptContent", maxCount: 1 }]),
    createPromptController
);



export default router