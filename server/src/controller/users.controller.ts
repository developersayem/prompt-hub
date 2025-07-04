import type { Request, Response } from "express";
import { Types } from "mongoose";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { IUser, User } from "../models/users.model";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import type { UploadApiResponse } from "cloudinary";
import { sendVerificationEmail } from "../utils/sendVerificationEmail";
import { generateVerificationCode } from "../utils/generateVerificationCode";
import { RESEND_VERIFICATION_CODE_INTERVAL_MINUTES } from "../constants";
import { CODE_EXPIRES_MINUTES } from "../constants";

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
//get user data 
const userController = asyncHandler(async (req: Request, res: Response) => {
  console.log(req)
  const user = await User.findById((req as any).user._id).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "User not found");

  res.status(200).json(new ApiResponse(200, { user }, "User fetched successfully"));
})
//controller for user registration
const userRegistrationController = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if ([name, email, password].some((field) => field.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }

    if (!email.includes("@")) {
      throw new ApiError(400, "Invalid email address");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    const avatarLocalPath = (
      req.files as { [fieldname: string]: Express.Multer.File[] }
    )?.avatar?.[0]?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required");
    }

    let avatar: UploadApiResponse | null = null;

    try {
      avatar = await uploadOnCloudinary(avatarLocalPath);
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      throw new ApiError(500, "Failed to upload avatar");
    }

    // Generate email verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    try {
      // Create user in DB
      const user = await User.create({
        name,
        email,
        password,
        avatar: avatar?.secure_url,
        isVerified: false,
        verificationCode,
        verificationCodeExpires:expiresAt
      });

      // Send verification email
      await sendVerificationEmail(email, verificationCode);

      return res.status(201).json(
        new ApiResponse(
          201,
          {
            email: user.email,
            message: "Account created. Please verify your email.",
          },
          "Verification code sent to your email"
        )
      );
    } catch (error) {
      console.error("Error creating user:", error);
      if (avatar) await deleteFromCloudinary(avatar.public_id);
      throw new ApiError(500, "Failed to create user");
    }
  }
);
// Controller for Google OAuth callback
const googleOAuthCallbackController = async (req: Request, res: Response) => {
  const user = req.user as IUser;

  if (!user) {
    return res.redirect("/auth/login?error=No user found");
  }

  try {
    // ✅ Step 1: Check if isVerified is false
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save({ validateBeforeSave: false });
    }

    // ✅ Step 2: Issue tokens
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id as string);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: false,
      path: "/",
    };

    // ✅ Step 3: Set cookies and redirect
    res
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .redirect(`${process.env.FRONTEND_URL}/auth/google/success`);
  } catch (error) {
    console.error("Google login error:", error);
    throw new ApiError(500, "Something went wrong during Google login");
  }
};

// Controller for login user
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

    // ❗ Check if user is verified
    if (!user.isVerified) {
      throw new ApiError(401, "Please verify your email before logging in.");
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
      sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
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
// Controller for user login out
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
// Controller for profile update
const updateProfileController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const {
    name,
    bio,
    phone,
    countryCode,
    address = {},
    socialLinks = {},
  } = req.body;

  // Handle avatar upload
  const avatarLocalPath = (
    req.files as { [fieldname: string]: Express.Multer.File[] }
  )?.avatar?.[0]?.path;

  if (avatarLocalPath) {
    try {
      const newAvatar = await uploadOnCloudinary(avatarLocalPath);

      // Remove old one if on Cloudinary
      if (user.avatar?.includes("cloudinary")) {
        const publicId = user.avatar.split("/").pop()?.split(".")[0];
        if (publicId) await deleteFromCloudinary(publicId);
      }

      user.avatar = newAvatar?.secure_url;
    } catch (err) {
      console.error("Avatar upload failed:", err);
      throw new ApiError(500, "Failed to upload new avatar");
    }
  }

  // Apply updates
  if (name) user.name = name;
  if (bio) user.bio = bio;
  if (phone) user.phone = phone;
  if (countryCode) user.countryCode = countryCode;


  user.address = {
  street: address?.street || user.address?.street || "",
  city: address?.city || user.address?.city || "",
  state: address?.state || user.address?.state || "",
  postalCode: address?.postalCode || user.address?.postalCode || "",
  country: address?.country || user.address?.country || "",
};

  user.socialLinks = {
    ...user.socialLinks,
    ...socialLinks,
  };

  await user.save();

  const updatedUser = await User.findById(userId).select("-password -refreshToken");
  if (!updatedUser) throw new ApiError(500, "Failed to fetch updated user");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});
