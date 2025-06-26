import { v2 as cloudinary } from 'cloudinary';
import type{ UploadApiResponse } from 'cloudinary';
import fs from "fs"
import dotenv from "dotenv";

dotenv.config({
    path:"./.env"
});


// configuration of cloudinary
 cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (localFilePath: string): Promise<UploadApiResponse | null> => {
    try{
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(
            localFilePath, {
       resource_type: "auto"
    });
    // delete local file after upload on cloudinary
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("cloudinary upload error: ",error)
    fs.unlinkSync(localFilePath);
    return null;
  }
};


export const deleteFromCloudinary = async (
  publicId: string
): Promise<UploadApiResponse | null> => {
  try {
    if (!publicId) return null;

    const response: UploadApiResponse = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return null;
  }
};


export {
    uploadOnCloudinary
}