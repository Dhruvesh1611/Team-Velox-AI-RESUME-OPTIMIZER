import { v2 as cloudinary } from "cloudinary";

type CloudinaryUploadResult = {
  secure_url?: string;
};

let isConfigured = false;

function configureCloudinary() {
  if (isConfigured) {
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary environment variables.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isConfigured = true;
}

export async function uploadToCloudinary(file: string): Promise<string> {
  if (!file.trim()) {
    throw new Error("File content is required for Cloudinary upload.");
  }

  configureCloudinary();

  const result = (await cloudinary.uploader.upload(file, {
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER ?? "resume-optimizer",
    resource_type: "auto",
  })) as CloudinaryUploadResult;

  if (!result.secure_url) {
    throw new Error("Cloudinary upload did not return a secure URL.");
  }

  return result.secure_url;
}
