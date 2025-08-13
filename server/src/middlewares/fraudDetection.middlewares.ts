import { Request, Response, NextFunction } from "express";
import { FraudDetectionService } from "../services/fraudDetection.service";
import { ApiError } from "../utils/ApiError";

/**
 * Middleware to track user login and update fraud detection
 */
export const trackUserActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    
    if (userId) {
      // Update fraud detection with new login info
      await FraudDetectionService.updateOnLogin(userId, req);
    }
    
    next();
  } catch (error) {
    console.error("Error tracking user activity:", error);
    // Don't fail the request if tracking fails
    next();
  }
};

/**
 * Middleware to check if user account is flagged
 */
export const checkAccountFlag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    
    if (!userId) {
      return next();
    }
    
    const fraudReport = await FraudDetectionService.getFraudReport(userId);
    
    if (fraudReport?.isFlagged) {
      throw new ApiError(403, `Account suspended: ${fraudReport.flaggedReason || 'Suspicious activity detected'}`);
    }
    
    // Add risk level to request for other middlewares/controllers to use
    (req as any).riskLevel = fraudReport?.riskLevel || 'low';
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to rate limit high-risk accounts
 */
export const riskBasedRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?._id;
    const riskLevel = (req as any).riskLevel;
    
    if (!userId || riskLevel === 'low') {
      return next();
    }
    
    // Implement rate limiting based on risk level
    // This is a simplified example - you might want to use Redis for production
    const key = `rate_limit_${userId}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    
    // High risk: 10 requests per minute
    // Medium risk: 30 requests per minute
    const maxRequests = riskLevel === 'high' ? 10 : 30;
    
    // In production, implement proper rate limiting with Redis
    // For now, just log the risk level
    console.log(`User ${userId} has ${riskLevel} risk level`);
    
    next();
  } catch (error) {
    console.error("Error in risk-based rate limiting:", error);
    next();
  }
};