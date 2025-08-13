import { Types } from "mongoose";
import { User, IUser } from "../models/users.model";
import { CreditTransaction, ICreditTransaction, TransactionType } from "../models/creditTransaction.model";
import { ApiError } from "../utils/ApiError";
import { FraudDetectionService } from "./fraudDetection.service";

export class EnhancedCreditService {
  /**
   * Award signup bonus with fraud detection
   */
  static async awardSignupBonus(userId: string | Types.ObjectId): Promise<{ user: IUser; transaction: ICreditTransaction }> {
    // Check if user can claim bonus
    const bonusCheck = await FraudDetectionService.canClaimBonus(userId, 'signup');
    if (!bonusCheck.canClaim) {
      throw new ApiError(403, bonusCheck.reason || "Cannot claim signup bonus");
    }

    const SIGNUP_BONUS = 1000;
    const session = await User.startSession();
    
    try {
      session.startTransaction();
      
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      const balanceBefore = user.credits;
      const balanceAfter = balanceBefore + SIGNUP_BONUS;
      
      // Update user credits
      user.credits = balanceAfter;
      await user.save({ session });

      // Create transaction record
      const transaction = await CreditTransaction.create([{
        user: userId,
        type: "signup_bonus",
        amount: SIGNUP_BONUS,
        balanceBefore,
        balanceAfter,
        description: "Welcome bonus for new account",
        metadata: { bonusType: "signup" }
      }], { session });

      // Record bonus claim
      await FraudDetectionService.recordBonusClaim(userId, 'signup');

      await session.commitTransaction();
      
      return { user, transaction: transaction[0] };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Transfer credits with fraud detection
   */
  static async transferCredits(
    fromUserId: string | Types.ObjectId,
    toUserId: string | Types.ObjectId,
    amount: number,
    description: string,
    metadata?: any
  ): Promise<{
    fromUser: IUser;
    toUser: IUser;
    fromTransaction: ICreditTransaction;
    toTransaction: ICreditTransaction;
  }> {
    // Check for suspicious transfers
    const transferCheck = await FraudDetectionService.checkSuspiciousTransfer(
      fromUserId,
      toUserId,
      amount
    );

    if (!transferCheck.allowed) {
      throw new ApiError(403, transferCheck.reason || "Transfer blocked");
    }

    const session = await User.startSession();
    
    try {
      session.startTransaction();
      
      // Get both users
      const [fromUser, toUser] = await Promise.all([
        User.findById(fromUserId).session(session),
        User.findById(toUserId).session(session)
      ]);

      if (!fromUser || !toUser) {
        throw new ApiError(404, "User not found");
      }

      if (fromUser.credits < amount) {
        throw new ApiError(400, "Insufficient credits");
      }

      // Deduct from buyer
      const fromBalanceBefore = fromUser.credits;
      const fromBalanceAfter = fromBalanceBefore - amount;
      fromUser.credits = fromBalanceAfter;
      await fromUser.save({ session });

      // Add to seller
      const toBalanceBefore = toUser.credits;
      const toBalanceAfter = toBalanceBefore + amount;
      toUser.credits = toBalanceAfter;
      await toUser.save({ session });

      // Create transaction records
      const [fromTransaction, toTransaction] = await CreditTransaction.create([
        {
          user: fromUserId,
          type: "purchase_prompt",
          amount: -amount,
          balanceBefore: fromBalanceBefore,
          balanceAfter: fromBalanceAfter,
          description,
          metadata: metadata || {}
        },
        {
          user: toUserId,
          type: "sell_prompt",
          amount: amount,
          balanceBefore: toBalanceBefore,
          balanceAfter: toBalanceAfter,
          description,
          metadata: metadata || {}
        }
      ], { session });

      await session.commitTransaction();
      
      return { fromUser, toUser, fromTransaction, toTransaction };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Award referral bonus with fraud detection
   */
  static async awardReferralBonus(
    referrerId: string | Types.ObjectId,
    referredUserId: string | Types.ObjectId
  ): Promise<{ user: IUser; transaction: ICreditTransaction }> {
    // Check if referrer can claim bonus
    const bonusCheck = await FraudDetectionService.canClaimBonus(referrerId, 'referral');
    if (!bonusCheck.canClaim) {
      throw new ApiError(403, bonusCheck.reason || "Cannot claim referral bonus");
    }

    const REFERRAL_BONUS = 500;
    const session = await User.startSession();
    
    try {
      session.startTransaction();
      
      const user = await User.findById(referrerId).session(session);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      const balanceBefore = user.credits;
      const balanceAfter = balanceBefore + REFERRAL_BONUS;
      
      // Update user credits
      user.credits = balanceAfter;
      await user.save({ session });

      // Create transaction record
      const transaction = await CreditTransaction.create([{
        user: referrerId,
        type: "referral_bonus",
        amount: REFERRAL_BONUS,
        balanceBefore,
        balanceAfter,
        description: "Referral bonus for inviting a friend",
        metadata: { referredUserId }
      }], { session });

      // Record bonus claim
      await FraudDetectionService.recordBonusClaim(referrerId, 'referral');

      await session.commitTransaction();
      
      return { user, transaction: transaction[0] };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Purchase credits with verification
   */
  static async purchaseCredits(
    userId: string | Types.ObjectId,
    amount: number,
    packageId: string,
    paymentIntentId: string,
    metadata?: any
  ): Promise<{ user: IUser; transaction: ICreditTransaction }> {
    const session = await User.startSession();
    
    try {
      session.startTransaction();
      
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      const balanceBefore = user.credits;
      const balanceAfter = balanceBefore + amount;
      
      // Update user credits
      user.credits = balanceAfter;
      await user.save({ session });

      // Create transaction record
      const transaction = await CreditTransaction.create([{
        user: userId,
        type: "buy_credits",
        amount,
        balanceBefore,
        balanceAfter,
        description: `Purchased ${amount} credits - ${packageId} package`,
        metadata: {
          packageId,
          paymentIntentId,
          ...metadata
        }
      }], { session });

      await session.commitTransaction();
      
      return { user, transaction: transaction[0] };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}