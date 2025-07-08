"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_middlewares_1 = require("../middlewares/multer.middlewares");
const auth_middlewares_1 = require("../middlewares/auth.middlewares");
const prompt_controller_1 = require("../controller/prompt.controller");
const router = (0, express_1.Router)();
// Route for get all prompts with filters options
router.get("/", auth_middlewares_1.verifyJWT, prompt_controller_1.getAllPromptsController);
// Route for create prompt
router.post("/create", auth_middlewares_1.verifyJWT, multer_middlewares_1.upload.fields([{ name: "promptContent", maxCount: 1 }]), prompt_controller_1.createPromptController);
// Route for like prompt
router.post("/like", auth_middlewares_1.verifyJWT, prompt_controller_1.likePromptController);
//Route for create comment
router.post("/comment", auth_middlewares_1.verifyJWT, prompt_controller_1.createCommentController);
// Route for update comment
router.put("/comment/:commentId", auth_middlewares_1.verifyJWT, prompt_controller_1.updateCommentController);
// Route for delete comment
router.delete("/comment/:commentId", auth_middlewares_1.verifyJWT, prompt_controller_1.deleteCommentController);
// Route for replies
router.post("/comment/reply", auth_middlewares_1.verifyJWT, prompt_controller_1.replyCommentController);
//Route for like comment
router.post("/comment/like", auth_middlewares_1.verifyJWT, prompt_controller_1.likeCommentController);
// Route for my prompts
router.get("/my-prompts", auth_middlewares_1.verifyJWT, prompt_controller_1.getMyPromptsController);
// Route for get single
router.get("/:id", auth_middlewares_1.verifyJWT, prompt_controller_1.getSinglePromptController);
// Route for update prompt
router.put("/:id", multer_middlewares_1.upload.fields([{ name: "promptContent", maxCount: 1 }]), auth_middlewares_1.verifyJWT, prompt_controller_1.updatePromptController);
// Route for delete prompt
router.delete("/:id", auth_middlewares_1.verifyJWT, prompt_controller_1.deletePromptController);
// Route for buy prompt
router.post("/:id/buy", auth_middlewares_1.verifyJWT, prompt_controller_1.buyPromptController);
// Route for get my purchases
router.get("/purchase-history", auth_middlewares_1.verifyJWT, prompt_controller_1.getMyPurchasesController);
exports.default = router;
