import express from "express";
import { createCategoryController, deleteCategoryController, getAllCategoriesController } from "../controller/category.controller";
import { verifyJWT } from "../middlewares/auth.middlewares";

const router = express.Router();


// Route for get all categories
router.get("/", verifyJWT, getAllCategoriesController);
// Route for create category
router.post("/create", verifyJWT, createCategoryController);
// Route from delete category
router.delete("/:id", verifyJWT, deleteCategoryController);

export default router;
