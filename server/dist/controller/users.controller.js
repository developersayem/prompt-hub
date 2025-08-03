"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleTwoFactorAuthController = exports.verifyTwoFactorCodeController = exports.send2FACodeController = exports.verifyOTPController = exports.resetPasswordController = exports.setPasswordController = exports.changePasswordController = exports.resendVerificationCodeController = exports.verifyUserController = exports.getUserProfileController = exports.updateProfileController = exports.logoutUser = exports.loginUserController = exports.userRegistrationController = exports.getMeController = exports.userController = void 0;
const cookieOptions_1 = require("../utils/cookieOptions");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const users_model_1 = require("../models/users.model");
const prompts_model_1 = require("../models/prompts.model");
const cloudinary_1 = require("../utils/cloudinary");
const ApiResponse_1 = require("../utils/ApiResponse");
const sendVerificationEmail_1 = require("../utils/emails/sendVerificationEmail");
const generateVerificationCode_1 = require("../utils/generateVerificationCode");
const constants_1 = require("../constants");
const constants_2 = require("../constants");
const sendTwoFactorCodeEmail_1 = require("../utils/emails/sendTwoFactorCodeEmail");
const crypto_1 = __importDefault(require("crypto"));
const security_event_model_1 = require("../models/security-event.model");
const trackConnectedDevice_1 = require("../utils/trackConnectedDevice");
// Generate access token and refresh token for user
const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        // Find the user by ID
        const user = await users_model_1.User.findById(userId);
        if (!user)
            throw new ApiError_1.ApiError(404, "User not found");
        // Generate tokens using instance methods (ensure these exist on your model)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    }
    catch (error) {
        console.error("Error generating access and refresh tokens:", error);
        throw new ApiError_1.ApiError(500, "Something went wrong while generating tokens");
    }
};
// Controller currently logged in user
const getMeController = (0, asyncHandler_1.default)(async (req, res) => {
    // Assuming your authentication middleware sets req.userId
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const user = await users_model_1.User.findById(userId).select("-password -refreshToken");
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.json({ data: { user } });
});
exports.getMeController = getMeController;
//get user data 
const userController = (0, asyncHandler_1.default)(async (req, res) => {
    console.log(req);
    const user = await users_model_1.User.findById(req.user._id).select("-password -refreshToken");
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    res.status(200).json(new ApiResponse_1.ApiResponse(200, { user }, "User fetched successfully"));
});
exports.userController = userController;
//controller for user registration
const userRegistrationController = (0, asyncHandler_1.default)(async (req, res) => {
    const { name, email, password } = req.body;
    if ([name, email, password].some((field) => field.trim() === "")) {
        throw new ApiError_1.ApiError(400, "All fields are required");
    }
    if (!email.includes("@")) {
        throw new ApiError_1.ApiError(400, "Invalid email address");
    }
    const existingUser = await users_model_1.User.findOne({ email });
    if (existingUser) {
        throw new ApiError_1.ApiError(400, "User already exists");
    }
    // Generate email verification code
    const verificationCode = (0, generateVerificationCode_1.generateVerificationCode)();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    try {
        // Create user in DB
        const user = await users_model_1.User.create({
            name,
            email,
            password,
            avatar: "",
            isVerified: false,
            verificationCode,
            verificationCodeExpires: expiresAt
        });
        // Send verification email
        await (0, sendVerificationEmail_1.sendVerificationEmail)(email, verificationCode);
        return res.status(201).json(new ApiResponse_1.ApiResponse(201, {
            email: user.email,
            message: "Account created. Please verify your email.",
        }, "Verification code sent to your email"));
    }
    catch (error) {
        console.error("Error creating user:", error);
        throw new ApiError_1.ApiError(500, "Failed to create user");
    }
});
exports.userRegistrationController = userRegistrationController;
// Controller for login user (user login)
const loginUserController = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    // Validate credentials
    if (!email || !password) {
        throw new ApiError_1.ApiError(400, "All fields are required");
    }
    const user = await users_model_1.User.findOne({ email });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    // Check password
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect)
        throw new ApiError_1.ApiError(401, "Password is incorrect");
    // Ensure email is verified
    if (!user.isVerified) {
        throw new ApiError_1.ApiError(401, "Please verify your email before logging in.");
    }
    // 2FA flow — send code and wait for verification
    if (user.isTwoFactorEnabled) {
        const twoFactorCode = crypto_1.default.randomInt(100000, 999999).toString();
        const twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.twoFactorCode = twoFactorCode;
        user.twoFactorCodeExpires = twoFactorExpires;
        await user.save();
        await (0, sendTwoFactorCodeEmail_1.sendTwoFactorCodeEmail)(user.email, twoFactorCode);
        return res.status(200).json(new ApiResponse_1.ApiResponse(200, {
            requiresTwoFactor: true,
            user: { email: user.email },
            message: "2FA code sent to your email",
        }));
    }
    // If no 2FA, proceed to issue tokens
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    const loggedInUser = await users_model_1.User.findById(user._id).select("-password -refreshToken");
    if (!loggedInUser)
        throw new ApiError_1.ApiError(404, "User not found");
    // Track current device login info
    await (0, trackConnectedDevice_1.trackConnectedDevice)(user?._id, req);
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions_1.cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions_1.cookieOptions)
        .json(new ApiResponse_1.ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});
