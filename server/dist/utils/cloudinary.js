"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadOnCloudinary = exports.deleteFromCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: "./.env"
});
// configuration of cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath)
            return null;
        const response = await cloudinary_1.v2.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // delete local file after upload on cloudinary
        fs_1.default.unlinkSync(localFilePath);
        return response;
    }
    catch (error) {
        console.log("cloudinary upload error: ", error);
        fs_1.default.unlinkSync(localFilePath);
        return null;
    }
};
exports.uploadOnCloudinary = uploadOnCloudinary;
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId)
            return null;
        const response = await cloudinary_1.v2.uploader.destroy(publicId);
        return response;
    }
    catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return null;
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
