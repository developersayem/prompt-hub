import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import {
  getCreditBalance,
  getTransactionHistory,
  purchaseCredits,
  adjustUserCredits,
  getCreditPackages
} from "../controller/credit.controller";

const router = Router();

// Public routes
router.get("/packages", getCreditPackages);

// Protected routes
router.use(verifyJWT); // Apply JWT verification to all routes below

// User credit operations
router.get("/balance", getCreditBalance);
router.get("/transactions", getTransactionHistory);
router.post("/purchase", purchaseCredits);

// Admin routes (TODO: Add admin middleware)
router.post("/admin/adjust", adjustUserCredits);

export default router;