// Controller for public profile info
const getUserProfileController = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) throw new ApiError(400, "User ID is required");

  const user = await User.findById(userId)
    .select("name email avatar bio socialLinks address countryCode phone isCertified createdAt prompts")
    .lean() as { 
      _id: any; 
      name: string; 
      email: string; 
      avatar?: string; 
      bio?: string; 
      socialLinks?: any; 
      address?: any; 
      countryCode?: string; 
      phone?: string; 
      isCertified?: boolean; 
      createdAt?: Date; 
      prompts?: any[]; 
    };

  if (!user) throw new ApiError(404, "User not found");

  const promptCount = user.prompts?.length || 0;

  const publicProfile = {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    socialLinks: user.socialLinks,
    location: user.address,
    phone: `${user.countryCode}${user.phone}`,
    isCertified: user.isCertified,
    joinedAt: user.createdAt,
    promptCount,
  };

  res.status(200).json(
    new ApiResponse(200, { profile: publicProfile }, "User profile fetched successfully")
  );
});
// Controller for verify user 
const verifyUserController = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) throw new ApiError(400, "Email and code required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  if (user.isVerified) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "User already verified"));
  }

  const now = new Date();

  if (!user.verificationCode || user.verificationCode !== code) {
    throw new ApiError(400, "Invalid verification code");
  }

  if (!user.verificationCodeExpires || user.verificationCodeExpires < now) {
    throw new ApiError(400, "Verification code has expired");
  }

  user.isVerified = true;
  user.verificationCode = "";
  user.verificationCodeExpires = null;

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Email verified successfully"));
});
// Controller for resend verification code
const resendVerificationCodeController = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) throw new ApiError(400, "Email is required");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    if (user.isVerified) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "User is already verified"));
    }

    // ⏱️ Check resend rate limit
    const now = new Date();
    const lastSent = user.lastVerificationSentAt;
    const minutesSinceLast = lastSent
      ? (now.getTime() - new Date(lastSent).getTime()) / 1000 / 60
      : Infinity;

    if (minutesSinceLast < RESEND_VERIFICATION_CODE_INTERVAL_MINUTES) {
      const wait = Math.ceil(CODE_EXPIRES_MINUTES - minutesSinceLast);
      throw new ApiError(
        429,
        `Please wait ${wait} more minute(s) before requesting again.`
      );
    }

    // 🔐 Generate and store new code
    const newCode = generateVerificationCode(); // e.g., 6-digit string
    const expiresAt = new Date(Date.now() + CODE_EXPIRES_MINUTES * 60 * 1000);

    user.verificationCode = newCode;
    user.verificationCodeExpires = expiresAt;
    user.lastVerificationSentAt = now;

    await user.save({ validateBeforeSave: false });

    // 📧 Send email
    try {
      await sendVerificationEmail(email, newCode);
    } catch (error) {
      console.error("Email send failed:", error);
      throw new ApiError(500, "Failed to send verification email");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "New verification code sent to your email"
        )
      );
  }
);




export { 
  userController,
  userRegistrationController,
  googleOAuthCallbackController,
  loginUserController,
  logoutUser,
  updateProfileController,
  getUserProfileController,
  verifyUserController,
  resendVerificationCodeController
};
