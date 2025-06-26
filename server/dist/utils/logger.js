"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const { combine, timestamp, printf, colorize } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});
const logger = winston_1.default.createLogger({
    level: "info",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
    transports: [
        // Daily rotate file transport for all logs
        new winston_daily_rotate_file_1.default({
            filename: "logs/application-%DATE%.log", // Log file name pattern
            datePattern: "YYYY-MM-DD", // Daily rotation
            zippedArchive: true, // Compress archived logs
            maxSize: "20m", // Max size per log file before rotation
            maxFiles: "14d", // Keep logs for 14 days
            level: "info", // Logs at info level and above
        }),
        // Separate file for errors only
        new winston_daily_rotate_file_1.default({
            filename: "logs/error-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d",
            level: "error", // Only errors
        }),
    ],
});
// Console logging in non-production environments with colors
if (process.env.NODE_ENV !== "production") {
    logger.add(new winston_1.default.transports.Console({
        format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
    }));
}
exports.default = logger;
