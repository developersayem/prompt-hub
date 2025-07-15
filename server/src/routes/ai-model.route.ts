import express from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { createAiModelController, deleteAiModelController, getAllAiModelsController } from "../controller/ai-model.controller";

const router = express.Router();


// Route for get all categories
router.get("/", verifyJWT, getAllAiModelsController);
// Route for create category
router.post("/create", verifyJWT, createAiModelController);
// Route from delete category
router.delete("/:id", verifyJWT, deleteAiModelController);

export default router;
