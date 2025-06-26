"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckController = void 0;
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const healthCheckController = (0, asyncHandler_1.default)(async (req, res) => {
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, "Server is running", "Health check Passed"));
});
exports.healthCheckController = healthCheckController;
