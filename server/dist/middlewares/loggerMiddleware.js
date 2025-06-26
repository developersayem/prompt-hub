"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerMiddleware = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const loggerMiddleware = (req, res, next) => {
    const start = Date.now();
    // Get client IP address
    // Express sets req.ip, but behind proxies you may want req.headers['x-forwarded-for']
    const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    res.on("finish", () => {
        const duration = Date.now() - start;
        logger_1.default.info(`${ip} - ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
};
exports.loggerMiddleware = loggerMiddleware;
