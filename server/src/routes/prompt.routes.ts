import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";
import {
    buyPromptController,
    createCommentController,
    createPromptController,
    deleteCommentController,
    deletePromptController,
    getAllPromptsController,
    getMyPromptsController,
    getMyPurchasesController,
    getSinglePromptController,
    likeCommentController,
    likePromptController,
    replyCommentController,
    updateCommentController,
    updatePromptController
} from "../controller/prompt.controller";


const router = Router()


// Route for get all prompts with filters options
router.get("/", verifyJWT, getAllPromptsController)
// Route for create prompt
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
// Route for get single
router.get("/:id", verifyJWT, getSinglePromptController);
// Route for update prompt
router.put("/:id", verifyJWT, updatePromptController);
// Route for delete prompt
router.delete("/:id", verifyJWT, deletePromptController);
// Route for buy prompt
router.post("/:id/buy", verifyJWT, buyPromptController);
// Route for get my purchases
router.get("/purchase-history", verifyJWT, getMyPurchasesController);



export default router