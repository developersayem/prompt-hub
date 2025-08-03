import express from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { reportLimiter } from "../middlewares/reportRateLimit";
import { reportPostController } from "../controller/report.controller";

const router = express.Router();

// Route for create report
router.post("/", verifyJWT, reportLimiter, reportPostController);

export default router;
