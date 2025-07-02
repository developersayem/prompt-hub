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
        sameSite: false, // crucial for cross-origin cookie usage
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

// Controller for Google OAuth callback
const googleOAuthCallbackController = async (req: Request, res: Response) => {
  const user = req.user as any;

  if (!user) {
    return res.redirect("/auth/login?error=No user found");
  }

  try {
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: false,
    };

    res
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .redirect(`${process.env.FRONTEND_URL}/auth/google/success`); // change this to frontend dashboard route
  } catch (error) {
    console.error("Google login error:", error);
    throw new ApiError(500, "Something went wrong during Google login");
  }
};

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
      sameSite: false,
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




export { 
  userController,
  userRegistrationController,
  googleOAuthCallbackController,
  loginUserController,
  logoutUser,
  updateProfileController,
  getUserProfileController
};
