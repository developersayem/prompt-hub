"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CODE_EXPIRES_MINUTES = exports.RESEND_VERIFICATION_CODE_INTERVAL_MINUTES = exports.DB_NAME = void 0;
// Database name
exports.DB_NAME = "prompt-hub";
// Verification Code Interval
// This is the interval in minutes after which a user can request a new verification code
exports.RESEND_VERIFICATION_CODE_INTERVAL_MINUTES = 2;
// Verification Code Expiry Time
exports.CODE_EXPIRES_MINUTES = 10;
