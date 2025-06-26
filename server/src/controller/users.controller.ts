import type { Request, Response } from "express";
import { Types } from "mongoose";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/users.model";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import type { UploadApiResponse } from "cloudinary";

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
  };
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

//controller for user registration
const userRegistrationController = asyncHandler(
  async (req: Request, res: Response) => {
    //get info from request body
    const { name, email, password } = req.body;

    //validate the input
    if ([name, email, password].some((field) => field.trim() === ""))
      throw new ApiError(400, "All fields are required");

    //check if user already exists & throw error if exists
    if (!email.includes("@")) throw new ApiError(400, "Invalid email address");
    const existingUser = await User.findOne({ email: email });
    if (existingUser) throw new ApiError(400, "User already exist");

    //get the avatar from the request
    const avatarLocalPath = (
      req.files as { [fieldname: string]: Express.Multer.File[] }
    )?.avatar[0].path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");

    //upload the avatar to cloudinary
    let avatar: UploadApiResponse | null;
    try {
      avatar = await uploadOnCloudinary(avatarLocalPath);
      console.log("Uploaded avatar", avatar);
    } catch (error) {
      console.error("Error uploading avatar to Cloudinary:", error);
      throw new ApiError(500, "Failed to upload avatar");
    }

    try {
      //create a new user
      const user = await User.create({
        name,
        email,
        password,
        avatar: avatar?.url,
      });

      // check if user created
      const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );
      if (!createUser) throw new ApiError(500, "User not created");

      // Generate tokens
      const { accessToken, refreshToken } =
        await generateAccessTokenAndRefreshToken(createUser._id as string);

      // Cookie options
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      };

      //send response
      return res
        .status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
          new ApiResponse(
            201,
            {
              user: createUser,
              accessToken, // include access token in response body
            },
            "User created successfully"
          )
        );
    } catch (error) {
      console.log("Error creating user", error);
      if (avatar) await deleteFromCloudinary(avatar.public_id);
      throw new ApiError(
        500,
        "something went wrong when creating user and deleted avatar from cloudinary"
      );
    }
  }
);

// Controller for user login
const loginUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new ApiError(400, "All fields are required");
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check password correctness
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Password is incorrect");
    }

    // Generate tokens
    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id as string);

    // Get user data excluding sensitive fields
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!loggedInUser) {
      throw new ApiError(404, "User not found");
    }

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    // Send response with tokens set in cookies and user data in JSON
    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged in successfully"
        )
      );
  }
);


//Controller for user login out
const logoutUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const authenticatedReq = req as AuthenticatedRequest;
    await User.findByIdAndUpdate(
      authenticatedReq.user._id,
      { $set: { refreshToken: "" } },
      { new: true }
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  }
);

export { 
  userRegistrationController,
  loginUserController,
  logoutUser
};
