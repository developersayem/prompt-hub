import { Router } from "express";

import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { createCommentController, createPromptController, deleteCommentController, getAllPromptsController, getMyPromptsController, getSinglePromptController, likeCommentController, likePromptController, replyCommentController, updateCommentController } from "../controller/prompt.controller";


const router = Router()


// Get all prompts
router.get("/", verifyJWT, getAllPromptsController)
// Prompt Creation Routes
router.post("/create",
    verifyJWT,
    upload.fields([{ name: "promptContent", maxCount: 1 }]),
    createPromptController
);
// Route for like prompt
router.post("/like", verifyJWT,likePromptController)
//Route for create comment
router.post("/comment", verifyJWT, createCommentController)
// Route for update comment
router.put("/comment/:commentId", verifyJWT, updateCommentController);
// Route for delete comment
router.delete("/comment/:commentId", verifyJWT, deleteCommentController);
// Route for replies
router.post("/comment/reply", verifyJWT, replyCommentController);
//Route for like comment
router.post("/comment/like", verifyJWT, likeCommentController);
// Route for my prompts
router.get("/my-prompts", verifyJWT, getMyPromptsController)
// Route to get single
router.get("/:id", verifyJWT, getSinglePromptController);



export default router