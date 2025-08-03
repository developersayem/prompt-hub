import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { extractClientIP } from "../middlewares/getClientIp.middlewares";

import {
  createPromptController,
  getAllPromptsController,
  getMyPromptsController,
  getSinglePromptController,
  getPromptBySlugController,
  updatePromptController,
  deletePromptController,
  likePromptController,
  savePromptAsDraftController,
  getAllMyDraftPromptsController,
  publishPromptFromDraftsController,
  savePromptAsBookmarkController,
  getAllMyBookmarkedPromptsController,
  removePromptFromBookmarksController,
  createCommentController,
  updateCommentController,
  deleteCommentController,
  replyCommentController,
  likeCommentController,
  getMyPurchasesController,
  buyPromptController,
  getTrendingPrompts,
  increasePromptViewsController,
  getAllPromptsByUserSlugController
} from "../controller/prompt.controller";

const router = Router();

// Create prompt
router.post(
  "/create",
  verifyJWT,
  upload.fields([{ name: "promptContent", maxCount: 1 }]),
  createPromptController
);

// Get all prompts with filters
router.get("/", getAllPromptsController);

// Get aLl trending Prompts
router.get("/trending", getTrendingPrompts);

// Get my prompts
router.get("/my-prompts", verifyJWT, getMyPromptsController);



// Update prompt
router.put(
  "/:id",
  verifyJWT,
  upload.fields([{ name: "promptContent", maxCount: 1 }]),
  updatePromptController
);

// Delete prompt
router.delete("/:id", verifyJWT, deletePromptController);

//route to increase prompt views
router.post("/view/:id", verifyJWT,extractClientIP, increasePromptViewsController);

// Get prompt by slug (for see prompt details by share link without login)
router.get("/slug/:slug", extractClientIP, getPromptBySlugController);
// Get all prompt by user slug
router.get("/user/:slug",verifyJWT, getAllPromptsByUserSlugController);


//  Drafts Routes
router.post(
  "/save-draft",
  verifyJWT,
  upload.fields([{ name: "promptContent", maxCount: 1 }]),
  savePromptAsDraftController
);
router.get("/drafts", verifyJWT, getAllMyDraftPromptsController);
router.patch("/drafts/:id/publish", verifyJWT, publishPromptFromDraftsController);

// Bookmarks Routes
router.post("/bookmarks", verifyJWT, savePromptAsBookmarkController);
router.get("/bookmarks", verifyJWT, getAllMyBookmarkedPromptsController);
router.delete("/bookmarks/:id", verifyJWT, removePromptFromBookmarksController);

// Likes Routes
router.post("/like", verifyJWT, likePromptController);
router.post("/comment/like", verifyJWT, likeCommentController);

// Comments Routes
router.post("/comment", verifyJWT, createCommentController);
router.put("/comment/:commentId", verifyJWT, updateCommentController);
router.delete("/comment/:commentId", verifyJWT, deleteCommentController);
router.post("/comment/reply", verifyJWT, replyCommentController);

// Purchases Routes
router.get("/purchase-history", verifyJWT, getMyPurchasesController);
router.post("/:id/buy", verifyJWT, buyPromptController);

// Get single prompt by ID
router.get("/:id", verifyJWT, getSinglePromptController);
export default router;
