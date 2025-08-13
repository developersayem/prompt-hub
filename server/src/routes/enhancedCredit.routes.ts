import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import {
  getCreditBalance,
  getTransactionHistory,
  purchaseCredits,
  getUserFraudReport,
  updateAccountFlag,
  adjustUserCredits,
  getCreditPackages
} from "../controller/enhancedCredit.controller";

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
router.get("/admin/fraud-report/:userId", getUserFraudReport);
router.post("/admin/flag-account/:userId", updateAccountFlag);
router.post("/admin/adjust", adjustUserCredits);

export default router;