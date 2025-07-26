import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { extractClientIP } from './../middlewares/getClientIp.middlewares';
import {
    buyPromptController,
    createCommentController,
    createPromptController,
    deleteCommentController,
    deletePromptController,
    getAllPromptsController,
    getMyPromptsController,
    getMyPurchasesController,
    getPromptBySlugController,
    getSinglePromptController,
    likeCommentController,
    likePromptController,
    replyCommentController,
    savePromptAsBookmarkController,
    savePromptAsDraftController,
    updateCommentController,
    updatePromptController,
    getAllMyDraftPromptsController,
    getAllMyBookmarkedPromptsController,
    removePromptFromBookmarksController,
    publishPromptFromDraftsController
} from "../controller/prompt.controller";

const router = Router();

// Route for get all prompts with filters options
router.get("/", getAllPromptsController);

// Route for create prompt
router.post("/create",
    verifyJWT,
    upload.fields([{ name: "promptContent", maxCount: 1 }]),
    createPromptController
);

// Route for like prompt
router.post("/like", verifyJWT, likePromptController);

// Route for comment actions
router.post("/comment", verifyJWT, createCommentController);
router.put("/comment/:commentId", verifyJWT, updateCommentController);
router.delete("/comment/:commentId", verifyJWT, deleteCommentController);
router.post("/comment/reply", verifyJWT, replyCommentController);
router.post("/comment/like", verifyJWT, likeCommentController);

// Route for user's prompts
router.get("/my-prompts", verifyJWT, getMyPromptsController);
router.post("/save-draft", verifyJWT, upload.fields([{ name: "promptContent", maxCount: 1 }]), savePromptAsDraftController);
router.get("/drafts", verifyJWT, getAllMyDraftPromptsController);
router.patch("/drafts/:id/publish", verifyJWT, publishPromptFromDraftsController); 
router.get("/purchase-history", verifyJWT, getMyPurchasesController);

// Route for prompt actions

router.post("/bookmarks", verifyJWT, savePromptAsBookmarkController);
router.get("/bookmarks", verifyJWT, getAllMyBookmarkedPromptsController);
router.delete("/bookmarks/:id", verifyJWT, removePromptFromBookmarksController);

// Dynamic routes last
router.get("/:id", verifyJWT, getSinglePromptController);
router.put("/:id", upload.fields([{ name: "promptContent", maxCount: 1 }]), verifyJWT, updatePromptController);
router.delete("/:id", verifyJWT, deletePromptController);
router.post("/:id/buy", verifyJWT, buyPromptController);


// Route for slug-based prompt
router.get("/slug/:slug", extractClientIP, getPromptBySlugController);

export default router;
