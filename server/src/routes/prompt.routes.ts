import { Router } from "express";

import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { createPromptController, getAllPromptsController, likePromptController } from "../controller/prompt.controller";


const router = Router()
//get all prompts
router.get("/", verifyJWT, getAllPromptsController)


// Prompt Creation Routes
router.post("/create",
    verifyJWT,
    upload.fields([{ name: "promptContent", maxCount: 1 }]),
    createPromptController
);

// prompt like route
router.post("/like", verifyJWT,likePromptController)



export default router