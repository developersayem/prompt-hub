import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import os from "os";
import type { Request, Response } from "express";

// Controller for health check
const healthCheckController = asyncHandler(async (req: Request, res: Response) => {
    res
    .status(200)
    .json(new ApiResponse(
        200, 
        "Server is running", 
        "Health check Passed"
    ))
});
// Controller for get full server status
const getServerStatus = asyncHandler(async (req: Request, res: Response) => {
  const uptimeSeconds = process.uptime();
  const memoryUsage = process.memoryUsage(); // returns bytes
  const cpuCount = os.cpus().length;
  const loadAverage = os.loadavg(); // 1, 5, 15 minutes averages
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const platform = os.platform();
  const nodeVersion = process.version;

  res.status(200).json(new ApiResponse(
    200,
    {
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
    },
    "Server is running"
  ));
});
// Controller for get server ping
const getServerPing = asyncHandler(async (req: Request, res: Response) => {
  const start = Date.now();
  res.status(200).json(new ApiResponse(
    200,
    "Pong",
    `Ping: ${Date.now() - start}ms`
  ));
});

// Deployment stats
const getDeploymentStats = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(
    200,
    "Deployment stats fetched successfully",
    "Deployment stats fetched successfully"
  ));
});


export { 
    healthCheckController,
    getServerStatus,
    getServerPing,
    getDeploymentStats
};