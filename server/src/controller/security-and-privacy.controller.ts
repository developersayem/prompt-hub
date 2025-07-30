import type { Request, Response } from "express";
import { SecurityEvent } from "../models/security-event.model";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";


// Controller for getting security events
const getSecurityEvents = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if(!userId) throw new ApiError(401, "Unauthorized")
  const events = await SecurityEvent.find({ userId }).sort({ date: -1 }).limit(10);
  res.status(200).json(new ApiResponse(200, events, "Security events fetched"));
});


export{
    getSecurityEvents
}