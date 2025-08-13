import type{ Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
import { CreditService } from "../services/credit.service";
import { TransactionType } from "../models/creditTransaction.model";

// Get user's credit balance and stats
const getCreditBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  
  const stats = await CreditService.getCreditStats(userId as string);
  
  return res.status(200).json(
    new ApiResponse(200, stats, "Credit balance fetched successfully")
  );
});

// Get credit transaction history
const getTransactionHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const { page = 1, limit = 20, type } = req.query;
  
  const history = await CreditService.getTransactionHistory(
    userId as string,
    parseInt(page as string),
    parseInt(limit as string),
    type as TransactionType
  );
  
  return res.status(200).json(
    new ApiResponse(200, history, "Transaction history fetched successfully")
  );
});


// Purchase credits (this would integrate with payment processor)
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
      
      const result = await CreditService.addCredits(
        userId as string,
        unlimitedCredits,
        "buy_credits",
        `Purchased unlimited credits - ${packageId} package (30 days)`,
        { 
          packageId, 
          paymentIntentId,
          price: selectedPackage.price,
          unlimited: true,
          duration: 30
        },
        expirationDate
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
      const result = await CreditService.addCredits(
        userId as string,
        selectedPackage.credits,
        "buy_credits",
        `Purchased ${selectedPackage.credits} credits - ${packageId} package`,
        { 
          packageId, 
          paymentIntentId,
          price: selectedPackage.price
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
          userId as string,
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
  adjustUserCredits,
  getCreditPackages
};