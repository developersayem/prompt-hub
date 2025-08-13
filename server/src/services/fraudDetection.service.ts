import { Types } from "mongoose";
import { User } from "../models/users.model";
import { FraudDetection, IFraudDetection } from "../models/fraudDetection.model";
import { CreditTransaction } from "../models/creditTransaction.model";
import crypto from "crypto";

export class FraudDetectionService {
  /**
   * Generate device fingerprint from request headers
   */
  static generateDeviceFingerprint(req: any): string {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const connection = req.headers['connection'] || '';
    
    const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${connection}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  /**
   * Get client IP address
   */
  static getClientIP(req: any): string {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           req.ip || 
           'unknown';
  }

  /**
   * Initialize fraud detection for new user
   */
  static async initializeFraudDetection(
    userId: string | Types.ObjectId,
    req: any
  ): Promise<IFraudDetection> {
    const ip = this.getClientIP(req);
    const deviceFingerprint = this.generateDeviceFingerprint(req);

    // Check for existing accounts with same IP or device
    const suspiciousAccounts = await FraudDetection.find({
      $or: [
        { registrationIP: ip },
        { deviceFingerprints: deviceFingerprint }
      ]
    }).populate('userId', 'email createdAt');

    let riskScore = 0;
    let flaggedReason = '';
    const relatedAccounts: Types.ObjectId[] = [];

    // Calculate risk score
    if (suspiciousAccounts.length > 0) {
      riskScore += suspiciousAccounts.length * 25; // 25 points per related account
      relatedAccounts.push(...suspiciousAccounts.map(acc => acc.userId));
      
      if (suspiciousAccounts.length >= 3) {
        flaggedReason = `Multiple accounts detected from same IP/device (${suspiciousAccounts.length} accounts)`;
      }
    }

    // Check for rapid account creation from same IP
    const recentAccountsFromIP = await FraudDetection.countDocuments({
      registrationIP: ip,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (recentAccountsFromIP >= 3) {
      riskScore += 40;
      flaggedReason = `Rapid account creation from IP: ${recentAccountsFromIP} accounts in 24h`;
    }

    const fraudDetection = await FraudDetection.create({
      userId,
      registrationIP: ip,
      loginIPs: [ip],
      deviceFingerprints: [deviceFingerprint],
      riskScore: Math.min(riskScore, 100),
      isFlagged: riskScore >= 60,
      flaggedReason: riskScore >= 60 ? flaggedReason : undefined,
      relatedAccounts: [...new Set(relatedAccounts)], // Remove duplicates
      verificationLevel: 'email'
    });

    return fraudDetection;
  }

  /**
   * Update fraud detection on login
   */
  static async updateOnLogin(userId: string | Types.ObjectId, req: any): Promise<void> {
    const ip = this.getClientIP(req);
    const deviceFingerprint = this.generateDeviceFingerprint(req);

    await FraudDetection.findOneAndUpdate(
      { userId },
      {
        $addToSet: {
          loginIPs: ip,
          deviceFingerprints: deviceFingerprint
        }
      },
      { upsert: true }
    );
  }

  /**
   * Check if user can claim bonus (anti-fraud)
   */
  static async canClaimBonus(
    userId: string | Types.ObjectId,
    bonusType: 'signup' | 'referral'
  ): Promise<{ canClaim: boolean; reason?: string }> {
    const fraudDetection = await FraudDetection.findOne({ userId });
    
    if (!fraudDetection) {
      return { canClaim: false, reason: "Fraud detection record not found" };
    }

    // Check if account is flagged
    if (fraudDetection.isFlagged) {
      return { canClaim: false, reason: "Account flagged for suspicious activity" };
    }

    // High risk accounts have restrictions
    if (fraudDetection.riskScore >= 40) {
      // Require phone verification for high-risk accounts
      if (fraudDetection.verificationLevel === 'email') {
        return { canClaim: false, reason: "Additional verification required for high-risk account" };
      }
    }

    // Signup bonus specific checks
    if (bonusType === 'signup') {
      // Check if related accounts already claimed signup bonus
      const relatedBonuses = await CreditTransaction.countDocuments({
        user: { $in: fraudDetection.relatedAccounts },
        type: 'signup_bonus'
      });

      if (relatedBonuses > 0 && fraudDetection.riskScore >= 50) {
        return { canClaim: false, reason: "Signup bonus already claimed by related account" };
      }
    }

    return { canClaim: true };
  }

  /**
   * Record bonus claim
   */
  static async recordBonusClaim(
    userId: string | Types.ObjectId,
    bonusType: 'signup' | 'referral'
  ): Promise<void> {
    await FraudDetection.findOneAndUpdate(
      { userId },
      {
        $inc: { bonusClaimCount: 1 }
      }
    );
  }

  /**
   * Check for suspicious credit transfers
   */
  static async checkSuspiciousTransfer(
    fromUserId: string | Types.ObjectId,
    toUserId: string | Types.ObjectId,
    amount: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    const [fromFraud, toFraud] = await Promise.all([
      FraudDetection.findOne({ userId: fromUserId }),
      FraudDetection.findOne({ userId: toUserId })
    ]);

    // Block transfers between flagged accounts
    if (fromFraud?.isFlagged || toFraud?.isFlagged) {
      return { allowed: false, reason: "Transfer blocked: Account flagged for suspicious activity" };
    }

    // Check if accounts are related (same IP/device)
    if (fromFraud && toFraud) {
      const sharedIPs = fromFraud.loginIPs.filter(ip => toFraud.loginIPs.includes(ip));
      const sharedDevices = fromFraud.deviceFingerprints.filter(fp => 
        toFraud.deviceFingerprints.includes(fp)
      );

      if (sharedIPs.length > 0 || sharedDevices.length > 0) {
        // Record suspicious activity
        await this.recordSuspiciousActivity(
          fromUserId,
          'suspicious_transfer',
          `Credit transfer to potentially related account (shared IP/device)`,
          'high'
        );

        await this.recordSuspiciousActivity(
          toUserId,
          'suspicious_transfer',
          `Credit transfer from potentially related account (shared IP/device)`,
          'high'
        );

        return { allowed: false, reason: "Transfer blocked: Accounts appear to be related" };
      }
    }

    // Check for rapid transfers (potential credit farming)
    const recentTransfers = await CreditTransaction.countDocuments({
      user: fromUserId,
      type: 'purchase_prompt',
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    if (recentTransfers >= 10) {
      await this.recordSuspiciousActivity(
        fromUserId,
        'rapid_transfers',
        `${recentTransfers} credit transfers in the last hour`,
        'medium'
      );

      return { allowed: false, reason: "Transfer rate limit exceeded" };
    }

    return { allowed: true };
  }

  /**
   * Record suspicious activity
   */
  static async recordSuspiciousActivity(
    userId: string | Types.ObjectId,
    type: string,
    description: string,
    severity: 'low' | 'medium' | 'high'
  ): Promise<void> {
    await FraudDetection.findOneAndUpdate(
      { userId },
      {
        $push: {
          suspiciousActivities: {
            type,
            description,
            timestamp: new Date(),
            severity
          }
        },
        $inc: { riskScore: severity === 'high' ? 20 : severity === 'medium' ? 10 : 5 }
      }
    );

    // Auto-flag accounts with high risk scores
    await FraudDetection.findOneAndUpdate(
      { userId, riskScore: { $gte: 80 }, isFlagged: false },
      {
        isFlagged: true,
        flaggedReason: 'High risk score due to suspicious activities'
      }
    );
  }

  /**
   * Get fraud detection report for user
   */
  static async getFraudReport(userId: string | Types.ObjectId) {
    const fraudDetection = await FraudDetection.findOne({ userId })
      .populate('relatedAccounts', 'email createdAt')
      .lean();

    if (!fraudDetection) {
      return null;
    }

    // Get recent credit transactions
    const recentTransactions = await CreditTransaction.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).sort({ createdAt: -1 }).limit(50);

    return {
      ...fraudDetection,
      recentTransactions,
      riskLevel: fraudDetection.riskScore >= 80 ? 'high' : 
                 fraudDetection.riskScore >= 40 ? 'medium' : 'low'
    };
  }

  /**
   * Admin function to manually flag/unflag account
   */
  static async updateAccountFlag(
    userId: string | Types.ObjectId,
    isFlagged: boolean,
    reason?: string
  ): Promise<void> {
    await FraudDetection.findOneAndUpdate(
      { userId },
      {
        isFlagged,
        flaggedReason: isFlagged ? reason : undefined,
        riskScore: isFlagged ? Math.max(80, 0) : Math.min(30, 0) // Adjust risk score
      }
    );
  }
}