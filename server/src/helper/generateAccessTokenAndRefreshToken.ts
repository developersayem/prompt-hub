import mongoose, { Types } from "mongoose";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/users.model";


interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Generate access token and refresh token for user
const generateAccessTokenAndRefreshToken = async (
  userId: string | Types.ObjectId
): Promise<TokenResponse> => {
  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    // Generate tokens using instance methods (ensure these exist on your model)
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating access and refresh tokens:", error);
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

export {
    generateAccessTokenAndRefreshToken
}