import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { EnhancedCreditService } from "../services/enhancedCredit.service";
import { FraudDetectionService } from "../services/fraudDetection.service";
import { CreditService } from "../services/credit.service";
import { TransactionType } from "../models/creditTransaction.model";

// Get user's credit balance and stats with fraud info
const getCreditBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  
  const [stats, fraudReport] = await Promise.all([
    CreditService.getCreditStats(userId),
    FraudDetectionService.getFraudReport(userId)
  ]);
  
  return res.status(200).json(
    new ApiResponse(200, {
      ...stats,
      riskLevel: fraudReport?.riskLevel || 'low',
      isFlagged: fraudReport?.isFlagged || false
    }, "Credit balance fetched successfully")
  );
});

// Get credit transaction history
const getTransactionHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const { page = 1, limit = 20, type } = req.query;
  
  const history = await CreditService.getTransactionHistory(
    userId,
    parseInt(page as string),
    parseInt(limit as string),
    type as TransactionType
  );
  
  return res.status(200).json(
    new ApiResponse(200, history, "Transaction history fetched successfully")
  );
});

// Purchase credits with enhanced verification
const purchaseCredits = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const { packageId, paymentIntentId } = req.body;
  
  // Define credit packages
  const packages = {
    starter: { credits: 500, price: 3.99 },
    professional: { credits: 1500, price: 6.99 },
    unlimited: { credits: -1, price: 9.99, duration: 30 } // -1 indicates unlimited for 30 days
  };
  
  const selectedPackage = packages[packageId as keyof typeof packages];
  if (!selectedPackage) {
    throw new ApiError(400, "Invalid package selected");
  }
  
  // TODO: Verify payment with Stripe using paymentIntentId
  // For now, we'll simulate successful payment
  
  try {
    // Handle unlimited package differently
    if (packageId === 'unlimited') {
      // For unlimited package, we'll add a large number of credits with expiration
      const unlimitedCredits = 999999; // Large number to simulate unlimited
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now
      
      const result = await EnhancedCreditService.purchaseCredits(
        userId,
        unlimitedCredits,
        packageId,
        paymentIntentId,
        { 
          price: selectedPackage.price,
          ip: FraudDetectionService.getClientIP(req),
          deviceFingerprint: FraudDetectionService.generateDeviceFingerprint(req),
          unlimited: true,
          duration: 30,
          expiresAt: expirationDate
        }
      );
      
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            newBalance: result.user.credits,
            creditsAdded: "Unlimited (30 days)",
            transaction: result.transaction,
            expiresAt: expirationDate
          },
          "Unlimited credits purchased successfully"
        )
      );
    } else {
      // Handle regular credit packages
      const result = await EnhancedCreditService.purchaseCredits(
        userId,
        selectedPackage.credits,
        packageId,
        paymentIntentId,
        { 
          price: selectedPackage.price,
          ip: FraudDetectionService.getClientIP(req),
          deviceFingerprint: FraudDetectionService.generateDeviceFingerprint(req)
        }
      );
      
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            newBalance: result.user.credits,
            creditsAdded: selectedPackage.credits,
            transaction: result.transaction
          },
          "Credits purchased successfully"
        )
      );
    }
  } catch (error) {
    throw new ApiError(500, "Failed to process credit purchase");
  }
});

// Admin: Get fraud report for user
const getUserFraudReport = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  // TODO: Add admin role check middleware
  
  const fraudReport = await FraudDetectionService.getFraudReport(userId);
  
  if (!fraudReport) {
    throw new ApiError(404, "Fraud report not found");
  }
  
  return res.status(200).json(
    new ApiResponse(200, fraudReport, "Fraud report fetched successfully")
  );
});

// Admin: Flag/unflag user account
const updateAccountFlag = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { isFlagged, reason } = req.body;
  
  // TODO: Add admin role check middleware
  
  await FraudDetectionService.updateAccountFlag(userId, isFlagged, reason);
  
  return res.status(200).json(
    new ApiResponse(200, {}, `Account ${isFlagged ? 'flagged' : 'unflagged'} successfully`)
  );
});

// Admin: Adjust user credits
const adjustUserCredits = asyncHandler(async (req: Request, res: Response) => {
  const { userId, amount, reason } = req.body;
  const adminId = (req as any).user?._id;
  
  // TODO: Add admin role check middleware
  
  if (!userId || !amount || !reason) {
    throw new ApiError(400, "User ID, amount, and reason are required");
  }
  
  try {
    const result = amount > 0 
      ? await CreditService.addCredits(
          userId,
          Math.abs(amount),
          "admin_adjustment",
          `Admin adjustment: ${reason}`,
          { adminUserId: adminId, reason }
        )
      : await CreditService.deductCredits(
          userId,
          Math.abs(amount),
          "admin_adjustment",
          `Admin adjustment: ${reason}`,
          { adminUserId: adminId, reason }
        );
    
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          newBalance: result.user.credits,
          adjustment: amount,
          transaction: result.transaction
        },
        "User credits adjusted successfully"
      )
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to adjust user credits");
  }
});

// Get credit packages for purchase
const getCreditPackages = asyncHandler(async (req: Request, res: Response) => {
  const packages = [
    {
      id: "starter",
      name: "Starter Pack",
      credits: 500,
      price: 3.99,
      popular: false,
      features: ["500 Credits", "Basic Support", "30 Days Validity"]
    },
    {
      id: "professional", 
      name: "Professional",
      credits: 1500,
      price: 6.99,
      popular: true,
      features: ["1,500 Credits", "Priority Support", "60 Days Validity", "Bonus Features"]
    },
    {
      id: "unlimited",
      name: "Unlimited", 
      credits: -1, // Unlimited credits
      price: 9.99,
      popular: false,
      duration: 30, // 30 days
      features: ["Unlimited Credits", "24/7 Support", "30 Days Duration", "Premium Features", "API Access"]
    }
  ];
  
  return res.status(200).json(
    new ApiResponse(200, packages, "Credit packages fetched successfully")
  );
});

export {
  getCreditBalance,
  getTransactionHistory,
  purchaseCredits,
  getUserFraudReport,
  updateAccountFlag,
  adjustUserCredits,
  getCreditPackages
};