exports.loginUserController = loginUserController;
// Controller for verify user  (user login if 2fa is enabled)
const verifyUserController = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, code } = req.body;
    // Validate input
    if (!email || !code)
        throw new ApiError_1.ApiError(400, "Email and code required");
    const user = await users_model_1.User.findOne({ email });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    // Check if already verified
    if (user.isVerified) {
        return res
            .status(400)
            .json(new ApiResponse_1.ApiResponse(400, {}, "User already verified"));
    }
    // Check code match and expiration
    const now = new Date();
    if (!user.verificationCode || user.verificationCode !== code) {
        throw new ApiError_1.ApiError(400, "Invalid verification code");
    }
    if (!user.verificationCodeExpires || user.verificationCodeExpires < now) {
        throw new ApiError_1.ApiError(400, "Verification code has expired");
    }
    // Mark as verified and clear verification data
    user.isVerified = true;
    user.verificationCode = "";
    user.verificationCodeExpires = null;
    await user.save();
    const verifiedUser = await users_model_1.User.findById(user._id).select("-password -refreshToken");
    if (!verifiedUser)
        throw new ApiError_1.ApiError(404, "User not found");
    // Track current device login info
    await (0, trackConnectedDevice_1.trackConnectedDevice)(user._id, req);
    // Issue auth tokens
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions_1.cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions_1.cookieOptions)
        .json(new ApiResponse_1.ApiResponse(200, { user: verifiedUser }, "Email verified successfully"));
});
exports.verifyUserController = verifyUserController;
// Controller for user login out
const logoutUser = (0, asyncHandler_1.default)(async (req, res) => {
    const authenticatedReq = req;
    await users_model_1.User.findByIdAndUpdate(authenticatedReq.user._id, { $set: { refreshToken: "" } }, { new: true });
    res
        .status(200)
        .clearCookie("accessToken", cookieOptions_1.cookieOptions)
        .clearCookie("refreshToken", cookieOptions_1.cookieOptions)
        .json(new ApiResponse_1.ApiResponse(200, {}, "User logged out successfully"));
});
exports.logoutUser = logoutUser;
// Controller for profile update
const updateProfileController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const user = await users_model_1.User.findById(userId);
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    const { name, bio, phone, countryCode, address = {}, socialLinks = {}, } = req.body;
    // Handle avatar upload
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (avatarLocalPath) {
        try {
            const newAvatar = await (0, cloudinary_1.uploadOnCloudinary)(avatarLocalPath);
            // Remove old one if on Cloudinary
            if (user.avatar?.includes("cloudinary")) {
                const publicId = user.avatar.split("/").pop()?.split(".")[0];
                if (publicId)
                    await (0, cloudinary_1.deleteFromCloudinary)(publicId);
            }
            user.avatar = newAvatar?.secure_url;
        }
        catch (err) {
            console.error("Avatar upload failed:", err);
            throw new ApiError_1.ApiError(500, "Failed to upload new avatar");
        }
    }
    // Apply updates
    if (name)
        user.name = name;
    if (bio)
        user.bio = bio;
    if (phone)
        user.phone = phone;
    if (countryCode)
        user.countryCode = countryCode;
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
    const updatedUser = await users_model_1.User.findById(userId).select("-password -refreshToken");
    if (!updatedUser)
        throw new ApiError_1.ApiError(500, "Failed to fetch updated user");
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, updatedUser, "Profile updated successfully"));
});
exports.updateProfileController = updateProfileController;
const getUserProfileController = (0, asyncHandler_1.default)(async (req, res) => {
    // If this is a public profile, you might not want to require auth:
    // const userId = (req as any).user?._id;
    // if (!userId) throw new ApiError(401, "Unauthorized");
    const { slug } = req.params;
    if (!slug)
        throw new ApiError_1.ApiError(400, "User slug is required");
    // Find user by slug and select fields to expose
    const user = await users_model_1.User.findOne({ slug })
        .select("name title email avatar bio socialLinks address countryCode phone isCertified createdAt")
        .lean();
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    // Aggregate prompt stats for the user by their ObjectId
    const [promptStats] = await prompts_model_1.Prompt.aggregate([
        { $match: { creator: user._id } }, // just use user._id directly
        {
            $group: {
                _id: null,
                totalPrompts: { $sum: 1 },
                totalLikes: { $sum: { $size: "$likes" } },
                totalComments: { $sum: { $size: "$comments" } },
                totalViews: { $sum: "$views" },
                totalShares: { $sum: "$shareCount" },
            },
        },
    ]);
    // Build the public profile response object
    const publicProfile = {
        _id: user._id,
        name: user.name,
        title: user.title,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        socialLinks: user.socialLinks,
        location: user.address,
        phone: user.countryCode && user.phone ? `${user.countryCode}${user.phone}` : null,
        isCertified: user.isCertified,
        joinedAt: user.createdAt,
        promptStats: {
            totalPrompts: promptStats?.totalPrompts || 0,
            totalLikes: promptStats?.totalLikes || 0,
            totalComments: promptStats?.totalComments || 0,
            totalViews: promptStats?.totalViews || 0,
            totalShares: promptStats?.totalShares || 0,
        },
    };
    res.status(200).json(new ApiResponse_1.ApiResponse(200, publicProfile, "User profile fetched successfully"));
});
exports.getUserProfileController = getUserProfileController;
// TODO: add those controllers to separate file ---Start from here
// Controller for resend verification code
const resendVerificationCodeController = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, action = "verify" } = req.body;
    if (!email)
        throw new ApiError_1.ApiError(400, "Email is required");
    const user = await users_model_1.User.findOne({ email });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    if (action === "verify" && user.isVerified) {
        return res
            .status(400)
            .json(new ApiResponse_1.ApiResponse(400, {}, "User is already verified"));
    }
    // ⏱️ Check resend rate limit
    const now = new Date();
    const lastSent = user.lastVerificationSentAt;
    const minutesSinceLast = lastSent
        ? (now.getTime() - new Date(lastSent).getTime()) / 1000 / 60
        : Infinity;
    if (minutesSinceLast < constants_1.RESEND_VERIFICATION_CODE_INTERVAL_MINUTES) {
        const wait = Math.ceil(constants_2.CODE_EXPIRES_MINUTES - minutesSinceLast);
        throw new ApiError_1.ApiError(429, `Please wait ${wait} more minute(s) before requesting again.`);
    }
    // 🔐 Generate and store new code
    const newCode = (0, generateVerificationCode_1.generateVerificationCode)(); // e.g., 6-digit string
    const expiresAt = new Date(Date.now() + constants_2.CODE_EXPIRES_MINUTES * 60 * 1000);
    user.verificationCode = newCode;
    user.verificationCodeExpires = expiresAt;
    user.lastVerificationSentAt = now;
    await user.save({ validateBeforeSave: false });
    // 📧 Send email
    try {
        await (0, sendVerificationEmail_1.sendVerificationEmail)(email, newCode);
    }
    catch (error) {
        console.error("Email send failed:", error);
        throw new ApiError_1.ApiError(500, "Failed to send verification email");
    }
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, {}, "New verification code sent to your email"));
});
exports.resendVerificationCodeController = resendVerificationCodeController;
// Controller for change password
const changePasswordController = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    // Validate input
    if (!email || !oldPassword || !newPassword) {
        throw new ApiError_1.ApiError(400, "Email, old password, and new password are required");
    }
    if (newPassword.length < 6) {
        throw new ApiError_1.ApiError(400, "New password must be at least 6 characters long");
    }
    // Find user
    const user = await users_model_1.User.findOne({ email });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    // Prevent changing password for Google-authenticated users
    if (user.isGoogleAuthenticated) {
        throw new ApiError_1.ApiError(400, "Google-authenticated users cannot change password manually");
    }
    // Verify old password
    const isMatch = await user.isPasswordCorrect(oldPassword);
    if (!isMatch)
        throw new ApiError_1.ApiError(400, "Old password is incorrect");
    // Update password
    user.password = newPassword;
    await user.save();
    // Create security event
    await security_event_model_1.SecurityEvent.create({
        userId: user._id,
        type: "PASSWORD_CHANGED",
        message: "Password changed",
    });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, {}, "Password changed successfully"));
});
exports.changePasswordController = changePasswordController;
// Controller for change password
const setPasswordController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const { newPassword } = req.body;
    // Validate input
    if (!newPassword) {
        throw new ApiError_1.ApiError(400, "New password are required to set");
    }
    if (newPassword.length < 6) {
        throw new ApiError_1.ApiError(400, "New password must be at least 6 characters long");
    }
    // Find user
    const user = await users_model_1.User.findOne({ userId });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    // check user is using google account and there was not password filed in data base then set password
    const isGoogleAuthenticated = user.isGoogleAuthenticated;
    if (isGoogleAuthenticated && !user.password) {
        user.password = newPassword;
        await user.save();
    }
    // Create security event
    await security_event_model_1.SecurityEvent.create({
        userId: user._id,
        type: "PASSWORD_CHANGED",
        message: "Set a new password",
    });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, {}, "Password changed successfully"));
});
exports.setPasswordController = setPasswordController;
//Controller for reset password
const resetPasswordController = (0, asyncHandler_1.default)(async (req, res) => {
    const { password, confirmPassword, email } = req.body;
    // Validate input
    if (!email || !password || !confirmPassword) {
        throw new ApiError_1.ApiError(400, "Email, password, and confirm password are required");
    }
    if (password !== confirmPassword) {
        throw new ApiError_1.ApiError(400, "Passwords do not match");
    }
    if (password.length < 6) {
        throw new ApiError_1.ApiError(400, "Password must be at least 6 characters long");
    }
    // Find user
    const user = await users_model_1.User.findOne({ email });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    // Prevent reset for Google-authenticated users
    if (user.isGoogleAuthenticated) {
        throw new ApiError_1.ApiError(400, "Google-authenticated users cannot reset password manually");
    }
    // Update password
    user.password = password;
    await user.save();
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, {}, "Password reset successfully"));
});
exports.resetPasswordController = resetPasswordController;
// Controller for verifying OTP (generic, reusable)
const verifyOTPController = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code)
        throw new ApiError_1.ApiError(400, "Email and code required");
    const user = await users_model_1.User.findOne({ email });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    const now = new Date();
    if (!user.verificationCode || user.verificationCode !== code) {
        throw new ApiError_1.ApiError(400, "Invalid verification code");
    }
    if (!user.verificationCodeExpires || user.verificationCodeExpires < now) {
        throw new ApiError_1.ApiError(400, "Verification code has expired");
    }
    //   Just clear code after success
    user.verificationCode = "";
    user.verificationCodeExpires = null;
    user.lastVerificationSentAt = null;
    await user.save();
    res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, {}, "Verification successful"));
});
exports.verifyOTPController = verifyOTPController;
// Controller for resend-2fa
const send2FACodeController = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const user = await users_model_1.User.findById(userId);
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    // if (!user || !user.isTwoFactorEnabled) {
    //   throw new ApiError(404, "User not found or 2FA is not enabled");
    // }
    const now = new Date();
    // const waitTime = 60 * 1000; // 1 minute
    if (user.twoFactorCodeExpires &&
        user.twoFactorCodeExpires.getTime() - now.getTime() > 9 * 60 * 1000) {
        throw new ApiError_1.ApiError(429, "Please wait before requesting a new code");
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorCode = code;
    user.twoFactorCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 mins
    await user.save({ validateBeforeSave: false });
    await (0, sendTwoFactorCodeEmail_1.sendTwoFactorCodeEmail)(user.email, code);
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, {}, "2FA code sent to email"));
});
exports.send2FACodeController = send2FACodeController;
// Controller for verify-2fa
const verifyTwoFactorCodeController = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, code } = req.body;
    if (!code || code.length !== 6) {
        throw new ApiError_1.ApiError(400, "2FA code must be a 6-digit number");
    }
    const user = await users_model_1.User.findOne({ email });
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    if (!user.twoFactorCode || !user.twoFactorCodeExpires) {
        throw new ApiError_1.ApiError(400, "No 2FA code set or it has expired");
    }
    if (user.twoFactorCode !== code) {
        throw new ApiError_1.ApiError(401, "Invalid 2FA code");
    }
    if (user.twoFactorCodeExpires < new Date()) {
        throw new ApiError_1.ApiError(401, "2FA code has expired");
    }
    // Clear the code & enable 2FA
    user.twoFactorCode = "";
    user.twoFactorCodeExpires = null;
    user.isTwoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });
    // Log security event
    await security_event_model_1.SecurityEvent.create({
        userId: user._id,
        type: "2FA_ENABLED",
        message: "2FA enabled successfully",
    });
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    const freshUser = await users_model_1.User.findById(user._id).select("-password -refreshToken");
    if (!freshUser)
        throw new ApiError_1.ApiError(404, "User not found");
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions_1.cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions_1.cookieOptions)
        .json(new ApiResponse_1.ApiResponse(200, { user: freshUser, accessToken, refreshToken }, "2FA verified successfully"));
});
exports.verifyTwoFactorCodeController = verifyTwoFactorCodeController;
// Controller for toggle-2fa
const toggleTwoFactorAuthController = (0, asyncHandler_1.default)(async (req, res) => {
    const { enable } = req.body;
    const userId = req.user?._id;
    if (!userId)
        throw new ApiError_1.ApiError(401, "Unauthorized");
    const user = await users_model_1.User.findById(userId);
    if (!user)
        throw new ApiError_1.ApiError(404, "User not found");
    if (enable !== false) {
        throw new ApiError_1.ApiError(400, "Use /verify-2fa to enable 2FA after verification");
    }
    user.isTwoFactorEnabled = false;
    await user.save({ validateBeforeSave: false });
    // Log security event
    await security_event_model_1.SecurityEvent.create({
        userId,
        type: "2FA_DISABLED",
        message: "2FA disabled successfully",
    });
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, { isTwoFactorEnabled: false }, "2FA disabled successfully"));
});
exports.toggleTwoFactorAuthController = toggleTwoFactorAuthController;
