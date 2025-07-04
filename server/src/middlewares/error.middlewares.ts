import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";
import type { ErrorRequestHandler } from "express";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let error = err as
    | ApiError
    | (Error & { statusCode?: number; error?: unknown[]; stack?: string });

  if (!(error instanceof ApiError)) {
    const isMongooseError = error instanceof mongoose.Error;
    const statusCode = error.statusCode || (isMongooseError ? 400 : 500);
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error.error || [], error.stack || "");
  }

  const response = {
    statusCode: error.statusCode,
    message: error.message,
    error: error.error || [],
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  // Just send the response; don't return anything
  res.status(error.statusCode!).json(response);
};

export { errorHandler };
