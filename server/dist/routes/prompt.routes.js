"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_middlewares_1 = require("../middlewares/multer.middlewares");
const auth_middlewares_1 = require("../middlewares/auth.middlewares");
const getClientIp_middlewares_1 = require("../middlewares/getClientIp.middlewares");
const prompt_controller_1 = require("../controller/prompt.controller");
const router = (0, express_1.Router)();
// Create prompt
router.post("/create", auth_middlewares_1.verifyJWT, multer_middlewares_1.upload.fields([{ name: "promptContent", maxCount: 1 }]), prompt_controller_1.createPromptController);
// Get all prompts with filters
router.get("/", prompt_controller_1.getAllPromptsController);
// Get aLl trending Prompts
router.get("/trending", prompt_controller_1.getTrendingPrompts);
// Get my prompts
router.get("/my-prompts", auth_middlewares_1.verifyJWT, prompt_controller_1.getMyPromptsController);
// Update prompt
router.put("/:id", auth_middlewares_1.verifyJWT, multer_middlewares_1.upload.fields([{ name: "promptContent", maxCount: 1 }]), prompt_controller_1.updatePromptController);
// Delete prompt
router.delete("/:id", auth_middlewares_1.verifyJWT, prompt_controller_1.deletePromptController);
//route to increase prompt views
router.post("/view/:id", auth_middlewares_1.verifyJWT, getClientIp_middlewares_1.extractClientIP, prompt_controller_1.increasePromptViewsController);
// Get prompt by slug (for see prompt details by share link without login)
router.get("/slug/:slug", getClientIp_middlewares_1.extractClientIP, prompt_controller_1.getPromptBySlugController);
// Get all prompt by user slug
router.get("/user/:slug", auth_middlewares_1.verifyJWT, prompt_controller_1.getAllPromptsByUserSlugController);
//  Drafts Routes
router.post("/save-draft", auth_middlewares_1.verifyJWT, multer_middlewares_1.upload.fields([{ name: "promptContent", maxCount: 1 }]), prompt_controller_1.savePromptAsDraftController);
router.get("/drafts", auth_middlewares_1.verifyJWT, prompt_controller_1.getAllMyDraftPromptsController);
router.patch("/drafts/:id/publish", auth_middlewares_1.verifyJWT, prompt_controller_1.publishPromptFromDraftsController);
// Bookmarks Routes
router.post("/bookmarks", auth_middlewares_1.verifyJWT, prompt_controller_1.savePromptAsBookmarkController);
router.get("/bookmarks", auth_middlewares_1.verifyJWT, prompt_controller_1.getAllMyBookmarkedPromptsController);
router.delete("/bookmarks/:id", auth_middlewares_1.verifyJWT, prompt_controller_1.removePromptFromBookmarksController);
// Likes Routes
router.post("/like", auth_middlewares_1.verifyJWT, prompt_controller_1.likePromptController);
router.post("/comment/like", auth_middlewares_1.verifyJWT, prompt_controller_1.likeCommentController);
// Comments Routes
router.post("/comment", auth_middlewares_1.verifyJWT, prompt_controller_1.createCommentController);
router.put("/comment/:commentId", auth_middlewares_1.verifyJWT, prompt_controller_1.updateCommentController);
router.delete("/comment/:commentId", auth_middlewares_1.verifyJWT, prompt_controller_1.deleteCommentController);
router.post("/comment/reply", auth_middlewares_1.verifyJWT, prompt_controller_1.replyCommentController);
// Purchases Routes
router.get("/purchase-history", auth_middlewares_1.verifyJWT, prompt_controller_1.getMyPurchasesController);
router.post("/:id/buy", auth_middlewares_1.verifyJWT, prompt_controller_1.buyPromptController);
// Get single prompt by ID
router.get("/:id", auth_middlewares_1.verifyJWT, prompt_controller_1.getSinglePromptController);
exports.default = router;
