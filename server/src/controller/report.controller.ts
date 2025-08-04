import type{ Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { IReport, Report } from "../models/report.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import validator from "validator";
import mongoose from "mongoose";

// Controller for reporting a post
const reportPostController = asyncHandler(async (req: Request, res: Response) => {
  const { postId, reason, additionalDetails = "" } = req.body;
  const userId = (req as any).user?._id;
  if(!userId) throw new ApiError(401, "Unauthorized")

  if (!postId || !reason) {
    throw new ApiError( 400, "Missing required fields.");
  }

  const allowedReasons = [
    "spam",
    "harassment",
    "hate-speech",
    "violence",
    "inappropriate",
    "misinformation",
    "copyright",
    "other",
  ];

  if (!allowedReasons.includes(reason)) {
    return res.status(400).json({ message: "Invalid report reason." });
  }

  // Prevent duplicate report on same post
  const existingReport = await Report.findOne({
    postId,
    reportedBy: userId,
  });

  if (existingReport) {
    return res.status(409).json({ message: "You have already reported this post." });
  }

  // Sanitize input to prevent XSS or malicious content
  const cleanDetails = validator.escape(additionalDetails.trim().slice(0, 1000));

  const newReport = await Report.create({
    postId,
    reportedBy: userId,
    postAuthor: req.body.postAuthorId,
    reason,
    additionalDetails: cleanDetails,
    reporterIP: req.ip,
    reporterUserAgent: req.get("user-agent") || "Unknown",
  });

  return res.status(201).json(
    new ApiResponse(201, {data:null}, "Report submitted successfully")
  );
});







export {
    reportPostController,
};