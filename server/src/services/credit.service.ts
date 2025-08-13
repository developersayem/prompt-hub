import { Types } from "mongoose";
import { User, IUser } from "../models/users.model";
import { CreditTransaction, ICreditTransaction, TransactionType } from "../models/creditTransaction.model";
import { ApiError } from "../utils/ApiError";

export class CreditService {
  /**
   * Add credits to user account with transaction logging
   */
  static async addCredits(
    userId: string | Types.ObjectId,
    amount: number,
    type: TransactionType,
    description: string,
    metadata?: any,
    expiresAt?: Date
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
        type,
        amount,
        balanceBefore,
        balanceAfter,
        description,
        metadata: metadata || {},
        expiresAt
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

  /**
   * Deduct credits from user account with transaction logging
   */
  static async deductCredits(
    userId: string | Types.ObjectId,
    amount: number,
    type: TransactionType,
    description: string,
    metadata?: any
  ): Promise<{ user: IUser; transaction: ICreditTransaction }> {
    const session = await User.startSession();
    
    try {
      session.startTransaction();
      
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      if (user.credits < amount) {
        throw new ApiError(400, "Insufficient credits");
      }

      const balanceBefore = user.credits;
      const balanceAfter = balanceBefore - amount;
      
      // Update user credits
      user.credits = balanceAfter;
      await user.save({ session });

      // Create transaction record
      const transaction = await CreditTransaction.create([{
        user: userId,
        type,
        amount: -amount, // Negative for deductions
        balanceBefore,
        balanceAfter,
        description,
        metadata: metadata || {}
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

  /**
   * Transfer credits between users (for prompt purchases)
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
    const session = await User.startSession();
    
    try {
      session.startTransaction();
      
      // Deduct from buyer
      const { user: fromUser, transaction: fromTransaction } = await this.deductCredits(
        fromUserId,
        amount,
        "purchase_prompt",
        description,
        metadata
      );

      // Add to seller
      const { user: toUser, transaction: toTransaction } = await this.addCredits(
        toUserId,
        amount,
        "sell_prompt",
        description,
        metadata
      );

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
   * Get user's credit transaction history
   */
  static async getTransactionHistory(
    userId: string | Types.ObjectId,
    page: number = 1,
    limit: number = 20,
    type?: TransactionType
  ) {
    const skip = (page - 1) * limit;
    const filter: any = { user: userId };
    
    if (type) {
      filter.type = type;
    }

    const [transactions, total] = await Promise.all([
      CreditTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('metadata.promptId', 'title slug')
        .populate('metadata.referredUserId', 'name email'),
      CreditTransaction.countDocuments(filter)
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Award signup bonus to new users
   */
  static async awardSignupBonus(userId: string | Types.ObjectId) {
    const SIGNUP_BONUS = 1000; // Configure this value
    
    return await this.addCredits(
      userId,
      SIGNUP_BONUS,
      "signup_bonus",
      "Welcome bonus for new account",
      { bonusType: "signup" }
    );
  }

  /**
   * Award referral bonus
   */
  static async awardReferralBonus(
    referrerId: string | Types.ObjectId,
    referredUserId: string | Types.ObjectId
  ) {
    const REFERRAL_BONUS = 500; // Configure this value
    
    return await this.addCredits(
      referrerId,
      REFERRAL_BONUS,
      "referral_bonus",
      "Referral bonus for inviting a friend",
      { referredUserId }
    );
  }

  /**
   * Get user's credit statistics
   */
  static async getCreditStats(userId: string | Types.ObjectId) {
    const stats = await CreditTransaction.aggregate([
      { $match: { user: new Types.ObjectId(userId as string) } },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const user = await User.findById(userId, 'credits');
    
    return {
      currentBalance: user?.credits || 0,
      transactions: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.totalAmount,
          count: stat.count
        };
        return acc;
      }, {} as Record<string, { total: number; count: number }>)
    };
  }
}