"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeploymentStats = exports.getServerPing = exports.getServerStatus = exports.healthCheckController = void 0;
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const os_1 = __importDefault(require("os"));
// Controller for health check
const healthCheckController = (0, asyncHandler_1.default)(async (req, res) => {
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, "Server is running", "Health check Passed"));
});
exports.healthCheckController = healthCheckController;
// Controller for get full server status
const getServerStatus = (0, asyncHandler_1.default)(async (req, res) => {
    const uptimeSeconds = process.uptime();
    const memoryUsage = process.memoryUsage(); // returns bytes
    const cpuCount = os_1.default.cpus().length;
    const loadAverage = os_1.default.loadavg(); // 1, 5, 15 minutes averages
    const totalMemory = os_1.default.totalmem();
    const freeMemory = os_1.default.freemem();
    const platform = os_1.default.platform();
    const nodeVersion = process.version;
    res.status(200).json(new ApiResponse_1.ApiResponse(200, {
        uptime: `${Math.floor(uptimeSeconds / 60)} minutes`,
        memoryUsage: {
            rss: memoryUsage.rss / 1024 / 1024, // Resident Set Size
            heapTotal: memoryUsage.heapTotal / 1024 / 1024, // Total heap size
            heapUsed: memoryUsage.heapUsed / 1024 / 1024, // Used heap size
            external: memoryUsage.external / 1024 / 1024 // External memory usage
        },
        cpuCount,
        loadAverage: {
            "1min": loadAverage[0],
            "5min": loadAverage[1],
            "15min": loadAverage[2]
        },
        totalMemory: totalMemory / 1024 / 1024, // Total system memory in MB
        freeMemory: freeMemory / 1024 / 1024, // Free system memory in MB
        platform,
        nodeVersion
    }, "Server is running"));
});
exports.getServerStatus = getServerStatus;
// Controller for get server ping
const getServerPing = (0, asyncHandler_1.default)(async (req, res) => {
    const start = Date.now();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, "Pong", `Ping: ${Date.now() - start}ms`));
});
exports.getServerPing = getServerPing;
// Deployment stats
const getDeploymentStats = (0, asyncHandler_1.default)(async (req, res) => {
    res.status(200).json(new ApiResponse_1.ApiResponse(200, "Deployment stats fetched successfully", "Deployment stats fetched successfully"));
});
exports.getDeploymentStats = getDeploymentStats;
